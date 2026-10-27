import { useQuery } from "@tanstack/react-query";

import { calendarApi } from "./api";

export function useCalendar(roomieId: number | undefined) {
  return useQuery({
    queryKey: ["calendar", roomieId],
    queryFn: () => calendarApi.events(roomieId!),
    enabled: typeof roomieId === "number",
  });
}
