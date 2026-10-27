from compis.application.access import load_actor, require_member
from compis.application.ports import UnitOfWork
from compis.application.services.activity import ActivityService
from compis.domain.entities import ShoppingItem, ShoppingList
from compis.domain.errors import ConflictError, NotFoundError, ValidationError


class ShoppingService:
    def __init__(self, uow: UnitOfWork, activity: ActivityService) -> None:
        self._uow = uow
        self._activity = activity

    def get_list(self, actor_id: int, home_id: int) -> ShoppingList:
        actor = load_actor(self._uow, actor_id)
        require_member(actor, home_id)
        shopping_list = self._uow.shopping.get_list_by_home(home_id)
        if shopping_list is None:
            raise NotFoundError("No hay lista de la compra para esta vivienda")
        return shopping_list

    def list_items(
        self, actor_id: int, list_id: int, purchased: bool = False
    ) -> list[ShoppingItem]:
        self._load_list_for_member(actor_id, list_id)
        return self._uow.shopping.list_items(list_id, purchased)

    def add_item(self, actor_id: int, list_id: int, name: str) -> ShoppingItem:
        actor, shopping_list = self._load_list_for_member(actor_id, list_id)
        name = name.strip()
        if not name:
            raise ValidationError("Faltan campos por completar")
        item = self._uow.shopping.add_item(ShoppingItem(name=name, shopping_list_id=list_id))
        self._activity.record(
            shopping_list.home_id,
            f"Nuevo elemento agregado a la lista: {item.name}",
            actor.first_name,
        )
        self._uow.commit()
        return item

    def delete_item(self, actor_id: int, item_id: int) -> None:
        item = self._uow.shopping.get_item(item_id)
        if item is None:
            raise NotFoundError("El elemento no existe")
        actor, shopping_list = self._load_list_for_member(actor_id, item.shopping_list_id)
        if item.expense_id is not None:
            raise ConflictError("El elemento ya está marcado como comprado")
        self._uow.shopping.delete_item(item_id)
        self._activity.record(
            shopping_list.home_id,
            f"Elemento eliminado por {actor.first_name}: {item.name}",
            actor.first_name,
        )
        self._uow.commit()

    def _load_list_for_member(self, actor_id: int, list_id: int):
        actor = load_actor(self._uow, actor_id)
        shopping_list = self._uow.shopping.get_list(list_id)
        if shopping_list is None:
            raise NotFoundError("Lista de la compra no encontrada")
        require_member(actor, shopping_list.home_id)
        return actor, shopping_list
