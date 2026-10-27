from compis.application.access import load_actor, require_member
from compis.application.ports import Clock, UnitOfWork
from compis.domain.entities import Activity, ActivityStatus


class ActivityService:
    def __init__(self, uow: UnitOfWork, clock: Clock) -> None:
        self._uow = uow
        self._clock = clock

    def record(
        self,
        home_id: int,
        text: str,
        roomie_name: str,
        status: str = ActivityStatus.DONE,
        amount_cents: int | None = None,
    ) -> None:
        self._uow.activities.add(
            Activity(
                home_id=home_id,
                text=text,
                roomie_name=roomie_name,
                created_at=self._clock.now(),
                status=status,
                amount_cents=amount_cents,
            )
        )

    def list_for_home(self, actor_id: int, home_id: int, limit: int = 10) -> list[Activity]:
        actor = load_actor(self._uow, actor_id)
        require_member(actor, home_id)
        return self._uow.activities.list_by_home(home_id, limit)
