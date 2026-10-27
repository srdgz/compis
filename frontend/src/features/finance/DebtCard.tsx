import { Check } from "lucide-react";

import { cx, formatDay, formatEuro } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";

import { DEBT_STATUS } from "./api";
import type { Debt } from "./api";

const METHOD_LABEL: Record<string, string> = {
  cash: "en efectivo",
  paypal_me: "con PayPal",
  paypal_sandbox: "con PayPal (demo)",
};

const STEPS = [
  { status: DEBT_STATUS.pending, label: "Pendiente" },
  { status: DEBT_STATUS.paid, label: "Comunicado" },
  { status: DEBT_STATUS.confirmed, label: "Saldada" },
] as const;

function PaymentSteps({ status }: { status: string }) {
  const current = Math.max(
    0,
    STEPS.findIndex((step) => step.status === status),
  );
  return (
    <ol aria-label="Estado del pago" className="flex flex-wrap items-center gap-x-1 gap-y-1">
      {STEPS.map((step, index) => {
        const reached = index <= current;
        return (
          <li
            key={step.status}
            aria-current={index === current ? "step" : undefined}
            className="flex items-center gap-1"
          >
            <span
              aria-hidden="true"
              className={cx(
                "inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.7rem] font-bold",
                reached ? "bg-brand text-on-brand" : "border-2 border-control text-transparent",
              )}
            >
              {reached ? <Check size={12} strokeWidth={3} /> : index + 1}
            </span>
            <span className={cx("text-sm", index === current ? "font-bold" : "text-muted")}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className="mx-1 h-0.5 w-4 rounded-full bg-line" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface DebtCardProps {
  debt: Debt;
  perspective: "debtor" | "creditor";
  otherName: string;
  otherAvatar?: string | null;
  busy: boolean;
  onPay: () => void;
  onConfirm: () => void;
  onReject: () => void;
}

export function DebtCard({
  debt,
  perspective,
  otherName,
  otherAvatar,
  busy,
  onPay,
  onConfirm,
  onReject,
}: DebtCardProps) {
  const waiting = debt.status === DEBT_STATUS.paid;
  const settled = debt.status === DEBT_STATUS.confirmed;
  const method = debt.payment_method ? METHOD_LABEL[debt.payment_method] : undefined;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-bg p-4">
      <div className="flex items-start gap-3">
        <Avatar name={otherName} src={otherAvatar} />
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold">{debt.name}</p>
          <p className="text-sm text-muted">
            {perspective === "debtor" ? "A" : "De"} {otherName} · {formatDay(debt.date)}
          </p>
        </div>
        <p className="shrink-0 font-display text-2xl font-semibold tabular-nums">
          {formatEuro(debt.amount)}
        </p>
      </div>

      <PaymentSteps status={debt.status} />
      {(waiting || settled) && method && <p className="text-sm text-muted">Pagado {method}.</p>}

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
