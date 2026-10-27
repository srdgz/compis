import { z } from "zod";

import { request } from "@/shared/api/http";

export const activitySchema = z.object({
  id: z.number(),
  text: z.string(),
  roomie_name: z.string(),
  status: z.string(),
  amount: z.number().nullable(),
  date: z.string(),
  home_id: z.number(),
});

export type Activity = z.infer<typeof activitySchema>;

export const activityApi = {
  listByHome: (homeId: number) =>
    request(`/blog/home/${homeId}`, { schema: z.array(activitySchema) }),
};
