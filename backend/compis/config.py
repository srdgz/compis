import os
from dataclasses import dataclass


def _flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _database_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///compis.db")
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


@dataclass(frozen=True)
class Settings:
    database_url: str = "sqlite://"
    jwt_secret_key: str = "test-secret-key-with-enough-length-1234"
    jwt_expires_hours: int = 8
    cors_origins: tuple[str, ...] = ("http://localhost:3000",)
    mail_server: str = ""
    mail_port: int = 587
    mail_username: str = ""
    mail_password: str = ""
    mail_use_tls: bool = True
    mail_use_ssl: bool = False
    mail_sender: str = "no-reply@compis.app"
    cron_secret: str = ""
    paypal_demo_client_id: str = ""
    paypal_demo_client_secret: str = ""
    testing: bool = False

    @classmethod
    def from_env(cls) -> "Settings":
        secret = os.getenv("JWT_SECRET_KEY", "")
        if len(secret) < 32:
            raise RuntimeError("JWT_SECRET_KEY must be set and at least 32 characters long")
        origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
        return cls(
            database_url=_database_url(),
            jwt_secret_key=secret,
            jwt_expires_hours=int(os.getenv("JWT_EXPIRES_HOURS", "8")),
            cors_origins=tuple(o.strip() for o in origins.split(",") if o.strip()),
            mail_server=os.getenv("MAIL_SERVER", ""),
            mail_port=int(os.getenv("MAIL_PORT", "587")),
            mail_username=os.getenv("MAIL_USERNAME", ""),
            mail_password=os.getenv("MAIL_PASSWORD", ""),
            mail_use_tls=_flag("MAIL_USE_TLS", True),
            mail_use_ssl=_flag("MAIL_USE_SSL", False),
            mail_sender=os.getenv("MAIL_SENDER", "no-reply@compis.app"),
            cron_secret=os.getenv("CRON_SECRET", ""),
            paypal_demo_client_id=os.getenv("PAYPAL_DEMO_CLIENT_ID", ""),
            paypal_demo_client_secret=os.getenv("PAYPAL_DEMO_CLIENT_SECRET", ""),
        )
