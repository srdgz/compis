import { z } from "zod";

import { request } from "@/shared/api/http";

export const roomieSchema = z.object({
  id: z.number(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string().nullable(),
  avatar: z.string().nullable(),
  paypal_username: z.string().nullable(),
  admin: z.boolean(),
  is_active: z.boolean(),
  home_id: z.number().nullable(),
});

export type Roomie = z.infer<typeof roomieSchema>;

export interface ProfileChanges {
  first_name?: string;
  last_name?: string;
  paypal_username?: string;
  avatar?: string | null;
  password?: string;
}

export const roomiesApi = {
  get: (id: number) => request(`/roomie/${id}`, { schema: roomieSchema }),
  listByHome: (homeId: number) =>
    request(`/roomie/home/${homeId}`, { schema: z.array(roomieSchema) }),
  update: (id: number, changes: ProfileChanges) =>
    request(`/roomie/${id}`, { method: "PUT", body: changes, schema: roomieSchema }),
  deactivate: (id: number) =>
    request(`/roomie/delete/${id}`, { method: "PUT", schema: roomieSchema }),
};

export function fullName(roomie: Pick<Roomie, "first_name" | "last_name">): string {
  return [roomie.first_name, roomie.last_name].filter(Boolean).join(" ");
}
