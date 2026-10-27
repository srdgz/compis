import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { homesApi } from "./api";

export function useHome(homeId: number | null | undefined) {
  return useQuery({
    queryKey: ["home", homeId],
    queryFn: () => homesApi.get(homeId!),
    enabled: typeof homeId === "number",
  });
}

export function useCreateHome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => homesApi.create(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roomie"] }),
  });
}

export function useAddRoomie(homeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => homesApi.addRoomie(homeId, email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roomies", homeId] });
      void queryClient.invalidateQueries({ queryKey: ["activity", homeId] });
    },
  });
}

export function useRemoveRoomie(homeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomieId: number) => homesApi.removeRoomie(homeId, roomieId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roomies", homeId] });
      void queryClient.invalidateQueries({ queryKey: ["activity", homeId] });
    },
  });
}
