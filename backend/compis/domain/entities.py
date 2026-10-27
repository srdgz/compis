from dataclasses import dataclass
from datetime import date, datetime
from enum import StrEnum

from compis.domain.errors import ConflictError, PermissionDeniedError, ValidationError


class DebtStatus(StrEnum):
    PENDING = "Pendiente"
    PAID = "Pagada"
    CONFIRMED = "Confirmada"


class PaymentMethod(StrEnum):
    CASH = "cash"
    PAYPAL_ME = "paypal_me"
    PAYPAL_SANDBOX = "paypal_sandbox"


class ActivityStatus(StrEnum):
    DONE = "Hecho"
    PENDING = "Pendiente"


@dataclass
class Roomie:
    email: str
    password_hash: str
    first_name: str
    last_name: str | None = None
    avatar: str | None = None
    paypal_username: str | None = None
    is_admin: bool = False
    is_active: bool = True
    home_id: int | None = None
    id: int | None = None

    def shares_home_with(self, other: "Roomie") -> bool:
        return self.home_id is not None and self.home_id == other.home_id

    def can_manage(self, other: "Roomie") -> bool:
        return self.id == other.id or self.shares_home_with(other)


@dataclass
class Home:
    name: str
    is_active: bool = True
    id: int | None = None


@dataclass
class Task:
    name: str
    date_assigned: date
    roomie_id: int
    date_done: date | None = None
    id: int | None = None

    @property
    def is_done(self) -> bool:
        return self.date_done is not None


@dataclass
class ShoppingList:
    name: str
    home_id: int
    id: int | None = None


@dataclass
class ShoppingItem:
    name: str
    shopping_list_id: int
    expense_id: int | None = None
    id: int | None = None


@dataclass
class Expense:
    name: str
    home_id: int
    roomie_id: int
    debt_generated: bool = False
    id: int | None = None


@dataclass
class Debt:
    name: str
    amount_cents: int
    date: date
    roomie_debtor_id: int
    roomie_paying_id: int
    expense_id: int
    status: str = DebtStatus.PENDING
    payment_method: str | None = None
    id: int | None = None

    @property
    def is_settled(self) -> bool:
        return self.status == DebtStatus.CONFIRMED

    def report_paid(self, actor_id: int, method: str) -> bool:
        if actor_id != self.roomie_debtor_id:
            raise PermissionDeniedError("Solo quien debe el dinero puede avisar de que ha pagado")
        if method not in (PaymentMethod.CASH, PaymentMethod.PAYPAL_ME):
            raise ValidationError("El método de pago no es válido")
        if self.is_settled:
            raise ConflictError("La deuda ya está saldada")
        if self.status == DebtStatus.PAID:
            return False
        self.status = DebtStatus.PAID
        self.payment_method = method
        return True

    def confirm(self, actor_id: int) -> bool:
        if actor_id != self.roomie_paying_id:
            raise PermissionDeniedError("Solo quien debe cobrar puede confirmar el pago")
        if self.is_settled:
            return False
        self.status = DebtStatus.CONFIRMED
        return True

    def reject(self, actor_id: int) -> None:
        if actor_id != self.roomie_paying_id:
            raise PermissionDeniedError("Solo quien debe cobrar puede rechazar el pago")
        if self.status != DebtStatus.PAID:
            raise ConflictError("Solo se puede rechazar un pago que se haya comunicado")
        self.status = DebtStatus.PENDING
        self.payment_method = None

    def settle_with_gateway(self, actor_id: int) -> bool:
        if actor_id != self.roomie_debtor_id:
            raise PermissionDeniedError("Solo quien debe el dinero puede pagar esta deuda")
        if self.is_settled:
            return False
        self.status = DebtStatus.CONFIRMED
        self.payment_method = PaymentMethod.PAYPAL_SANDBOX
        return True


@dataclass
class FileRecord:
    name: str
    url: str
    upload_date: date
    home_id: int
    expense_id: int | None = None
    id: int | None = None


@dataclass
class Activity:
    home_id: int
    text: str
    roomie_name: str
    created_at: datetime
    status: str = ActivityStatus.DONE
    amount_cents: int | None = None
    id: int | None = None
