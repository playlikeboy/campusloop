// Bearer-authenticated calls to https://campusloop.space/api/*.
import { getAccessToken, refreshTokens } from "./auth";
import { BASE_URL } from "./config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; signal?: AbortSignal };

async function send(path: string, token: string | null, opts: Options): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  return fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await send(path, await getAccessToken(), opts);
    if (res.status === 401) {
      // Refresh once and retry; a failed refresh signs the student out (see auth.ts).
      const fresh = await refreshTokens();
      if (fresh) res = await send(path, fresh.accessToken, opts);
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw e;
    throw new ApiError(0, "No connection. Check your internet and try again.");
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg = (json as { error?: string } | null)?.error;
    throw new ApiError(res.status, msg || friendlyStatus(res.status));
  }
  return json as T;
}

function friendlyStatus(status: number): string {
  if (status === 401) return "You are signed out. Sign in again.";
  if (status === 403) return "You can't do that yet. Finish your profile on the web first.";
  if (status === 404) return "Not found. It may have been deleted.";
  if (status === 429) return "Slow down a little and try again.";
  return "Something went wrong. Try again.";
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Try again.";
