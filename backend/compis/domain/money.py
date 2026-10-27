from decimal import ROUND_HALF_UP, Decimal

from compis.domain.errors import ValidationError


def to_cents(amount: float | int | str | Decimal) -> int:
    try:
        value = Decimal(str(amount))
    except Exception as error:
        raise ValidationError("El importe no es válido") from error
    if not value.is_finite() or value <= 0:
        raise ValidationError("El importe debe ser mayor que cero")
    return int((value * 100).quantize(Decimal(1), rounding=ROUND_HALF_UP))


def to_euros(cents: int | None) -> float | None:
    if cents is None:
        return None
    return cents / 100


def split_equally(total_cents: int, debtor_count: int) -> int:
    if debtor_count < 1:
        raise ValidationError("Selecciona al menos un roomie")
    return total_cents // (debtor_count + 1)


def format_euros(cents: int) -> str:
    return f"{cents / 100:.2f}".replace(".", ",")
