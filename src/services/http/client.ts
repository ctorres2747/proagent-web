import { API_URL } from "@/config/env";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

async function parseError(res: Response): Promise<never> {
  if (res.status === 401) {
    throw new ApiError(401, "No autorizado");
  }
  let detail = res.statusText;
  try {
    const data = (await res.json()) as { detail?: string };
    if (data?.detail) detail = data.detail;
  } catch {
    // non-JSON error body — keep statusText
  }
  throw new ApiError(res.status, detail);
}

/**
 * Minimal fetch wrapper. Base host comes from NEXT_PUBLIC_API_URL so the app
 * is portable across VPS hosts. A 401 surfaces as ApiError(401) so the auth
 * layer can clear the stored token.
 */
export async function apiFetch<T>(
  path: string,
  { method = "GET", token, body, query }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let url = `${API_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Multipart upload (no Content-Type — browser sets boundary). */
export async function apiUploadForm<T>(
  path: string,
  form: FormData,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
