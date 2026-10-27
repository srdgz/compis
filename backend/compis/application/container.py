from dataclasses import dataclass

from compis.application.ports import Clock, Mailer, PasswordHasher, UnitOfWork
from compis.application.services.activity import ActivityService
from compis.application.services.auth import AuthService
from compis.application.services.calendar import CalendarService
from compis.application.services.digest import DigestService
from compis.application.services.expenses import DebtService, ExpenseService
from compis.application.services.files import FileService
from compis.application.services.homes import HomeService
from compis.application.services.roomies import RoomieService
from compis.application.services.shopping import ShoppingService
from compis.application.services.tasks import TaskService


@dataclass
class Services:
    auth: AuthService
    roomies: RoomieService
    homes: HomeService
    tasks: TaskService
    shopping: ShoppingService
    expenses: ExpenseService
    debts: DebtService
    files: FileService
    activity: ActivityService
    calendar: CalendarService
    digest: DigestService
    cron_secret: str


def build_services(
    uow: UnitOfWork,
    clock: Clock,
    hasher: PasswordHasher,
    mailer: Mailer,
    cron_secret: str = "",
) -> Services:
    activity = ActivityService(uow, clock)
    return Services(
        auth=AuthService(uow, hasher),
        roomies=RoomieService(uow, hasher),
        homes=HomeService(uow, activity),
        tasks=TaskService(uow, clock, activity),
        shopping=ShoppingService(uow, activity),
        expenses=ExpenseService(uow, activity),
        debts=DebtService(uow, clock, activity),
        files=FileService(uow, clock, activity),
        activity=activity,
        calendar=CalendarService(uow),
        digest=DigestService(uow, clock, mailer),
        cron_secret=cron_secret,
    )
