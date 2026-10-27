import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/AuthProvider";

import { roomiesApi } from "./api";
import type { ProfileChanges } from "./api";

export function useCurrentRoomie() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["roomie", session?.roomieId],
    queryFn: () => roomiesApi.get(session!.roomieId),
    enabled: session !== null,
  });
}

export function useHomeRoomies(homeId: number | null | undefined) {
  return useQuery({
    queryKey: ["roomies", homeId],
    queryFn: () => roomiesApi.listByHome(homeId!),
    enabled: typeof homeId === "number",
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (changes: ProfileChanges) => roomiesApi.update(session!.roomieId, changes),
    onSuccess: (roomie) => {
      queryClient.setQueryData(["roomie", roomie.id], roomie);
      void queryClient.invalidateQueries({ queryKey: ["roomies"] });
    },
  });
}

export function useDeactivateAccount() {
  const { session } = useAuth();
  return useMutation({ mutationFn: () => roomiesApi.deactivate(session!.roomieId) });
}
