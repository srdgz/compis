import { z } from "zod";

import { request } from "@/shared/api/http";

export const expenseSchema = z.object({
  id: z.number(),
  name: z.string(),
  debt_generated: z.boolean(),
  home_id: z.number(),
});

export const DEBT_STATUS = {
  pending: "Pendiente",
  paid: "Pagada",
  confirmed: "Confirmada",
} as const;

export type PaymentMethod = "cash" | "paypal_me" | "paypal_sandbox";

export const debtSchema = z.object({
  id: z.number(),
  name: z.string(),
  amount: z.number(),
  roomie_debtor_id: z.number(),
  roomie_paying_id: z.number(),
  status: z.string(),
  payment_method: z.string().nullable(),
  date: z.string(),
  expense_id: z.number(),
});

export type Expense = z.infer<typeof expenseSchema>;
export type Debt = z.infer<typeof debtSchema>;

export const financeApi = {
  expensesWithoutDebts: (roomieId: number) =>
    request(`/expense/roomie/${roomieId}`, { schema: z.array(expenseSchema) }),
  createExpense: (name: string, itemIds: number[]) =>
    request("/expense", { method: "POST", body: { expense_name: name, item_ids: itemIds } }),
  debts: (roomieId: number, includeSettled = false) =>
    request(`/debts/roomie/${roomieId}${includeSettled ? "?include_settled=true" : ""}`, {
      schema: z.array(debtSchema),
    }),
  createDebts: (expenseId: number, debtorIds: number[], totalAmount: number) =>
    request("/debts", {
      method: "POST",
      body: { expense_id: expenseId, debtor_ids: debtorIds, total_amount: totalAmount },
    }),
  reportPayment: (id: number, method: "cash" | "paypal_me") =>
    request(`/debts/${id}/report`, { method: "POST", body: { method } }),
  confirmPayment: (id: number) => request(`/debts/${id}/confirm`, { method: "POST" }),
  rejectPayment: (id: number) => request(`/debts/${id}/reject`, { method: "POST" }),
};
