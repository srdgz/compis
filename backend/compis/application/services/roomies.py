from compis.application.access import (
    load_actor,
    load_roomie,
    require_can_manage,
    require_member,
)
from compis.application.ports import PasswordHasher, UnitOfWork
from compis.domain.entities import Roomie
from compis.domain.errors import PermissionDeniedError, ValidationError

UNSET = object()


class RoomieService:
    def __init__(self, uow: UnitOfWork, hasher: PasswordHasher) -> None:
        self._uow = uow
        self._hasher = hasher

    def get(self, actor_id: int, roomie_id: int) -> Roomie:
        actor = load_actor(self._uow, actor_id)
        roomie = load_roomie(self._uow, roomie_id)
        require_can_manage(actor, roomie)
        return roomie

    def list_by_home(self, actor_id: int, home_id: int) -> list[Roomie]:
        actor = load_actor(self._uow, actor_id)
        require_member(actor, home_id)
        return self._uow.roomies.list_by_home(home_id)

    def update_profile(
        self,
        actor_id: int,
        roomie_id: int,
        first_name: object = UNSET,
        last_name: object = UNSET,
        avatar: object = UNSET,
        paypal_username: object = UNSET,
        password: object = UNSET,
    ) -> Roomie:
        actor = load_actor(self._uow, actor_id)
        if actor.id != roomie_id:
            raise PermissionDeniedError("Solo puedes editar tu propio perfil")
        if first_name is not UNSET:
            if not isinstance(first_name, str) or not first_name.strip():
                raise ValidationError("El nombre es obligatorio")
            actor.first_name = first_name.strip()
        if last_name is not UNSET:
            actor.last_name = last_name if isinstance(last_name, str) else None
        if avatar is not UNSET:
            actor.avatar = avatar if isinstance(avatar, str) else None
        if paypal_username is not UNSET:
            cleaned = paypal_username.strip() if isinstance(paypal_username, str) else ""
            actor.paypal_username = cleaned or None
        if password is not UNSET:
            if not isinstance(password, str) or len(password) < 8:
                raise ValidationError("La contraseña debe tener al menos 8 caracteres")
            actor.password_hash = self._hasher.hash(password)
        self._uow.roomies.save(actor)
        self._uow.commit()
        return actor

    def deactivate(self, actor_id: int, roomie_id: int) -> Roomie:
        actor = load_actor(self._uow, actor_id)
        if actor.id != roomie_id:
            raise PermissionDeniedError("Solo puedes eliminar tu propia cuenta")
        if actor.home_id is not None:
            raise PermissionDeniedError("No puedes desactivar a un roomie asociado a una vivienda")
        tag = f"roomieeliminado{actor.id}"
        actor.email = f"{tag}@compis.invalid"
        actor.password_hash = ""
        actor.first_name = tag
        actor.last_name = None
        actor.avatar = None
        actor.paypal_username = None
        actor.is_active = False
        self._uow.roomies.save(actor)
        self._uow.commit()
        return actor
