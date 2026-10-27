from typing import Any

from compis.application.services.calendar import CalendarEvent
from compis.domain.entities import (
    Activity,
    Debt,
    Expense,
    FileRecord,
    Home,
    Roomie,
    ShoppingItem,
    ShoppingList,
    Task,
)
from compis.domain.money import to_euros


def roomie(entity: Roomie) -> dict:
    return {
        "id": entity.id,
        "email": entity.email,
        "first_name": entity.first_name,
        "last_name": entity.last_name,
        "avatar": entity.avatar,
        "paypal_username": entity.paypal_username,
        "admin": entity.is_admin,
        "is_active": entity.is_active,
        "home_id": entity.home_id,
    }


def home(entity: Home) -> dict:
    return {"id": entity.id, "name": entity.name, "is_active": entity.is_active}


def task(entity: Task, assignee: Roomie | None = None) -> dict:
    data: dict[str, Any] = {
        "id": entity.id,
        "name": entity.name,
        "date_assigned": entity.date_assigned.isoformat(),
        "date_done": entity.date_done.isoformat() if entity.date_done else None,
        "roomie_id": entity.roomie_id,
    }
    if assignee is not None:
        data["roomie"] = roomie(assignee)
    return data


def shopping_list(entity: ShoppingList) -> dict:
    return {"id": entity.id, "name": entity.name, "home_id": entity.home_id}


def shopping_item(entity: ShoppingItem) -> dict:
    return {
        "id": entity.id,
        "name": entity.name,
        "shopping_list_id": entity.shopping_list_id,
        "expense_id": entity.expense_id,
    }


def expense(entity: Expense) -> dict:
    return {
        "id": entity.id,
        "name": entity.name,
        "debt_generated": entity.debt_generated,
        "home_id": entity.home_id,
    }


def debt(entity: Debt) -> dict:
    return {
        "id": entity.id,
        "name": entity.name,
        "amount": to_euros(entity.amount_cents),
        "roomie_debtor_id": entity.roomie_debtor_id,
        "roomie_paying_id": entity.roomie_paying_id,
        "status": str(entity.status),
        "payment_method": entity.payment_method,
        "date": entity.date.isoformat(),
        "expense_id": entity.expense_id,
    }


def file(entity: FileRecord) -> dict:
    return {
        "id": entity.id,
        "name": entity.name,
        "url": entity.url,
        "upload_date": entity.upload_date.isoformat(),
        "home_id": entity.home_id,
        "expense_id": entity.expense_id,
    }


def activity(entity: Activity) -> dict:
    return {
        "id": entity.id,
        "text": entity.text,
        "roomie_name": entity.roomie_name,
        "status": str(entity.status),
        "amount": to_euros(entity.amount_cents),
        "date": entity.created_at.isoformat(),
        "home_id": entity.home_id,
    }


def calendar_event(event: CalendarEvent) -> dict:
    day = event.day.isoformat()
    return {"id": event.id, "title": event.title, "start": day, "end": day, "type": event.type}
