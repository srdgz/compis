from dataclasses import dataclass
from datetime import date

from compis.application.access import load_actor, load_roomie
from compis.application.ports import UnitOfWork
from compis.domain.errors import PermissionDeniedError
from compis.domain.money import format_euros


@dataclass
class CalendarEvent:
    id: int
    title: str
    day: date
    type: str


class CalendarService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    def events_for(self, actor_id: int, roomie_id: int) -> list[CalendarEvent]:
        actor = load_actor(self._uow, actor_id)
        if actor.id != roomie_id:
            raise PermissionDeniedError("Solo puedes ver tu propio calendario")
        events = []
        for debt in self._uow.debts.list_for_roomie(roomie_id, pending_only=False):
            amount = format_euros(debt.amount_cents)
            if debt.roomie_debtor_id == roomie_id:
                other = load_roomie(self._uow, debt.roomie_paying_id)
                title = f"Debes a {other.first_name}: {amount}€"
            else:
                other = load_roomie(self._uow, debt.roomie_debtor_id)
                title = f"Pago de {other.first_name}: {amount}€"
            assert debt.id is not None
            events.append(CalendarEvent(debt.id, title, debt.date, "debt"))
        for task in self._uow.tasks.list_by_roomie(roomie_id):
            assert task.id is not None
            events.append(CalendarEvent(task.id, task.name, task.date_assigned, "task"))
        return events
