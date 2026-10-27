import { z } from "zod";

import { request } from "@/shared/api/http";

export const homeSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_active: z.boolean(),
});

export type Home = z.infer<typeof homeSchema>;

const createdSchema = z.object({
  home_id: z.number(),
  shopping_list_id: z.number(),
});

export const homesApi = {
  get: (id: number) => request(`/home/${id}`, { schema: homeSchema }),
  create: (name: string) =>
    request("/home", { method: "POST", body: { name }, schema: createdSchema }),
  addRoomie: (homeId: number, email: string) =>
    request(`/home/${homeId}`, { method: "POST", body: { email } }),
  removeRoomie: (homeId: number, roomieId: number) =>
    request(`/home/${homeId}/${roomieId}`, { method: "DELETE" }),
};
