import { useQuery } from "@tanstack/react-query";

import { activityApi } from "./api";

export function useActivity(homeId: number | null | undefined) {
  return useQuery({
    queryKey: ["activity", homeId],
    queryFn: () => activityApi.listByHome(homeId!),
    enabled: typeof homeId === "number",
  });
}
