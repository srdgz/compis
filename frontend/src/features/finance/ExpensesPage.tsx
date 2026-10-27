import { useState } from "react";
import type { FormEvent } from "react";

import { useHomeContext } from "@/features/homes/context";
import { fullName } from "@/features/roomies/api";
import type { Roomie } from "@/features/roomies/api";
import { useHomeRoomies } from "@/features/roomies/hooks";
import { errorMessage } from "@/shared/api/http";
import { formatDay, formatEuro } from "@/shared/lib/format";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Checkbox, TextField } from "@/shared/ui/Field";
import { Card, EmptyState, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

import type { Debt, Expense } from "./api";
import { useCreateDebts, useDebts, useExpensesWithoutDebts, usePayDebt } from "./hooks";
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

function DebtRow({
  debt,
  otherName,
  actionLabel,
  onPay,
  loading,
}: {
  debt: Debt;
  otherName: string;
  actionLabel: string;
  onPay: () => void;
  loading: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
      <div>
        <p className="font-semibold">
          {formatEuro(debt.amount)} · {debt.name}
        </p>
        <p className="text-muted">
          {otherName} · {formatDay(debt.date)}
        </p>
      </div>
      <Button variant="secondary" loading={loading} onClick={onPay}>
        {actionLabel}
      </Button>
    </li>
  );
}

export function ExpensesPage() {
  useDocumentTitle("Gastos y deudas");
  const { roomie, homeId } = useHomeContext();
  const toast = useToast();
  const roomies = useHomeRoomies(homeId);
  const expenses = useExpensesWithoutDebts(roomie.id);
  const debts = useDebts(roomie.id);
  const pay = usePayDebt();
  const [sharing, setSharing] = useState<Expense | null>(null);

  const names = new Map((roomies.data ?? []).map((r) => [r.id, fullName(r)]));
  const nameOf = (id: number) => names.get(id) ?? "Un compi";
  const others = (roomies.data ?? []).filter((r) => r.id !== roomie.id);
  const iOwe = (debts.data ?? []).filter((d) => d.roomie_debtor_id === roomie.id);
  const owedToMe = (debts.data ?? []).filter((d) => d.roomie_paying_id === roomie.id);

  function markPaid(debt: Debt, message: string) {
    pay.mutate(debt.id, {
      onSuccess: () => toast.success(message),
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
          {debts.data && iOwe.length === 0 && <EmptyState title="No debes nada" />}
          <ul className="flex flex-col gap-3">
            {iOwe.map((debt) => (
              <DebtRow
                key={debt.id}
                debt={debt}
                otherName={`A ${nameOf(debt.roomie_paying_id)}`}
                actionLabel="Marcar como pagada"
                loading={pay.isPending && pay.variables === debt.id}
                onPay={() => markPaid(debt, "Deuda marcada como pagada.")}
              />
            ))}
          </ul>
        </Card>
        <Card title="Te deben">
          {debts.isPending && <Loading />}
          {debts.data && owedToMe.length === 0 && <EmptyState title="Nadie te debe nada" />}
          <ul className="flex flex-col gap-3">
            {owedToMe.map((debt) => (
              <DebtRow
                key={debt.id}
                debt={debt}
                otherName={`De ${nameOf(debt.roomie_debtor_id)}`}
                actionLabel="Marcar como cobrada"
                loading={pay.isPending && pay.variables === debt.id}
                onPay={() => markPaid(debt, "Deuda marcada como cobrada.")}
              />
            ))}
          </ul>
        </Card>
      </div>

      <ShareDialog
        key={sharing?.id ?? "none"}
        expense={sharing}
        others={others}
        onClose={() => setSharing(null)}
      />
    </>
  );
}
