import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "./api";
import type { NewTask } from "./api";

export function useHomeTasks(homeId: number | null | undefined) {
  return useQuery({
    queryKey: ["tasks", homeId],
    queryFn: () => tasksApi.listByHome(homeId!),
    enabled: typeof homeId === "number",
  });
}

function useTaskMutation<TVariables>(
  homeId: number,
  fn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", homeId] });
      void queryClient.invalidateQueries({ queryKey: ["activity", homeId] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useCreateTask(homeId: number) {
  return useTaskMutation(homeId, (task: NewTask) => tasksApi.create(task));
}

export function useCompleteTask(homeId: number) {
  return useTaskMutation(homeId, (id: number) => tasksApi.complete(id));
}

export function useRescheduleTask(homeId: number) {
  return useTaskMutation(homeId, ({ id, date }: { id: number; date: string }) =>
    tasksApi.reschedule(id, date),
  );
}

export function useDeleteTask(homeId: number) {
  return useTaskMutation(homeId, (id: number) => tasksApi.remove(id));
}
