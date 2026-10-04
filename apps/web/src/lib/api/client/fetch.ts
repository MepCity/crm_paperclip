import { isAppError } from "@crm/core/errors";
import { decodeError } from "@/lib/api/wire/errors";

export const CRM_ORG_HEADER = "X-CRM-ORG";

export type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

export type ApiFetchFn = (path: string, options?: ApiFetchOptions) => Promise<unknown>;

function redirectToSignIn(): void {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/sign-in?next=${encodeURIComponent(next)}`);
}

/** Same-origin JSON fetch with session cookies and organization header. */
export async function apiFetch(
  orgSlug: string,
  path: string,
  options: ApiFetchOptions = {},
): Promise<unknown> {
  const { method = "GET", body, signal } = options;
  const headers = new Headers({ [CRM_ORG_HEADER]: orgSlug });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers,
    signal,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 204) return null;
  const text = await response.text();
  const parsed: unknown = text ? JSON.parse(text) : null;
  if (response.ok) return parsed;
  const error = decodeError(response.status, parsed);
  if (response.status === 401) redirectToSignIn();
  throw error;
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isAppError(error)) return false;
  return failureCount < 3;
}
