import type { z } from "zod";

import { API_URL } from "@/shared/config";

import { clearSession, getToken, notifyUnauthorized } from "./session";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions<T> {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  schema?: z.ZodType<T>;
}

export async function request<T = void>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Inténtalo de nuevo.");
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearSession();
      notifyUnauthorized();
    }
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Algo ha fallado. Inténtalo de nuevo.";
    throw new ApiError(response.status, message);
  }

  return options.schema ? options.schema.parse(data) : (data as T);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Algo ha fallado. Inténtalo de nuevo.";
}
