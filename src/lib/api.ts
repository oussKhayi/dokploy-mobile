// Minimal client for the Dokploy REST API (tRPC-OpenAPI).
// Every procedure is exposed as /api/<router>.<procedure>.
// Queries are GET with query-string params, mutations are POST with a JSON body.
// Auth is a single `x-api-key` header generated in Dokploy > Profile > API/CLI.

export type Credentials = { url: string; apiKey: string };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function normalizeUrl(input: string): string {
  let url = input.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  // Accept a pasted ".../api" base as well
  return url.replace(/\/api$/i, "");
}

async function request<T>(
  creds: Credentials,
  method: "GET" | "POST",
  procedure: string,
  input?: Record<string, unknown>,
): Promise<T> {
  let url = `${creds.url}/api/${procedure}`;
  const init: RequestInit = {
    method,
    headers: {
      accept: "application/json",
      "x-api-key": creds.apiKey,
      ...(method === "POST" ? { "content-type": "application/json" } : {}),
    },
  };

  if (method === "GET" && input) {
    const qs = Object.entries(input)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }
  if (method === "POST") init.body = JSON.stringify(input ?? {});

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new ApiError(`Network error: ${(e as Error).message}`, 0);
  }

  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // plain-text responses (some log endpoints) are returned as-is
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : typeof data === "string" && data
          ? data.slice(0, 300)
          : res.statusText) || `HTTP ${res.status}`;
    throw new ApiError(res.status === 401 ? "Invalid API key or URL" : msg, res.status);
  }
  return data as T;
}

export function createApi(creds: Credentials) {
  return {
    query: <T>(procedure: string, input?: Record<string, unknown>) =>
      request<T>(creds, "GET", procedure, input),
    mutate: <T = unknown>(procedure: string, input?: Record<string, unknown>) =>
      request<T>(creds, "POST", procedure, input),
  };
}

export type Api = ReturnType<typeof createApi>;
