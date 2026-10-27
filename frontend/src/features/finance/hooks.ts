import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeApi } from "./api";

export function useExpensesWithoutDebts(roomieId: number | undefined) {
  return useQuery({
    queryKey: ["expenses", roomieId],
    queryFn: () => financeApi.expensesWithoutDebts(roomieId!),
    enabled: typeof roomieId === "number",
  });
}

export function useDebts(roomieId: number | undefined) {
  return useQuery({
    queryKey: ["debts", roomieId, "open"],
    queryFn: () => financeApi.debts(roomieId!),
    enabled: typeof roomieId === "number",
  });
}

export function useSettledDebts(roomieId: number | undefined) {
  return useQuery({
    queryKey: ["debts", roomieId, "all"],
    queryFn: () => financeApi.debts(roomieId!, true),
    enabled: typeof roomieId === "number",
    select: (debts) => debts.filter((debt) => debt.status === "Confirmada"),
  });
}

export function useRefreshFinance() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ["expenses", "debts", "items", "activity", "calendar"]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useCreateExpense() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: ({ name, itemIds }: { name: string; itemIds: number[] }) =>
      financeApi.createExpense(name, itemIds),
    onSuccess: refresh,
  });
}

export function useCreateDebts() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (input: { expenseId: number; debtorIds: number[]; totalAmount: number }) =>
      financeApi.createDebts(input.expenseId, input.debtorIds, input.totalAmount),
    onSuccess: refresh,
  });
}

export function useReportPayment() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: ({ id, method }: { id: number; method: "cash" | "paypal_me" }) =>
      financeApi.reportPayment(id, method),
    onSuccess: refresh,
  });
}

export function useConfirmPayment() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (id: number) => financeApi.confirmPayment(id),
    onSuccess: refresh,
  });
}

export function useRejectPayment() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (id: number) => financeApi.rejectPayment(id),
    onSuccess: refresh,
  });
}
