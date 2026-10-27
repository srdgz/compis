import re

from compis.application.ports import PasswordHasher, UnitOfWork
from compis.domain.entities import Roomie
from compis.domain.errors import AuthenticationError, ConflictError, ValidationError

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8
INVALID_CREDENTIALS = "El email o la contraseña no son correctos"


class AuthService:
    def __init__(self, uow: UnitOfWork, hasher: PasswordHasher) -> None:
        self._uow = uow
        self._hasher = hasher

    def signup(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str | None = None,
        avatar: str | None = None,
    ) -> Roomie:
        email = email.strip().lower()
        if not EMAIL_PATTERN.match(email):
            raise ValidationError("El email no es válido")
        if len(password) < MIN_PASSWORD_LENGTH:
            raise ValidationError(
                f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres"
            )
        if not first_name.strip():
            raise ValidationError("El nombre es obligatorio")
        if self._uow.roomies.get_by_email(email) is not None:
            raise ConflictError("Este roomie ya existe")
        roomie = self._uow.roomies.add(
            Roomie(
                email=email,
                password_hash=self._hasher.hash(password),
                first_name=first_name.strip(),
                last_name=last_name,
                avatar=avatar,
            )
        )
        self._uow.commit()
        return roomie

    def login(self, email: str, password: str) -> Roomie:
        roomie = self._uow.roomies.get_by_email(email.strip().lower())
        if (
            roomie is None
            or not roomie.is_active
            or not self._hasher.verify(roomie.password_hash, password)
        ):
            raise AuthenticationError(INVALID_CREDENTIALS)
        return roomie
