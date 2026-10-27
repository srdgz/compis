import { formatDay, formatEuro } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Feedback";

import { DEBT_STATUS } from "./api";
import type { Debt } from "./api";

const METHOD_LABEL: Record<string, string> = {
  cash: "en efectivo",
  paypal_me: "con PayPal",
  paypal_sandbox: "con PayPal (demo)",
};

interface DebtCardProps {
  debt: Debt;
  perspective: "debtor" | "creditor";
  otherName: string;
  busy: boolean;
  onPay: () => void;
  onConfirm: () => void;
  onReject: () => void;
}

export function DebtCard({
  debt,
  perspective,
  otherName,
  busy,
  onPay,
  onConfirm,
  onReject,
}: DebtCardProps) {
  const waiting = debt.status === DEBT_STATUS.paid;
  const settled = debt.status === DEBT_STATUS.confirmed;
  const method = debt.payment_method ? METHOD_LABEL[debt.payment_method] : undefined;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {formatEuro(debt.amount)} · {debt.name}
          </p>
          <p className="text-muted">
            {perspective === "debtor" ? "A" : "De"} {otherName} · {formatDay(debt.date)}
          </p>
        </div>
        {settled && <Badge tone="brand">Saldada{method ? ` ${method}` : ""}</Badge>}
        {waiting && <Badge>Pago comunicado{method ? ` ${method}` : ""}</Badge>}
      </div>

      {!settled && perspective === "debtor" && !waiting && (
        <div>
          <Button loading={busy} onClick={onPay}>
            Pagar
          </Button>
        </div>
      )}
      {!settled && perspective === "debtor" && waiting && (
        <p className="text-muted">Esperando a que {otherName} confirme que lo ha recibido.</p>
      )}
      {!settled && perspective === "creditor" && !waiting && (
        <div>
          <Button variant="secondary" loading={busy} onClick={onConfirm}>
            Marcar como cobrada
          </Button>
        </div>
      )}
      {!settled && perspective === "creditor" && waiting && (
        <div className="flex flex-wrap gap-2">
          <Button loading={busy} onClick={onConfirm}>
            Confirmar que lo he recibido
          </Button>
          <Button variant="danger" disabled={busy} onClick={onReject}>
            No lo he recibido
          </Button>
        </div>
      )}
    </li>
  );
}
