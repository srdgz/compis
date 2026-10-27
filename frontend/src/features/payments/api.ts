import { z } from "zod";

import { request } from "@/shared/api/http";

const configSchema = z.object({
  paypal_demo: z.object({
    enabled: z.boolean(),
    client_id: z.string().nullable(),
  }),
});

export const paymentsApi = {
  config: () => request("/config", { schema: configSchema }),
  createOrder: (debtId: number) =>
    request("/payments/paypal/orders", {
      method: "POST",
      body: { debt_id: debtId },
      schema: z.object({ order_id: z.string() }),
    }),
  capture: (debtId: number, orderId: string) =>
    request("/payments/paypal/capture", {
      method: "POST",
      body: { debt_id: debtId, order_id: orderId },
    }),
};
