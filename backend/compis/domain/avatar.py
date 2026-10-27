from urllib.parse import urlparse

from compis.domain.errors import ValidationError

MAX_LENGTH = 300


def normalise_avatar_url(raw: str | None) -> str | None:
    if raw is None:
        return None
    value = raw.strip()
    if not value:
        return None
    parsed = urlparse(value)
    if len(value) > MAX_LENGTH or parsed.scheme != "https" or not parsed.netloc:
        raise ValidationError("La imagen de perfil debe ser un enlace https válido")
    return value
