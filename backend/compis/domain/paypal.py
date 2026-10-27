import re

from compis.domain.errors import ValidationError

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9]{3,20}$")
LINK_PREFIX = re.compile(r"^(?:https?://)?(?:www\.)?paypal\.me/", re.IGNORECASE)


def normalise_paypal_username(raw: str | None) -> str | None:
    if raw is None:
        return None
    value = LINK_PREFIX.sub("", raw.strip()).split("/")[0].split("?")[0]
    if not value:
        return None
    if not USERNAME_PATTERN.match(value):
        raise ValidationError(
            "El usuario de PayPal.Me debe tener entre 3 y 20 letras o números, sin espacios"
        )
    return value
