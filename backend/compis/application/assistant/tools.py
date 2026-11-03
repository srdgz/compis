import re
from collections.abc import Callable
from typing import Any

from compis.application.access import load_actor, load_roomie
from compis.application.assistant.types import ToolSpec
from compis.application.ports import Clock, UnitOfWork
from compis.application.services.expenses import DebtService
from compis.application.services.shopping import ShoppingService
from compis.application.services.tasks import TaskService
from compis.domain.entities import DebtStatus

CURRENCY = "EUR"
MAX_TEXT_LENGTH = 80
NO_ARGUMENTS: dict[str, Any] = {"type": "object", "properties": {}}

SPECS = (
    ToolSpec(
        "get_debts",
        "Money the user owes to flatmates and money flatmates owe to the user, "
        "with amounts in cents, status and the next action for each debt.",
        NO_ARGUMENTS,
    ),
    ToolSpec(
        "get_tasks",
        "Household tasks assigned to the user, with an overdue flag.",
        {
            "type": "object",
            "properties": {
                "only_pending": {
                    "type": "boolean",
                    "description": "Return only tasks that are not done. Defaults to true.",
                }
            },
        },
    ),
    ToolSpec("get_shopping_list", "Items still to buy on the home shopping list.", NO_ARGUMENTS),
    ToolSpec("get_today", "The current date in ISO 8601.", NO_ARGUMENTS),
)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()[:MAX_TEXT_LENGTH]


class AssistantTools:
    def __init__(
        self,
        uow: UnitOfWork,
        clock: Clock,
        debts: DebtService,
        tasks: TaskService,
        shopping: ShoppingService,
    ) -> None:
        self._uow = uow
        self._clock = clock
        self._debts = debts
        self._tasks = tasks
        self._shopping = shopping
        self._handlers: dict[str, Callable[[int, dict[str, Any]], dict[str, Any]]] = {
            "get_debts": self._get_debts,
            "get_tasks": self._get_tasks,
            "get_shopping_list": self._get_shopping_list,
            "get_today": self._get_today,
        }

    @property
    def specs(self) -> tuple[ToolSpec, ...]:
        return SPECS

    def run(self, actor_id: int, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        handler = self._handlers.get(name)
        if handler is None:
            return {"error": f"Unknown tool: {name}"}
        allowed = next(spec for spec in SPECS if spec.name == name).parameters["properties"]
        unexpected = sorted(set(arguments) - set(allowed))
        if unexpected:
            return {"error": f"Unexpected arguments: {', '.join(unexpected)}"}
        return handler(actor_id, arguments)

    def _get_debts(self, actor_id: int, arguments: dict[str, Any]) -> dict[str, Any]:
        owed_by_me: list[dict[str, Any]] = []
        owed_to_me: list[dict[str, Any]] = []
        for debt in self._debts.list_for_roomie(actor_id, actor_id):
            waiting = debt.status == DebtStatus.PAID
            status = "waiting_confirmation" if waiting else "pending"
            if debt.roomie_debtor_id == actor_id:
                other = load_roomie(self._uow, debt.roomie_paying_id)
                owed_by_me.append(
                    {
                        "to": other.first_name,
                        "text": clean_text(debt.name),
                        "amount_cents": debt.amount_cents,
                        "status": status,
                        "next_action": "wait_for_confirmation" if waiting else "pay",
                    }
                )
            else:
                other = load_roomie(self._uow, debt.roomie_debtor_id)
                owed_to_me.append(
                    {
                        "from": other.first_name,
                        "text": clean_text(debt.name),
                        "amount_cents": debt.amount_cents,
                        "status": status,
                        "next_action": "confirm_receipt" if waiting else "wait_for_payment",
                    }
                )
        return {
            "currency": CURRENCY,
            "i_owe": owed_by_me,
            "owed_to_me": owed_to_me,
            "total_i_owe_cents": sum(item["amount_cents"] for item in owed_by_me),
            "total_owed_to_me_cents": sum(item["amount_cents"] for item in owed_to_me),
        }

    def _get_tasks(self, actor_id: int, arguments: dict[str, Any]) -> dict[str, Any]:
        only_pending = arguments.get("only_pending", True)
        if not isinstance(only_pending, bool):
            return {"error": "only_pending must be a boolean"}
        today = self._clock.today()
        tasks = self._tasks.list_for_roomie(actor_id, actor_id, only_pending=only_pending)
        return {
            "tasks": [
                {
                    "text": clean_text(task.name),
                    "assigned": task.date_assigned.isoformat(),
                    "done": task.date_done.isoformat() if task.date_done else None,
                    "overdue": not task.is_done and task.date_assigned < today,
                }
                for task in tasks
            ]
        }

    def _get_shopping_list(self, actor_id: int, arguments: dict[str, Any]) -> dict[str, Any]:
        actor = load_actor(self._uow, actor_id)
        if actor.home_id is None:
            return {"items": []}
        shopping_list = self._shopping.get_list(actor_id, actor.home_id)
        assert shopping_list.id is not None
        items = self._shopping.list_items(actor_id, shopping_list.id)
        return {"items": [clean_text(item.name) for item in items]}

    def _get_today(self, actor_id: int, arguments: dict[str, Any]) -> dict[str, Any]:
        return {"today": self._clock.today().isoformat()}
