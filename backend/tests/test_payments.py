from types import SimpleNamespace

import pytest
import requests

from compis.application.ports import CaptureResult
from compis.bootstrap import create_app
from compis.config import Settings
from compis.domain.errors import PaymentGatewayError
from compis.infrastructure.db.extensions import db
from compis.infrastructure.paypal import PayPalSandboxGateway


def make_debt(flat):
    owner, marcos = flat["owner"], flat["marcos"]
    ids = [
        owner.post("/api/item", json={"name": n, "shopping_list_id": flat["list_id"]}).get_json()[
            "id"
        ]
        for n in ("Leche", "Pan")
    ]
    expense = owner.post("/api/expense", json={"expense_name": "Compra", "item_ids": ids})
    owner.post(
        "/api/debts",
        json={
            "expense_id": expense.get_json()["expense"]["id"],
            "debtor_ids": [marcos.id],
            "total_amount": 24.5,
        },
    )
    return marcos.get(f"/api/debts/roomie/{marcos.id}").get_json()[0]["id"]


def test_config_exposes_the_public_client_id(client):
    config = client.get("/api/config").get_json()
    assert config == {"paypal_demo": {"enabled": True, "client_id": "demo-client"}}


def test_demo_mode_is_off_without_a_gateway(clock, mailer):
    app = create_app(Settings(testing=True), clock=clock, mailer=mailer)
    with app.app_context():
        db.create_all()
        client = app.test_client()
        assert client.get("/api/config").get_json() == {
            "paypal_demo": {"enabled": False, "client_id": None}
        }
        client.post(
            "/api/signup",
            json={"email": "a@example.com", "password": "password-123", "first_name": "A"},
        )
        token = client.post(
            "/api/login", json={"email": "a@example.com", "password": "password-123"}
        ).get_json()["token"]
        response = client.post(
            "/api/payments/paypal/orders",
            json={"debt_id": 1},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        db.drop_all()


def test_paying_in_demo_mode_settles_the_debt(flat, gateway):
    marcos = flat["marcos"]
    debt_id = make_debt(flat)

    order = marcos.post("/api/payments/paypal/orders", json={"debt_id": debt_id})
    assert order.status_code == 201
    order_id = order.get_json()["order_id"]
    assert gateway.orders[order_id] == (1225, f"debt-{debt_id}")

    captured = marcos.post(
        "/api/payments/paypal/capture", json={"debt_id": debt_id, "order_id": order_id}
    )
    assert captured.get_json()["message"] == "Pago completado"
    settled = marcos.get(f"/api/debts/roomie/{marcos.id}?include_settled=true").get_json()[0]
    assert (settled["status"], settled["payment_method"]) == ("Confirmada", "paypal_sandbox")

    repeat = marcos.post(
        "/api/payments/paypal/capture", json={"debt_id": debt_id, "order_id": order_id}
    )
    assert repeat.status_code == 409


def test_only_the_debtor_can_start_a_demo_payment(flat):
    debt_id = make_debt(flat)
    for session in (flat["owner"], flat["aitana"]):
        response = session.post("/api/payments/paypal/orders", json={"debt_id": debt_id})
        assert response.status_code == 403
    assert (
        flat["marcos"].post("/api/payments/paypal/orders", json={"debt_id": 999}).status_code == 404
    )


@pytest.mark.parametrize(
    "result",
    [
        CaptureResult("PENDING", 1225, "EUR", "debt-1"),
        CaptureResult("COMPLETED", 100, "EUR", "debt-1"),
        CaptureResult("COMPLETED", 1225, "USD", "debt-1"),
        CaptureResult("COMPLETED", 1225, "EUR", "debt-99"),
    ],
)
def test_capture_that_does_not_match_the_debt_is_rejected(flat, gateway, result):
    marcos = flat["marcos"]
    debt_id = make_debt(flat)
    order_id = marcos.post("/api/payments/paypal/orders", json={"debt_id": debt_id}).get_json()[
        "order_id"
    ]
    gateway.capture_overrides[order_id] = result
    response = marcos.post(
        "/api/payments/paypal/capture", json={"debt_id": debt_id, "order_id": order_id}
    )
    assert response.status_code == 409
    debt = marcos.get(f"/api/debts/roomie/{marcos.id}").get_json()[0]
    assert debt["status"] == "Pendiente"


def test_profile_accepts_paypal_me_links_and_rejects_bad_names(flat):
    marcos = flat["marcos"]
    ok = marcos.put(
        f"/api/roomie/{marcos.id}", json={"paypal_username": "https://paypal.me/marcos"}
    )
    assert ok.get_json()["paypal_username"] == "marcos"
    bad = marcos.put(f"/api/roomie/{marcos.id}", json={"paypal_username": "marcos garcia"})
    assert bad.status_code == 400
    cleared = marcos.put(f"/api/roomie/{marcos.id}", json={"paypal_username": ""})
    assert cleared.get_json()["paypal_username"] is None


class FakeHttp:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def post(self, url, **kwargs):
        self.calls.append((url, kwargs))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def reply(status, payload):
    return SimpleNamespace(status_code=status, json=lambda: payload)


TOKEN = reply(200, {"access_token": "tok"})


def test_gateway_creates_orders_in_euros():
    http = FakeHttp([TOKEN, reply(201, {"id": "ORD1"})])
    gateway = PayPalSandboxGateway("id", "secret", http)
    assert gateway.create_order(1225, "debt-5") == "ORD1"
    url, kwargs = http.calls[1]
    assert url == "https://api-m.sandbox.paypal.com/v2/checkout/orders"
    assert kwargs["headers"]["Authorization"] == "Bearer tok"
    unit = kwargs["json"]["purchase_units"][0]
    assert unit["amount"] == {"currency_code": "EUR", "value": "12.25"}
    assert unit["reference_id"] == "debt-5"


def test_gateway_parses_captures():
    payload = {
        "purchase_units": [
            {
                "reference_id": "debt-5",
                "payments": {
                    "captures": [
                        {
                            "status": "COMPLETED",
                            "amount": {"value": "12.25", "currency_code": "EUR"},
                        }
                    ]
                },
            }
        ]
    }
    gateway = PayPalSandboxGateway("id", "secret", FakeHttp([TOKEN, reply(201, payload)]))
    assert gateway.capture_order("ORD1") == CaptureResult("COMPLETED", 1225, "EUR", "debt-5")


@pytest.mark.parametrize(
    "responses",
    [
        [reply(401, {})],
        [TOKEN, reply(500, {})],
        [TOKEN, reply(201, {"unexpected": True})],
        [requests.ConnectionError()],
        [TOKEN, requests.Timeout()],
    ],
)
def test_gateway_failures_become_domain_errors(responses):
    gateway = PayPalSandboxGateway("id", "secret", FakeHttp(responses))
    with pytest.raises(PaymentGatewayError):
        gateway.capture_order("ORD1")
