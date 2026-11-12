import type { PortalListPage, PortalRecordDetail, PortalSessionInfo } from "./types";

export class PortalApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, readonly string[]>,
  ) {
    super(message);
    this.name = "PortalApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return {} as T;
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new PortalApiError(res.status, `Request failed with status ${res.status}`);
  }
  if (!res.ok) {
    const errorBody = json as { message?: string; errors?: Record<string, readonly string[]> };
    throw new PortalApiError(
      res.status,
      errorBody.message || `Request failed with status ${res.status}`,
      errorBody.errors,
    );
  }
  return json as T;
}

export async function getPortalMe(slug: string): Promise<PortalSessionInfo | null> {
  const res = await fetch(`/api/portal/${encodeURIComponent(slug)}/me`, {
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 404) {
    return null;
  }
  return handleResponse<PortalSessionInfo>(res);
}

export async function loginPortal(
  slug: string,
  credentials: { email: string; password: string },
): Promise<{ user: { email: string; name: string } }> {
  const res = await fetch(`/api/portal/${encodeURIComponent(slug)}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return handleResponse<{ user: { email: string; name: string } }>(res);
}

export async function acceptPortalInvite(
  slug: string,
  body: { token: string; password: string },
): Promise<{ user: { email: string } }> {
  const res = await fetch(`/api/portal/${encodeURIComponent(slug)}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<{ user: { email: string } }>(res);
}

export async function requestPortalReset(
  slug: string,
  email: string,
): Promise<{ message: string }> {
  const res = await fetch(`/api/portal/${encodeURIComponent(slug)}/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function completePortalReset(
  slug: string,
  body: { token: string; password: string },
): Promise<{ user: { email: string } }> {
  const res = await fetch(`/api/portal/${encodeURIComponent(slug)}/password-reset/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<{ user: { email: string } }>(res);
}

export async function logoutPortal(slug: string): Promise<void> {
  const res = await fetch(`/api/portal/${encodeURIComponent(slug)}/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (res.status !== 204 && !res.ok) {
    throw new PortalApiError(res.status, "Logout failed");
  }
}

export async function fetchPortalRecords(
  slug: string,
  module: string,
  query?: {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
    search?: string;
  },
): Promise<PortalListPage> {
  const sp = new URLSearchParams();
  if (query?.page) sp.set("page", String(query.page));
  if (query?.per_page) sp.set("per_page", String(query.per_page));
  if (query?.sort_by) sp.set("sort_by", query.sort_by);
  if (query?.sort_order) sp.set("sort_order", query.sort_order);
  if (query?.search) sp.set("search", query.search);

  const qs = sp.toString();
  const url = `/api/portal/${encodeURIComponent(slug)}/records/${encodeURIComponent(module)}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  return handleResponse<PortalListPage>(res);
}

export async function fetchPortalRecord(
  slug: string,
  module: string,
  id: string,
): Promise<PortalRecordDetail> {
  const url = `/api/portal/${encodeURIComponent(slug)}/records/${encodeURIComponent(module)}/${encodeURIComponent(id)}`;
  const res = await fetch(url, { cache: "no-store" });
  return handleResponse<PortalRecordDetail>(res);
}

export async function createPortalRecord(
  slug: string,
  module: string,
  data: Record<string, unknown>,
): Promise<{ id: string }> {
  const url = `/api/portal/${encodeURIComponent(slug)}/records/${encodeURIComponent(module)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await handleResponse<{ data?: { id?: string }; id?: string }>(res);
  const id = json.data?.id ?? json.id ?? "";
  return { id };
}

export async function updatePortalRecord(
  slug: string,
  module: string,
  id: string,
  data: Record<string, unknown>,
): Promise<{ id: string }> {
  const url = `/api/portal/${encodeURIComponent(slug)}/records/${encodeURIComponent(module)}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await handleResponse<{ data?: { id?: string }; id?: string }>(res);
  const recordId = json.data?.id ?? json.id ?? id;
  return { id: recordId };
}
