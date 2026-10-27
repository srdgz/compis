import { z } from "zod";

import { request } from "@/shared/api/http";

export const expenseSchema = z.object({
  id: z.number(),
  name: z.string(),
  debt_generated: z.boolean(),
  home_id: z.number(),
});

export const debtSchema = z.object({
  id: z.number(),
  name: z.string(),
  amount: z.number(),
  roomie_debtor_id: z.number(),
  roomie_paying_id: z.number(),
  status: z.string(),
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
  debts: (roomieId: number) =>
    request(`/debts/roomie/${roomieId}`, { schema: z.array(debtSchema) }),
  createDebts: (expenseId: number, debtorIds: number[], totalAmount: number) =>
    request("/debts", {
      method: "POST",
      body: { expense_id: expenseId, debtor_ids: debtorIds, total_amount: totalAmount },
    }),
  payDebt: (id: number) => request(`/debts/${id}`, { method: "POST" }),
};
