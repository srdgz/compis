from datetime import date

import pytest

from compis.domain.avatar import normalise_avatar_url
from compis.domain.entities import Debt, DebtStatus
from compis.domain.errors import ConflictError, PermissionDeniedError, ValidationError
from compis.domain.money import format_euros, split_equally, to_cents, to_euros
from compis.domain.paypal import normalise_paypal_username


def make_debt() -> Debt:
    return Debt(
        name="Compra",
        amount_cents=1500,
        date=date(2026, 11, 2),
        roomie_debtor_id=2,
        roomie_paying_id=1,
        expense_id=1,
    )


def test_to_cents_rounds_half_up():
    assert to_cents(12.5) == 1250
    assert to_cents("0.005") == 1
    assert to_cents(19.99) == 1999


@pytest.mark.parametrize("value", [0, -3, "abc", float("nan"), float("inf")])
def test_to_cents_rejects_invalid_amounts(value):
    with pytest.raises(ValidationError):
        to_cents(value)


def test_split_equally_includes_the_payer():
    assert split_equally(4590, 2) == 1530
    assert split_equally(1000, 2) == 333


def test_split_requires_a_debtor():
    with pytest.raises(ValidationError):
        split_equally(1000, 0)


def test_euro_conversions():
    assert to_euros(1250) == 12.5
    assert to_euros(None) is None
    assert format_euros(1250) == "12,50"


def test_only_the_debtor_reports_a_payment():
    debt = make_debt()
    assert debt.report_paid(2, "cash") is True
    assert (debt.status, debt.payment_method) == (DebtStatus.PAID, "cash")
    assert debt.report_paid(2, "cash") is False
    with pytest.raises(PermissionDeniedError):
        make_debt().report_paid(1, "cash")
    with pytest.raises(ValidationError):
        make_debt().report_paid(2, "bizum")
    with pytest.raises(ValidationError):
        make_debt().report_paid(2, "paypal_sandbox")


def test_only_the_creditor_confirms_or_rejects():
    debt = make_debt()
    with pytest.raises(PermissionDeniedError):
        debt.confirm(2)
    with pytest.raises(ConflictError):
        debt.reject(1)
    debt.report_paid(2, "cash")
    with pytest.raises(PermissionDeniedError):
        debt.reject(2)
    debt.reject(1)
    assert (debt.status, debt.payment_method) == (DebtStatus.PENDING, None)
    assert debt.confirm(1) is True
    assert debt.is_settled
    assert debt.confirm(1) is False


def test_settled_debts_cannot_be_reported_again():
    debt = make_debt()
    debt.confirm(1)
    with pytest.raises(ConflictError):
        debt.report_paid(2, "cash")


def test_gateway_settlement_is_limited_to_the_debtor():
    debt = make_debt()
    with pytest.raises(PermissionDeniedError):
        debt.settle_with_gateway(1)
    assert debt.settle_with_gateway(2) is True
    assert (debt.status, debt.payment_method) == (DebtStatus.CONFIRMED, "paypal_sandbox")
    assert debt.settle_with_gateway(2) is False


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("lucia", "lucia"),
        ("  Lucia99 ", "Lucia99"),
        ("https://www.paypal.me/lucia", "lucia"),
        ("paypal.me/lucia/12", "lucia"),
        ("", None),
        (None, None),
    ],
)
def test_paypal_username_normalisation(raw, expected):
    assert normalise_paypal_username(raw) == expected


@pytest.mark.parametrize("raw", ["ab", "lucia garcia", "lucia!", "x" * 21])
def test_paypal_username_rejects_invalid_values(raw):
    with pytest.raises(ValidationError):
        normalise_paypal_username(raw)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (
            "https://res.cloudinary.com/demo/image/upload/v1/me.jpg",
            "https://res.cloudinary.com/demo/image/upload/v1/me.jpg",
        ),
        ("  https://example.com/a.png  ", "https://example.com/a.png"),
        ("", None),
        ("   ", None),
        (None, None),
    ],
)
def test_avatar_url_normalisation(raw, expected):
    assert normalise_avatar_url(raw) == expected


@pytest.mark.parametrize(
    "raw",
    [
        "http://example.com/a.png",
        "javascript:alert(1)",
        "data:image/png;base64,AAAA",
        "not a url",
        "https://" + "a" * 300,
    ],
)
def test_avatar_url_rejects_unsafe_values(raw):
    with pytest.raises(ValidationError):
        normalise_avatar_url(raw)
