from compis.application.access import load_actor, require_member
from compis.application.ports import Clock, UnitOfWork
from compis.application.services.activity import ActivityService
from compis.domain.entities import FileRecord
from compis.domain.errors import NotFoundError, ValidationError


class FileService:
    def __init__(self, uow: UnitOfWork, clock: Clock, activity: ActivityService) -> None:
        self._uow = uow
        self._clock = clock
        self._activity = activity

    def list_by_home(self, actor_id: int, home_id: int) -> list[FileRecord]:
        actor = load_actor(self._uow, actor_id)
        require_member(actor, home_id)
        return self._uow.files.list_by_home(home_id)

    def register(
        self,
        actor_id: int,
        name: str,
        url: str,
        home_id: int,
        expense_id: int | None = None,
    ) -> FileRecord:
        actor = load_actor(self._uow, actor_id)
        require_member(actor, home_id)
        if not name.strip() or not url.startswith("https://"):
            raise ValidationError("Faltan campos por completar")
        if expense_id is not None:
            expense = self._uow.expenses.get(expense_id)
            if expense is None or expense.home_id != home_id:
                raise NotFoundError("Gasto no encontrado")
        file = self._uow.files.add(
            FileRecord(
                name=name.strip(),
                url=url,
                upload_date=self._clock.today(),
                home_id=home_id,
                expense_id=expense_id,
            )
        )
        self._activity.record(
            home_id, f"{actor.first_name} ha subido un archivo: {file.name}", actor.first_name
        )
        self._uow.commit()
        return file

    def delete(self, actor_id: int, file_id: int) -> None:
        actor = load_actor(self._uow, actor_id)
        file = self._uow.files.get(file_id)
        if file is None:
            raise NotFoundError("El archivo no existe")
        require_member(actor, file.home_id)
        self._uow.files.delete(file_id)
        self._uow.commit()
