from urllib.parse import urlparse

from compis.domain.errors import ValidationError

MAX_LENGTH = 300


def media_prefix(cloud_name: str) -> str | None:
    name = cloud_name.strip()
    return f"https://res.cloudinary.com/{name}/" if name else None


def normalise_avatar_url(raw: str | None, allowed_prefix: str | None = None) -> str | None:
    if raw is None:
        return None
    value = raw.strip()
    if not value:
        return None
    parsed = urlparse(value)
    if len(value) > MAX_LENGTH or parsed.scheme != "https" or not parsed.netloc:
        raise ValidationError("La imagen de perfil debe ser un enlace https válido")
    if allowed_prefix and not value.startswith(allowed_prefix):
        raise ValidationError("La imagen de perfil debe subirse desde la propia aplicación")
    return value
