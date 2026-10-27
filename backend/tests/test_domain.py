from datetime import date

import pytest

from compis.domain.entities import Debt, DebtStatus
from compis.domain.errors import PermissionDeniedError, ValidationError
from compis.domain.money import format_euros, split_equally, to_cents, to_euros


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


def test_debt_can_be_marked_paid_by_debtor_or_creditor():
    for actor in (1, 2):
        debt = make_debt()
        assert debt.mark_paid(actor) is True
        assert debt.status == DebtStatus.PAID


def test_debt_mark_paid_is_idempotent():
    debt = make_debt()
    debt.mark_paid(2)
    assert debt.mark_paid(2) is False


def test_third_party_cannot_mark_debt_paid():
    with pytest.raises(PermissionDeniedError):
        make_debt().mark_paid(3)
