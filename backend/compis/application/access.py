from compis.application.ports import UnitOfWork
from compis.domain.entities import Roomie
from compis.domain.errors import NotFoundError, PermissionDeniedError


def load_actor(uow: UnitOfWork, actor_id: int) -> Roomie:
    actor = uow.roomies.get(actor_id)
    if actor is None or not actor.is_active:
        raise PermissionDeniedError("El usuario no existe")
    return actor


def load_roomie(uow: UnitOfWork, roomie_id: int) -> Roomie:
    roomie = uow.roomies.get(roomie_id)
    if roomie is None:
        raise NotFoundError("Este roomie no existe")
    return roomie


def require_member(actor: Roomie, home_id: int) -> None:
    if actor.home_id is None or actor.home_id != home_id:
        raise PermissionDeniedError("No perteneces a esta vivienda")


def require_admin(actor: Roomie, home_id: int) -> None:
    require_member(actor, home_id)
    if not actor.is_admin:
        raise PermissionDeniedError("Solo el administrador puede hacer esto")


def require_can_manage(actor: Roomie, other: Roomie) -> None:
    if not actor.can_manage(other):
        raise PermissionDeniedError("No tienes permiso para acceder a este roomie")
