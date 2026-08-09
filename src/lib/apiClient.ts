import { env } from "@/config/env";
import { supabase } from "@/lib/supabaseClient";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  /** JSON body — serialized automatically. */
  body?: unknown;
  /** Multipart body (e.g. audio upload) — sent as-is, no Content-Type header. */
  formData?: FormData;
  /** Send the auth token (default true). */
  auth?: boolean;
  signal?: AbortSignal;
}

/**
 * Thin fetch wrapper around the backend API:
 *  - prefixes VITE_API_BASE_URL
 *  - attaches the Supabase JWT as `Authorization: Bearer <token>`
 *  - serializes/parses JSON
 *  - throws a typed `ApiError` on non-2xx
 */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body, formData, auth = true, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    signal,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : response.statusText) || "Request failed";
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}
