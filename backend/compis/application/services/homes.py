from compis.application.access import load_actor, load_roomie, require_admin, require_member
from compis.application.ports import UnitOfWork
from compis.application.services.activity import ActivityService
from compis.domain.entities import Home, Roomie, ShoppingList
from compis.domain.errors import ConflictError, NotFoundError, ValidationError


class HomeService:
    def __init__(self, uow: UnitOfWork, activity: ActivityService) -> None:
        self._uow = uow
        self._activity = activity

    def get(self, actor_id: int, home_id: int) -> Home:
        actor = load_actor(self._uow, actor_id)
        require_member(actor, home_id)
        return self._load_home(home_id)

    def create(self, actor_id: int, name: str) -> tuple[Home, ShoppingList]:
        actor = load_actor(self._uow, actor_id)
        name = name.strip()
        if not name:
            raise ValidationError("Es necesario introducir un nombre para la vivienda")
        if actor.home_id is not None:
            raise ConflictError("Ya perteneces a una vivienda")
        home = self._uow.homes.add(Home(name=name))
        assert home.id is not None
        shopping_list = self._uow.shopping.add_list(
            ShoppingList(name=f"Lista de la compra de {name}", home_id=home.id)
        )
        actor.home_id = home.id
        actor.is_admin = True
        self._uow.roomies.save(actor)
        self._uow.commit()
        return home, shopping_list

    def add_roomie(self, actor_id: int, home_id: int, email: str) -> Roomie:
        actor = load_actor(self._uow, actor_id)
        require_admin(actor, home_id)
        self._load_home(home_id)
        roomie = self._uow.roomies.get_by_email(email.strip().lower())
        if roomie is None or not roomie.is_active:
            raise NotFoundError(
                "No se encontró ningún compi con el correo electrónico proporcionado"
            )
        if roomie.home_id == home_id:
            raise ConflictError("Este compi ya está en la vivienda")
        if roomie.home_id is not None:
            raise ConflictError("Este compi ya tiene otra vivienda")
        roomie.home_id = home_id
        self._uow.roomies.save(roomie)
        self._activity.record(
            home_id, f"Nuevo compi agregado: {roomie.first_name}", actor.first_name
        )
        self._uow.commit()
        return roomie

    def remove_roomie(self, actor_id: int, home_id: int, roomie_id: int) -> None:
        actor = load_actor(self._uow, actor_id)
        require_admin(actor, home_id)
        roomie = load_roomie(self._uow, roomie_id)
        if roomie.home_id != home_id:
            raise ValidationError("El compi no pertenece a esta vivienda")
        if roomie.id == actor.id:
            raise ValidationError("No puedes eliminarte a ti mismo de la vivienda")
        assert roomie.id is not None
        if self._uow.debts.has_pending(roomie.id):
            raise ConflictError("El compi tiene deudas pendientes y no puede ser eliminado")
        roomie.home_id = None
        roomie.is_admin = False
        self._uow.roomies.save(roomie)
        self._activity.record(home_id, f"Compi eliminado: {roomie.first_name}", actor.first_name)
        self._uow.commit()

    def deactivate(self, actor_id: int, home_id: int) -> Home:
        actor = load_actor(self._uow, actor_id)
        require_admin(actor, home_id)
        home = self._load_home(home_id)
        for roomie in self._uow.roomies.list_by_home(home_id):
            roomie.home_id = None
            roomie.is_admin = False
            self._uow.roomies.save(roomie)
        home.is_active = False
        self._uow.homes.save(home)
        self._uow.commit()
        return home

    def _load_home(self, home_id: int) -> Home:
        home = self._uow.homes.get(home_id)
        if home is None or not home.is_active:
            raise NotFoundError("Esta vivienda no existe")
        return home
