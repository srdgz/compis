from dataclasses import dataclass

from compis.application.assistant.service import AssistantService, Limits
from compis.application.assistant.tools import AssistantTools
from compis.application.ports import (
    Clock,
    LanguageModel,
    Mailer,
    PasswordHasher,
    PaymentGateway,
    UnitOfWork,
)
from compis.application.services.activity import ActivityService
from compis.application.services.auth import AuthService
from compis.application.services.calendar import CalendarService
from compis.application.services.digest import DigestService
from compis.application.services.expenses import DebtService, ExpenseService
from compis.application.services.files import FileService
from compis.application.services.homes import HomeService
from compis.application.services.payments import PaypalDemoService
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
    paypal_demo: PaypalDemoService
    assistant: AssistantService
    paypal_demo_client_id: str | None
    cron_secret: str


def build_services(
    uow: UnitOfWork,
    clock: Clock,
    hasher: PasswordHasher,
    mailer: Mailer,
    cron_secret: str = "",
    gateway: PaymentGateway | None = None,
    paypal_demo_client_id: str | None = None,
    media_prefix: str | None = None,
    model: LanguageModel | None = None,
    assistant_limits: Limits | None = None,
) -> Services:
    activity = ActivityService(uow, clock)
    debts = DebtService(uow, clock, activity)
    tasks = TaskService(uow, clock, activity)
    shopping = ShoppingService(uow, activity)
    return Services(
        auth=AuthService(uow, hasher),
        roomies=RoomieService(uow, hasher, media_prefix),
        homes=HomeService(uow, activity),
        tasks=tasks,
        shopping=shopping,
        expenses=ExpenseService(uow, activity),
        debts=debts,
        files=FileService(uow, clock, activity, media_prefix),
        activity=activity,
        calendar=CalendarService(uow),
        digest=DigestService(uow, clock, mailer),
        paypal_demo=PaypalDemoService(debts, gateway),
        assistant=AssistantService(
            uow,
            clock,
            AssistantTools(uow, clock, debts, tasks, shopping),
            model,
            assistant_limits,
        ),
        paypal_demo_client_id=paypal_demo_client_id if gateway else None,
        cron_secret=cron_secret,
    )
