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
    queryKey: ["debts", roomieId],
    queryFn: () => financeApi.debts(roomieId!),
    enabled: typeof roomieId === "number",
  });
}

function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ["expenses", "debts", "items", "activity", "calendar"]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useCreateExpense() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ name, itemIds }: { name: string; itemIds: number[] }) =>
      financeApi.createExpense(name, itemIds),
    onSuccess: refresh,
  });
}

export function useCreateDebts() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (input: { expenseId: number; debtorIds: number[]; totalAmount: number }) =>
      financeApi.createDebts(input.expenseId, input.debtorIds, input.totalAmount),
    onSuccess: refresh,
  });
}

export function usePayDebt() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: number) => financeApi.payDebt(id),
    onSuccess: refresh,
  });
}
