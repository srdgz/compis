import { z } from "zod";

import { request } from "@/shared/api/http";

export { uploadsEnabled, uploadToCloudinary } from "@/shared/api/cloudinary";

export const fileSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  upload_date: z.string(),
  home_id: z.number(),
  expense_id: z.number().nullable(),
});

export type FileRecord = z.infer<typeof fileSchema>;

export const filesApi = {
  listByHome: (homeId: number) => request(`/file/home/${homeId}`, { schema: z.array(fileSchema) }),
  register: (input: { name: string; url: string; homeId: number }) =>
    request("/file", {
      method: "POST",
      body: { name: input.name, url: input.url, home_id: input.homeId },
      schema: fileSchema,
    }),
  remove: (id: number) => request(`/file/${id}`, { method: "DELETE" }),
};
