import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { shoppingApi } from "./api";

export function useShoppingList(homeId: number | null | undefined) {
  return useQuery({
    queryKey: ["list", homeId],
    queryFn: () => shoppingApi.getList(homeId!),
    enabled: typeof homeId === "number",
  });
}

export function useShoppingItems(listId: number | undefined, purchased = false) {
  return useQuery({
    queryKey: ["items", listId, purchased],
    queryFn: () => shoppingApi.listItems(listId!, purchased),
    enabled: typeof listId === "number",
  });
}

export function useAddItem(listId: number, homeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => shoppingApi.addItem(listId, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", listId] });
      void queryClient.invalidateQueries({ queryKey: ["activity", homeId] });
    },
  });
}

export function useRemoveItem(listId: number, homeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => shoppingApi.removeItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", listId] });
      void queryClient.invalidateQueries({ queryKey: ["activity", homeId] });
    },
  });
}
