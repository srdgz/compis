import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

import { errorMessage } from "@/shared/api/http";

import { paymentsApi } from "./api";

interface PaypalDemoButtonsProps {
  clientId: string;
  debtId: number;
  onPaid: () => void;
  onError: (message: string) => void;
}

export function PaypalDemoButtons({ clientId, debtId, onPaid, onError }: PaypalDemoButtonsProps) {
  return (
    <PayPalScriptProvider
      options={{ clientId, currency: "EUR", intent: "capture", disableFunding: "credit,card" }}
    >
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect" }}
        forceReRender={[debtId]}
        createOrder={async () => (await paymentsApi.createOrder(debtId)).order_id}
        onApprove={async (data) => {
          try {
            await paymentsApi.capture(debtId, data.orderID);
            onPaid();
          } catch (caught) {
            onError(errorMessage(caught));
          }
        }}
        onError={() => onError("PayPal no ha podido completar el pago. Inténtalo de nuevo.")}
      />
    </PayPalScriptProvider>
  );
}
