from compis.application.access import (
    load_actor,
    load_roomie,
    require_can_manage,
    require_member,
)
from compis.application.ports import Clock, UnitOfWork
from compis.application.services.activity import ActivityService
from compis.domain.entities import ActivityStatus, Debt, Expense
from compis.domain.errors import (
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
)
from compis.domain.money import format_euros, split_equally


class ExpenseService:
    def __init__(self, uow: UnitOfWork, activity: ActivityService) -> None:
        self._uow = uow
        self._activity = activity

    def create(self, actor_id: int, name: str, item_ids: list[int]) -> Expense:
        actor = load_actor(self._uow, actor_id)
        name = name.strip()
        if not name or not item_ids:
            raise ValidationError("Faltan campos por completar")
        unique_ids = list(dict.fromkeys(item_ids))
        items = []
        list_ids = set()
        for item_id in unique_ids:
            item = self._uow.shopping.get_item(item_id)
            if item is None:
                raise NotFoundError("El elemento no existe")
            if item.expense_id is not None:
                raise ConflictError("El elemento ya está marcado como comprado")
            items.append(item)
            list_ids.add(item.shopping_list_id)
        if len(list_ids) != 1:
            raise ValidationError("Los elementos deben pertenecer a la misma lista")
        shopping_list = self._uow.shopping.get_list(list_ids.pop())
        if shopping_list is None:
            raise NotFoundError("Lista de la compra no encontrada")
        require_member(actor, shopping_list.home_id)
        assert actor.id is not None
        expense = self._uow.expenses.add(
            Expense(name=name, home_id=shopping_list.home_id, roomie_id=actor.id)
        )
        for item in items:
            item.expense_id = expense.id
            self._uow.shopping.save_item(item)
        self._activity.record(
            shopping_list.home_id,
            f"{actor.first_name} ha generado nuevo gasto por: {name}",
            actor.first_name,
        )
        self._uow.commit()
        return expense

    def list_without_debts(self, actor_id: int, roomie_id: int) -> list[Expense]:
        actor = load_actor(self._uow, actor_id)
        require_can_manage(actor, load_roomie(self._uow, roomie_id))
        return self._uow.expenses.list_without_debts(roomie_id)


class DebtService:
    def __init__(self, uow: UnitOfWork, clock: Clock, activity: ActivityService) -> None:
        self._uow = uow
        self._clock = clock
        self._activity = activity

    def create_for_expense(
        self, actor_id: int, expense_id: int, debtor_ids: list[int], total_cents: int
    ) -> list[Debt]:
        actor = load_actor(self._uow, actor_id)
        expense = self._uow.expenses.get(expense_id)
        if expense is None:
            raise NotFoundError("Gasto no encontrado")
        if expense.roomie_id != actor.id:
            raise PermissionDeniedError("No tienes permiso para crear esta deuda")
        if expense.debt_generated:
            raise ConflictError("Este gasto ya tiene deudas generadas")
        unique_ids = list(dict.fromkeys(debtor_ids))
        if actor.id in unique_ids:
            raise ValidationError("No puedes deberte dinero a ti mismo")
        debtors = []
        for debtor_id in unique_ids:
            debtor = load_roomie(self._uow, debtor_id)
            if debtor.home_id != expense.home_id:
                raise ValidationError("Todos los compis deben pertenecer a la vivienda")
            debtors.append(debtor)
        share = split_equally(total_cents, len(debtors))
        if share < 1:
            raise ValidationError("El importe es demasiado pequeño para repartirlo")
        assert actor.id is not None and expense.id is not None
        debts = []
        for debtor in debtors:
            assert debtor.id is not None
            debt = self._uow.debts.add(
                Debt(
                    name=expense.name,
                    amount_cents=share,
                    date=self._clock.today(),
                    roomie_debtor_id=debtor.id,
                    roomie_paying_id=actor.id,
                    expense_id=expense.id,
                )
            )
            debts.append(debt)
            self._activity.record(
                expense.home_id,
                f"{debtor.first_name} debe {format_euros(share)}€ a {actor.first_name}",
                debtor.first_name,
                amount_cents=share,
            )
        expense.debt_generated = True
        self._uow.expenses.save(expense)
        self._uow.commit()
        return debts

    def list_for_roomie(
        self, actor_id: int, roomie_id: int, include_settled: bool = False
    ) -> list[Debt]:
        actor = load_actor(self._uow, actor_id)
        require_can_manage(actor, load_roomie(self._uow, roomie_id))
        return self._uow.debts.list_for_roomie(roomie_id, pending_only=not include_settled)

    def report_payment(self, actor_id: int, debt_id: int, method: str) -> bool:
        debt = self._load_debt(debt_id)
        changed = debt.report_paid(actor_id, method)
        if changed:
            self._save_and_log(
                debt,
                lambda debtor, creditor: (
                    f"{debtor.first_name} dice que ha pagado {format_euros(debt.amount_cents)}€ "
                    f"a {creditor.first_name}",
                    debtor.first_name,
                    ActivityStatus.PENDING,
                ),
            )
        return changed

    def confirm_receipt(self, actor_id: int, debt_id: int) -> bool:
        debt = self._load_debt(debt_id)
        changed = debt.confirm(actor_id)
        if changed:
            self._save_and_log(
                debt,
                lambda debtor, creditor: (
                    f"{creditor.first_name} ha confirmado el pago de "
                    f"{format_euros(debt.amount_cents)}€ de {debtor.first_name}",
                    creditor.first_name,
                    ActivityStatus.DONE,
                ),
            )
        return changed

    def reject_payment(self, actor_id: int, debt_id: int) -> None:
        debt = self._load_debt(debt_id)
        debt.reject(actor_id)
        self._save_and_log(
            debt,
            lambda debtor, creditor: (
                f"{creditor.first_name} no ha recibido el pago de "
                f"{format_euros(debt.amount_cents)}€ de {debtor.first_name}",
                creditor.first_name,
                ActivityStatus.PENDING,
            ),
        )

    def settle_with_gateway(self, actor_id: int, debt_id: int) -> bool:
        debt = self._load_debt(debt_id)
        changed = debt.settle_with_gateway(actor_id)
        if changed:
            self._save_and_log(
                debt,
                lambda debtor, creditor: (
                    f"{debtor.first_name} ha pagado {format_euros(debt.amount_cents)}€ "
                    f"a {creditor.first_name} con PayPal (modo demo)",
                    debtor.first_name,
                    ActivityStatus.DONE,
                ),
            )
        return changed

    def load_payable_debt(self, actor_id: int, debt_id: int) -> Debt:
        load_actor(self._uow, actor_id)
        debt = self._load_debt(debt_id)
        if debt.roomie_debtor_id != actor_id:
            raise PermissionDeniedError("Solo quien debe el dinero puede pagar esta deuda")
        if debt.is_settled:
            raise ConflictError("La deuda ya está saldada")
        return debt

    def _load_debt(self, debt_id: int) -> Debt:
        debt = self._uow.debts.get(debt_id)
        if debt is None:
            raise NotFoundError("Deuda no encontrada")
        return debt

    def _save_and_log(self, debt: Debt, describe) -> None:
        self._uow.debts.save(debt)
        debtor = load_roomie(self._uow, debt.roomie_debtor_id)
        creditor = load_roomie(self._uow, debt.roomie_paying_id)
        expense = self._uow.expenses.get(debt.expense_id)
        if expense is not None:
            text, name, status = describe(debtor, creditor)
            self._activity.record(
                expense.home_id, text, name, status, amount_cents=debt.amount_cents
            )
        self._uow.commit()
