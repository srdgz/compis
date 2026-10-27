import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { filesApi, uploadToCloudinary } from "./api";

export function useHomeFiles(homeId: number | null | undefined) {
  return useQuery({
    queryKey: ["files", homeId],
    queryFn: () => filesApi.listByHome(homeId!),
    enabled: typeof homeId === "number",
  });
}

export function useUploadFile(homeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadToCloudinary(file);
      return filesApi.register({ name: file.name, url, homeId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["files", homeId] });
      void queryClient.invalidateQueries({ queryKey: ["activity", homeId] });
    },
  });
}

export function useDeleteFile(homeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => filesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", homeId] }),
  });
}
