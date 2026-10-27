import { z } from "zod";

import { request } from "@/shared/api/http";
import { CLOUDINARY } from "@/shared/config";

export const fileSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  upload_date: z.string(),
  home_id: z.number(),
  expense_id: z.number().nullable(),
});

export type FileRecord = z.infer<typeof fileSchema>;

const uploadResponseSchema = z.object({ secure_url: z.string() });

export function uploadsEnabled(): boolean {
  return CLOUDINARY.cloudName !== "" && CLOUDINARY.uploadPreset !== "";
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY.uploadPreset);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/auto/upload`,
    { method: "POST", body: form },
  );
  if (!response.ok) throw new Error("No se pudo subir el archivo. Inténtalo de nuevo.");
  return uploadResponseSchema.parse(await response.json()).secure_url;
}

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
