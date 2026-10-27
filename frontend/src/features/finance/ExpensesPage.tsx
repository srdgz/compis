import { useState } from "react";
import type { FormEvent } from "react";

import { useHomeContext } from "@/features/homes/context";
import { fullName } from "@/features/roomies/api";
import type { Roomie } from "@/features/roomies/api";
import { useHomeRoomies } from "@/features/roomies/hooks";
import { errorMessage } from "@/shared/api/http";
import { formatEuro } from "@/shared/lib/format";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Checkbox, TextField } from "@/shared/ui/Field";
import { Card, EmptyState, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

import type { Debt, Expense } from "./api";
import { DebtCard } from "./DebtCard";
import {
  useConfirmPayment,
  useCreateDebts,
  useDebts,
  useExpensesWithoutDebts,
  useRejectPayment,
  useSettledDebts,
} from "./hooks";
import { PayDebtDialog } from "./PayDebtDialog";
import { parseAmount, shareInCents } from "./split";

function ShareDialog({
  expense,
  others,
  onClose,
}: {
  expense: Expense | null;
  others: Roomie[];
  onClose: () => void;
}) {
  const toast = useToast();
  const createDebts = useCreateDebts();
  const [total, setTotal] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const amount = parseAmount(total);
  const share = shareInCents(amount, selected.length) / 100;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!expense) return;
    if (amount <= 0) {
      setError("Escribe el importe total del gasto.");
      return;
    }
    if (selected.length === 0) {
      setError("Elige con quién repartes el gasto.");
      return;
    }
    createDebts.mutate(
      { expenseId: expense.id, debtorIds: selected, totalAmount: amount },
      {
        onSuccess: () => {
          toast.success("Gasto repartido.");
          onClose();
        },
        onError: (caught) => setError(errorMessage(caught)),
      },
    );
  }

  return (
    <Dialog open={expense !== null} onClose={onClose} title={`Repartir «${expense?.name ?? ""}»`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <ErrorNotice message={error} />}
        <TextField
          label="Importe total (€)"
          inputMode="decimal"
          required
          value={total}
          onChange={(event) => setTotal(event.target.value)}
        />
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-semibold">Reparte con</legend>
          {others.map((roomie) => (
            <Checkbox
              key={roomie.id}
              label={fullName(roomie)}
              checked={selected.includes(roomie.id)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, roomie.id]
                    : current.filter((id) => id !== roomie.id),
                )
              }
            />
          ))}
        </fieldset>
        <p aria-live="polite" className="rounded-xl bg-mint px-4 py-3">
          {share > 0
            ? `Cada persona pone ${formatEuro(share)} (tú incluido).`
            : "Elige el importe y con quién repartes para ver cuánto toca a cada uno."}
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={createDebts.isPending}>
            Repartir gasto
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ExpensesPage() {
  useDocumentTitle("Gastos y deudas");
  const { roomie, homeId } = useHomeContext();
  const toast = useToast();
  const roomies = useHomeRoomies(homeId);
  const expenses = useExpensesWithoutDebts(roomie.id);
  const debts = useDebts(roomie.id);
  const settled = useSettledDebts(roomie.id);
  const confirm = useConfirmPayment();
  const reject = useRejectPayment();
  const [sharing, setSharing] = useState<Expense | null>(null);
  const [paying, setPaying] = useState<Debt | null>(null);

  const byId = new Map((roomies.data ?? []).map((r) => [r.id, r]));
  const nameOf = (id: number) => {
    const found = byId.get(id);
    return found ? fullName(found) : "Un compi";
  };
  const others = (roomies.data ?? []).filter((r) => r.id !== roomie.id);
  const iOwe = (debts.data ?? []).filter((d) => d.roomie_debtor_id === roomie.id);
  const owedToMe = (debts.data ?? []).filter((d) => d.roomie_paying_id === roomie.id);
  const busyId =
    (confirm.isPending ? confirm.variables : undefined) ??
    (reject.isPending ? reject.variables : undefined);

  function confirmDebt(debt: Debt) {
    confirm.mutate(debt.id, {
      onSuccess: () => toast.success("Pago confirmado. La deuda queda saldada."),
      onError: (caught) => toast.error(errorMessage(caught)),
    });
  }

  function rejectDebt(debt: Debt) {
    reject.mutate(debt.id, {
      onSuccess: () => toast.success("Hemos devuelto la deuda a pendiente."),
      onError: (caught) => toast.error(errorMessage(caught)),
    });
  }

  return (
    <>
      <PageHeader
        title="Gastos y deudas"
        description="Reparte lo que has comprado y salda cuentas con tus compis."
      />

      <Card title="Gastos por repartir">
        {expenses.isPending && <Loading />}
        {expenses.error && <ErrorNotice message={errorMessage(expenses.error)} />}
        {expenses.data && expenses.data.length === 0 && (
          <EmptyState title="No tienes gastos pendientes de repartir">
            Registra una compra desde la lista de la compra para poder repartirla.
          </EmptyState>
        )}
        <ul className="flex flex-col gap-3">
          {(expenses.data ?? []).map((expense) => (
            <li
              key={expense.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
            >
              <p className="font-semibold">{expense.name}</p>
              <Button onClick={() => setSharing(expense)}>Repartir</Button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Debes">
          {debts.isPending && <Loading />}
          {debts.error && <ErrorNotice message={errorMessage(debts.error)} />}
          {debts.data && iOwe.length === 0 && <EmptyState title="No debes nada" />}
          <ul className="flex flex-col gap-3">
            {iOwe.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                perspective="debtor"
                otherName={nameOf(debt.roomie_paying_id)}
                busy={busyId === debt.id}
                onPay={() => setPaying(debt)}
                onConfirm={() => undefined}
                onReject={() => undefined}
              />
            ))}
          </ul>
        </Card>
        <Card title="Te deben">
          {debts.isPending && <Loading />}
          {debts.data && owedToMe.length === 0 && <EmptyState title="Nadie te debe nada" />}
          <ul className="flex flex-col gap-3">
            {owedToMe.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                perspective="creditor"
                otherName={nameOf(debt.roomie_debtor_id)}
                busy={busyId === debt.id}
                onPay={() => undefined}
                onConfirm={() => confirmDebt(debt)}
                onReject={() => rejectDebt(debt)}
              />
            ))}
          </ul>
        </Card>
      </div>

      {settled.data && settled.data.length > 0 && (
        <details className="rounded-card border border-line bg-surface p-4">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold">
            Deudas saldadas ({settled.data.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {settled.data.map((debt) => {
              const iAmDebtor = debt.roomie_debtor_id === roomie.id;
              return (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  perspective={iAmDebtor ? "debtor" : "creditor"}
                  otherName={nameOf(iAmDebtor ? debt.roomie_paying_id : debt.roomie_debtor_id)}
                  busy={false}
                  onPay={() => undefined}
                  onConfirm={() => undefined}
                  onReject={() => undefined}
                />
              );
            })}
          </ul>
        </details>
      )}

      <ShareDialog
        key={sharing?.id ?? "none"}
        expense={sharing}
        others={others}
        onClose={() => setSharing(null)}
      />
      <PayDebtDialog
        key={paying?.id ?? "none"}
        debt={paying}
        creditor={paying ? byId.get(paying.roomie_paying_id) : undefined}
        onClose={() => setPaying(null)}
      />
    </>
  );
}
