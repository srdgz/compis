from dataclasses import fields
from datetime import datetime
from typing import Any

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session, scoped_session

from compis.domain.entities import (
    Activity,
    Debt,
    DebtStatus,
    Expense,
    FileRecord,
    Home,
    Roomie,
    ShoppingItem,
    ShoppingList,
    Task,
)
from compis.infrastructure.db.models import (
    ActivityRow,
    DebtRow,
    ExpenseRow,
    FileRow,
    HomeRow,
    RoomieRow,
    ShoppingItemRow,
    ShoppingListRow,
    TaskRow,
)

SessionLike = Session | scoped_session[Any]


class SqlRepository:
    entity: Any
    row: Any

    def __init__(self, session: SessionLike) -> None:
        self._session = session

    def add(self, entity: Any) -> Any:
        row = self.row()
        self._apply(row, entity)
        self._session.add(row)
        self._session.flush()
        entity.id = row.id
        return entity

    def get(self, entity_id: int) -> Any:
        row = self._session.get(self.row, entity_id)
        return self._to_entity(row) if row is not None else None

    def save(self, entity: Any) -> None:
        row = self._session.get(self.row, entity.id)
        assert row is not None
        self._apply(row, entity)
        self._session.flush()

    def delete(self, entity_id: int) -> None:
        self._session.execute(delete(self.row).where(self.row.id == entity_id))

    def _query(self, *conditions: Any) -> list[Any]:
        statement = select(self.row).where(*conditions).order_by(self.row.id)
        return [self._to_entity(row) for row in self._session.scalars(statement)]

    def _to_entity(self, row: Any) -> Any:
        return self.entity(**{f.name: getattr(row, f.name) for f in fields(self.entity)})

    def _apply(self, row: Any, entity: Any) -> None:
        for f in fields(self.entity):
            if f.name == "id" and entity.id is None:
                continue
            setattr(row, f.name, getattr(entity, f.name))


class SqlRoomieRepository(SqlRepository):
    entity = Roomie
    row = RoomieRow

    def get_by_email(self, email: str) -> Roomie | None:
        found = self._query(RoomieRow.email == email)
        return found[0] if found else None

    def list_by_home(self, home_id: int) -> list[Roomie]:
        return self._query(RoomieRow.home_id == home_id)


class SqlHomeRepository(SqlRepository):
    entity = Home
    row = HomeRow


class SqlTaskRepository(SqlRepository):
    entity = Task
    row = TaskRow

    def list_by_roomie(self, roomie_id: int) -> list[Task]:
        return self._query(TaskRow.roomie_id == roomie_id)

    def list_by_home(self, home_id: int) -> list[Task]:
        statement = (
            select(TaskRow)
            .join(RoomieRow, RoomieRow.id == TaskRow.roomie_id)
            .where(RoomieRow.home_id == home_id)
            .order_by(TaskRow.id)
        )
        return [self._to_entity(row) for row in self._session.scalars(statement)]


class SqlShoppingRepository:
    def __init__(self, session: SessionLike) -> None:
        self._session = session
        self._lists = _ShoppingLists(session)
        self._items = _ShoppingItems(session)

    def add_list(self, shopping_list: ShoppingList) -> ShoppingList:
        return self._lists.add(shopping_list)

    def get_list(self, list_id: int) -> ShoppingList | None:
        return self._lists.get(list_id)

    def get_list_by_home(self, home_id: int) -> ShoppingList | None:
        found = self._lists.query(ShoppingListRow.home_id == home_id)
        return found[0] if found else None

    def add_item(self, item: ShoppingItem) -> ShoppingItem:
        return self._items.add(item)

    def get_item(self, item_id: int) -> ShoppingItem | None:
        return self._items.get(item_id)

    def list_items(self, list_id: int, purchased: bool) -> list[ShoppingItem]:
        condition = (
            ShoppingItemRow.expense_id.is_not(None)
            if purchased
            else ShoppingItemRow.expense_id.is_(None)
        )
        return self._items.query(ShoppingItemRow.shopping_list_id == list_id, condition)

    def save_item(self, item: ShoppingItem) -> None:
        self._items.save(item)

    def delete_item(self, item_id: int) -> None:
        self._items.delete(item_id)


class _ShoppingLists(SqlRepository):
    entity = ShoppingList
    row = ShoppingListRow

    def query(self, *conditions: Any) -> list[ShoppingList]:
        return self._query(*conditions)


class _ShoppingItems(SqlRepository):
    entity = ShoppingItem
    row = ShoppingItemRow

    def query(self, *conditions: Any) -> list[ShoppingItem]:
        return self._query(*conditions)


class SqlExpenseRepository(SqlRepository):
    entity = Expense
    row = ExpenseRow

    def list_without_debts(self, roomie_id: int) -> list[Expense]:
        return self._query(ExpenseRow.roomie_id == roomie_id, ExpenseRow.debt_generated.is_(False))


class SqlDebtRepository(SqlRepository):
    entity = Debt
    row = DebtRow

    def list_for_roomie(self, roomie_id: int, pending_only: bool) -> list[Debt]:
        conditions: list[Any] = [
            or_(DebtRow.roomie_debtor_id == roomie_id, DebtRow.roomie_paying_id == roomie_id)
        ]
        if pending_only:
            conditions.append(DebtRow.status == DebtStatus.PENDING)
        return self._query(*conditions)

    def has_pending(self, roomie_id: int) -> bool:
        return bool(self.list_for_roomie(roomie_id, pending_only=True))


class SqlFileRepository(SqlRepository):
    entity = FileRecord
    row = FileRow

    def list_by_home(self, home_id: int) -> list[FileRecord]:
        return self._query(FileRow.home_id == home_id)


class SqlActivityRepository(SqlRepository):
    entity = Activity
    row = ActivityRow

    def list_by_home(self, home_id: int, limit: int) -> list[Activity]:
        statement = (
            select(ActivityRow)
            .where(ActivityRow.home_id == home_id)
            .order_by(ActivityRow.created_at.desc(), ActivityRow.id.desc())
            .limit(limit)
        )
        return [self._to_entity(row) for row in self._session.scalars(statement)]

    def list_since(self, since: datetime) -> list[Activity]:
        return self._query(ActivityRow.created_at >= since)
