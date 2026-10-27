import { z } from "zod";

import { roomieSchema } from "@/features/roomies/api";
import { request } from "@/shared/api/http";

export const taskSchema = z.object({
  id: z.number(),
  name: z.string(),
  date_assigned: z.string(),
  date_done: z.string().nullable(),
  roomie_id: z.number(),
  roomie: roomieSchema.optional(),
});

export type Task = z.infer<typeof taskSchema>;

export interface NewTask {
  roomie_id: number;
  name: string;
  date_assigned: string;
}

export const tasksApi = {
  listByHome: (homeId: number) => request(`/task/home/${homeId}`, { schema: z.array(taskSchema) }),
  create: (task: NewTask) => request("/task", { method: "POST", body: task, schema: taskSchema }),
  complete: (id: number) => request(`/task/${id}`, { method: "PUT" }),
  reschedule: (id: number, date: string) =>
    request(`/task/date/${id}`, {
      method: "PUT",
      body: { new_date_assigned: date },
      schema: taskSchema,
    }),
  remove: (id: number) => request(`/task/${id}`, { method: "DELETE" }),
};
