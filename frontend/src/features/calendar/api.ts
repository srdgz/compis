import { z } from "zod";

import { request } from "@/shared/api/http";

export const calendarEventSchema = z.object({
  id: z.number(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  type: z.enum(["task", "debt"]),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export const calendarApi = {
  events: (roomieId: number) =>
    request(`/calendar/${roomieId}`, { schema: z.array(calendarEventSchema) }),
};
