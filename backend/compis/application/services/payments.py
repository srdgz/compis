from compis.application.ports import PaymentGateway
from compis.application.services.expenses import DebtService
from compis.domain.errors import ConflictError, NotFoundError

CURRENCY = "EUR"


def debt_reference(debt_id: int) -> str:
    return f"debt-{debt_id}"


class PaypalDemoService:
    def __init__(self, debts: DebtService, gateway: PaymentGateway | None) -> None:
        self._debts = debts
        self._gateway = gateway

    @property
    def enabled(self) -> bool:
        return self._gateway is not None

    def create_order(self, actor_id: int, debt_id: int) -> str:
        gateway = self._require_gateway()
        debt = self._debts.load_payable_debt(actor_id, debt_id)
        return gateway.create_order(debt.amount_cents, debt_reference(debt_id))

    def capture(self, actor_id: int, debt_id: int, order_id: str) -> bool:
        gateway = self._require_gateway()
        debt = self._debts.load_payable_debt(actor_id, debt_id)
        result = gateway.capture_order(order_id)
        if (
            result.status != "COMPLETED"
            or result.currency != CURRENCY
            or result.amount_cents != debt.amount_cents
            or result.reference != debt_reference(debt_id)
        ):
            raise ConflictError("El pago no coincide con la deuda y no se ha podido confirmar")
        return self._debts.settle_with_gateway(actor_id, debt_id)

    def _require_gateway(self) -> PaymentGateway:
        if self._gateway is None:
            raise NotFoundError("El modo demostración de PayPal no está activo")
        return self._gateway
