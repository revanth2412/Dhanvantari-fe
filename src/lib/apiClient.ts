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
  options: RequestOptions = {},
): Promise<T> {
  return (await request<T>(path, options)).data;
}

/** A page of results plus the server's total match count. */
export interface Page<T> {
  items: T[];
  /** From `X-Total-Count`; falls back to the page length if absent. */
  total: number;
}

/**
 * List endpoints that paginate. The backend reports the full match count in
 * `X-Total-Count`, which the body can't carry — hence a separate helper rather
 * than a flag on `apiRequest`.
 */
export async function apiList<T>(
  path: string,
  options: RequestOptions = {},
): Promise<Page<T>> {
  const { data, headers } = await request<T[]>(path, options);
  const items = data ?? [];
  const header = headers.get("X-Total-Count");
  const total = header === null ? items.length : Number(header);
  return { items, total: Number.isFinite(total) ? total : items.length };
}

/** Builds `?a=1&b=2`, dropping empty values so a blank filter isn't sent. */
export function queryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(
  path: string,
  { method = "GET", body, formData, auth = true, signal }: RequestOptions = {},
): Promise<{ data: T; headers: Headers }> {
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

  return { data: payload as T, headers: response.headers };
}
