from datetime import date, datetime

from compis.application.access import (
    load_actor,
    load_roomie,
    require_can_manage,
    require_member,
)
from compis.application.ports import Clock, UnitOfWork
from compis.application.services.activity import ActivityService
from compis.domain.entities import ActivityStatus, Roomie, Task
from compis.domain.errors import NotFoundError, ValidationError


def parse_date(value: str) -> date:
    for pattern in ("%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(value, pattern).date()
        except ValueError:
            continue
    raise ValidationError("Formato de fecha inválido. Utilice el formato DD-MM-YYYY")


class TaskService:
    def __init__(self, uow: UnitOfWork, clock: Clock, activity: ActivityService) -> None:
        self._uow = uow
        self._clock = clock
        self._activity = activity

    def list_for_roomie(
        self, actor_id: int, roomie_id: int, only_pending: bool = False
    ) -> list[Task]:
        actor = load_actor(self._uow, actor_id)
        require_can_manage(actor, load_roomie(self._uow, roomie_id))
        tasks = self._uow.tasks.list_by_roomie(roomie_id)
        return [t for t in tasks if not (only_pending and t.is_done)]

    def list_for_home(
        self, actor_id: int, home_id: int, only_pending: bool = False
    ) -> list[tuple[Task, Roomie]]:
        actor = load_actor(self._uow, actor_id)
        require_member(actor, home_id)
        roomies = {r.id: r for r in self._uow.roomies.list_by_home(home_id)}
        tasks = self._uow.tasks.list_by_home(home_id)
        return [
            (task, roomies[task.roomie_id])
            for task in tasks
            if task.roomie_id in roomies and not (only_pending and task.is_done)
        ]

    def create(self, actor_id: int, roomie_id: int, name: str, date_assigned: str) -> Task:
        actor = load_actor(self._uow, actor_id)
        assignee = load_roomie(self._uow, roomie_id)
        require_can_manage(actor, assignee)
        if not name.strip():
            raise ValidationError("Faltan campos por completar")
        task = self._uow.tasks.add(
            Task(name=name.strip(), date_assigned=parse_date(date_assigned), roomie_id=roomie_id)
        )
        if assignee.home_id is not None:
            self._activity.record(
                assignee.home_id,
                f"Nueva tarea asignada: {task.name}",
                assignee.first_name,
                ActivityStatus.PENDING,
            )
        self._uow.commit()
        return task

    def complete(self, actor_id: int, task_id: int) -> bool:
        task, assignee = self._load_manageable(actor_id, task_id)
        if task.is_done:
            return False
        task.date_done = self._clock.today()
        self._uow.tasks.save(task)
        if assignee.home_id is not None:
            self._activity.record(
                assignee.home_id, f"Tarea completada: {task.name}", assignee.first_name
            )
        self._uow.commit()
        return True

    def reschedule(self, actor_id: int, task_id: int, new_date: str) -> Task:
        task, assignee = self._load_manageable(actor_id, task_id)
        task.date_assigned = parse_date(new_date)
        self._uow.tasks.save(task)
        if assignee.home_id is not None:
            self._activity.record(
                assignee.home_id,
                f'La fecha de la tarea "{task.name}" ha sido actualizada a '
                f"{task.date_assigned.strftime('%d-%m-%Y')}",
                assignee.first_name,
            )
        self._uow.commit()
        return task

    def delete(self, actor_id: int, task_id: int) -> None:
        task, assignee = self._load_manageable(actor_id, task_id)
        self._uow.tasks.delete(task_id)
        if assignee.home_id is not None:
            self._activity.record(
                assignee.home_id, f"Tarea eliminada: {task.name}", assignee.first_name
            )
        self._uow.commit()

    def _load_manageable(self, actor_id: int, task_id: int) -> tuple[Task, Roomie]:
        actor = load_actor(self._uow, actor_id)
        task = self._uow.tasks.get(task_id)
        if task is None:
            raise NotFoundError("La tarea no existe")
        assignee = load_roomie(self._uow, task.roomie_id)
        require_can_manage(actor, assignee)
        return task, assignee
