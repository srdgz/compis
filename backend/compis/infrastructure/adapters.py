from datetime import date, datetime

from flask_bcrypt import Bcrypt
from flask_mail import Mail, Message


class BcryptPasswordHasher:
    def __init__(self) -> None:
        self._bcrypt = Bcrypt()

    def hash(self, password: str) -> str:
        return self._bcrypt.generate_password_hash(password).decode("utf-8")

    def verify(self, password_hash: str, password: str) -> bool:
        if not password_hash:
            return False
        return self._bcrypt.check_password_hash(password_hash, password)


class SystemClock:
    def now(self) -> datetime:
        return datetime.now()

    def today(self) -> date:
        return date.today()


class FlaskMailMailer:
    def __init__(self, mail: Mail, sender: str) -> None:
        self._mail = mail
        self._sender = sender

    def send(self, subject: str, html: str, recipients: list[str]) -> None:
        targets: list[str | tuple[str, str]] = list(recipients)
        message = Message(subject, sender=self._sender, recipients=targets, html=html)
        self._mail.send(message)


class NullMailer:
    def send(self, subject: str, html: str, recipients: list[str]) -> None:
        return None
