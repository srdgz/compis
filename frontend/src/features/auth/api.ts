import { z } from "zod";

import { request } from "@/shared/api/http";

const loginResponseSchema = z.object({
  token: z.string(),
  roomie_id: z.number(),
  is_admin: z.boolean(),
  home_id: z.number().nullable(),
});

export interface SignupInput {
  email: string;
  password: string;
  first_name: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request("/login", { method: "POST", body: { email, password }, schema: loginResponseSchema }),
  signup: (input: SignupInput) => request("/signup", { method: "POST", body: input }),
};
