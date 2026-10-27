import { ExternalLink } from "lucide-react";
import { useState } from "react";

import { PaypalDemoButtons } from "@/features/payments/PaypalDemoButtons";
import { usePaypalDemoConfig } from "@/features/payments/hooks";
import type { Roomie } from "@/features/roomies/api";
import { fullName } from "@/features/roomies/api";
import { errorMessage } from "@/shared/api/http";
import { formatEuro } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { ErrorNotice } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

import type { Debt } from "./api";
import { useRefreshFinance, useReportPayment } from "./hooks";
import { paypalMeUrl } from "./paypal";

interface PayDebtDialogProps {
  debt: Debt | null;
  creditor: Roomie | undefined;
  onClose: () => void;
}

export function PayDebtDialog({ debt, creditor, onClose }: PayDebtDialogProps) {
  const toast = useToast();
  const report = useReportPayment();
  const refresh = useRefreshFinance();
  const demo = usePaypalDemoConfig();
  const [error, setError] = useState<string | null>(null);

  const creditorName = creditor ? fullName(creditor) : "tu compi";
  const paypalUsername = creditor?.paypal_username ?? null;

  function reportAs(method: "cash" | "paypal_me") {
    if (!debt) return;
    setError(null);
    report.mutate(
      { id: debt.id, method },
      {
        onSuccess: () => {
          toast.success(`Hemos avisado a ${creditorName}. Te confirmará cuando lo reciba.`);
          onClose();
        },
        onError: (caught) => setError(errorMessage(caught)),
      },
    );
  }

  return (
    <Dialog open={debt !== null} onClose={onClose} title="Pagar una deuda">
      {debt && (
        <>
          <p>
            Debes <strong>{formatEuro(debt.amount)}</strong> a {creditorName} por «{debt.name}».
          </p>
          {error && <ErrorNotice message={error} />}

          <section className="flex flex-col gap-3" aria-labelledby="pay-paypal">
            <h3 id="pay-paypal" className="text-lg">
              Con PayPal
            </h3>
            {paypalUsername ? (
              <>
                <a
                  href={paypalMeUrl(paypalUsername, debt.amount)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-brand bg-brand px-5 py-2 font-semibold text-on-brand"
                >
                  Abrir PayPal.Me
                  <ExternalLink aria-hidden="true" size={18} />
                  <span className="sr-only">(se abre en una pestaña nueva)</span>
                </a>
                <p className="text-muted">
                  Haz el pago en PayPal y vuelve aquí para avisar. El importe ya va rellenado.
                </p>
                <Button
                  variant="secondary"
                  loading={report.isPending}
                  onClick={() => reportAs("paypal_me")}
                >
                  Ya he pagado con PayPal
                </Button>
              </>
            ) : (
              <p className="text-muted">
                {creditorName} aún no ha añadido su usuario de PayPal.Me en su perfil.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3" aria-labelledby="pay-cash">
            <h3 id="pay-cash" className="text-lg">
              En efectivo u otro medio
            </h3>
            <Button variant="secondary" loading={report.isPending} onClick={() => reportAs("cash")}>
              Ya se lo he pagado
            </Button>
          </section>

          {demo.data?.enabled && demo.data.client_id && (
            <section
              className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-line p-4"
              aria-labelledby="pay-demo"
            >
              <h3 id="pay-demo" className="text-lg">
                Modo demostración
              </h3>
              <p className="text-muted">
                Pago de prueba con PayPal Sandbox: no se mueve dinero real y la deuda queda saldada
                al momento.
              </p>
              <PaypalDemoButtons
                clientId={demo.data.client_id}
                debtId={debt.id}
                onError={setError}
                onPaid={() => {
                  toast.success("Pago de demostración completado.");
                  refresh();
                  onClose();
                }}
              />
            </section>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
