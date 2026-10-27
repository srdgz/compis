import base64
from decimal import Decimal
from typing import Any

import requests

from compis.application.ports import CaptureResult
from compis.domain.errors import PaymentGatewayError

SANDBOX_URL = "https://api-m.sandbox.paypal.com"
TIMEOUT_SECONDS = 10
CURRENCY = "EUR"


class PayPalSandboxGateway:
    def __init__(self, client_id: str, client_secret: str, http: Any = requests) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._http = http

    def create_order(self, amount_cents: int, reference: str) -> str:
        body = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": reference,
                    "amount": {
                        "currency_code": CURRENCY,
                        "value": f"{Decimal(amount_cents) / 100:.2f}",
                    },
                }
            ],
        }
        data = self._call("/v2/checkout/orders", body)
        order_id = data.get("id")
        if not isinstance(order_id, str):
            raise PaymentGatewayError("PayPal no ha devuelto el pedido")
        return order_id

    def capture_order(self, order_id: str) -> CaptureResult:
        data = self._call(f"/v2/checkout/orders/{order_id}/capture", None)
        try:
            unit = data["purchase_units"][0]
            capture = unit["payments"]["captures"][0]
            amount = capture["amount"]
            return CaptureResult(
                status=str(capture["status"]),
                amount_cents=int(Decimal(amount["value"]) * 100),
                currency=str(amount["currency_code"]),
                reference=str(unit.get("reference_id", "")),
            )
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise PaymentGatewayError("La respuesta de PayPal no es válida") from error

    def _call(self, path: str, body: dict | None) -> dict:
        try:
            response = self._http.post(
                f"{SANDBOX_URL}{path}",
                json=body,
                headers={
                    "Authorization": f"Bearer {self._access_token()}",
                    "Content-Type": "application/json",
                },
                timeout=TIMEOUT_SECONDS,
            )
        except requests.RequestException as error:
            raise PaymentGatewayError("No se ha podido contactar con PayPal") from error
        if not 200 <= response.status_code < 300:
            raise PaymentGatewayError("PayPal ha rechazado la operación")
        return response.json()

    def _access_token(self) -> str:
        credentials = base64.b64encode(f"{self._client_id}:{self._client_secret}".encode()).decode()
        try:
            response = self._http.post(
                f"{SANDBOX_URL}/v1/oauth2/token",
                data={"grant_type": "client_credentials"},
                headers={"Authorization": f"Basic {credentials}"},
                timeout=TIMEOUT_SECONDS,
            )
        except requests.RequestException as error:
            raise PaymentGatewayError("No se ha podido contactar con PayPal") from error
        token = response.json().get("access_token") if response.status_code == 200 else None
        if not isinstance(token, str):
            raise PaymentGatewayError("No se ha podido autenticar con PayPal")
        return token
