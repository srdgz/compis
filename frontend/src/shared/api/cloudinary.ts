import { z } from "zod";

import { CLOUDINARY } from "@/shared/config";

const uploadResponseSchema = z.object({ secure_url: z.string() });

export function uploadsEnabled(): boolean {
  return CLOUDINARY.cloudName !== "" && CLOUDINARY.uploadPreset !== "";
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY.uploadPreset);
  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/auto/upload`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new Error("No se pudo subir el archivo. Comprueba tu conexión.");
  }
  if (!response.ok) throw new Error("No se pudo subir el archivo. Inténtalo de nuevo.");
  return uploadResponseSchema.parse(await response.json()).secure_url;
}

const CLOUDINARY_UPLOAD_PATH = "/image/upload/";

export function avatarSrc(url: string | null | undefined, size: number): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "res.cloudinary.com" && url.includes(CLOUDINARY_UPLOAD_PATH)) {
      const pixels = Math.min(Math.max(Math.round(size * 2), 64), 512);
      return url.replace(
        CLOUDINARY_UPLOAD_PATH,
        `${CLOUDINARY_UPLOAD_PATH}c_fill,g_face,w_${pixels},h_${pixels},f_auto,q_auto/`,
      );
    }
  } catch {
    return null;
  }
  return url;
}

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateAvatarFile(file: Pick<File, "type" | "size">): string | null {
  if (!AVATAR_TYPES.includes(file.type)) {
    return "Elige una imagen JPG, PNG, WebP o GIF.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "La imagen pesa más de 5 MB. Elige una más pequeña.";
  }
  return null;
}
