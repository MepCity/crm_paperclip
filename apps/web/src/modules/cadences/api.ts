import type {
  CadenceDetail,
  CadenceFilters,
  CadenceSummary,
  CreateCadenceInput,
  UpdateCadenceDraftInput,
} from "./types";

function headers(orgSlug: string) {
  return {
    "Content-Type": "application/json",
    "X-CRM-ORG": orgSlug,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
      else if (err.error?.message) msg = err.error.message;
    } catch {
      // Ignore json parse error
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchCadences(
  orgSlug: string,
  filters?: CadenceFilters,
): Promise<CadenceSummary[]> {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.module && filters.module !== "all") query.set("module", filters.module);
  if (filters?.status && filters.status !== "all") query.set("status", filters.status);

  const qs = query.toString();
  const url = `/crm/v2.1/settings/cadences${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ cadences: CadenceSummary[] }>(res);
  return data.cadences;
}

export async function fetchCadence(orgSlug: string, id: string): Promise<CadenceDetail> {
  const res = await fetch(`/crm/v2.1/settings/cadences/${id}`, {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ cadence: CadenceDetail }>(res);
  return data.cadence;
}

export async function createCadence(
  orgSlug: string,
  input: CreateCadenceInput,
): Promise<CadenceDetail> {
  const res = await fetch("/crm/v2.1/settings/cadences", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ cadence: CadenceDetail }>(res);
  return data.cadence;
}

export async function updateCadenceDraft(
  orgSlug: string,
  id: string,
  input: UpdateCadenceDraftInput,
): Promise<CadenceDetail> {
  const res = await fetch(`/crm/v2.1/settings/cadences/${id}`, {
    method: "PUT",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ cadence: CadenceDetail }>(res);
  return data.cadence;
}

export async function publishCadence(orgSlug: string, id: string): Promise<CadenceDetail> {
  const res = await fetch(`/crm/v2.1/settings/cadences/${id}/actions/publish`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ cadence: CadenceDetail }>(res);
  return data.cadence;
}

export async function activateCadence(orgSlug: string, id: string): Promise<CadenceDetail> {
  const res = await fetch(`/crm/v2.1/settings/cadences/${id}/actions/activate`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ cadence: CadenceDetail }>(res);
  return data.cadence;
}

export async function deactivateCadence(orgSlug: string, id: string): Promise<CadenceDetail> {
  const res = await fetch(`/crm/v2.1/settings/cadences/${id}/actions/deactivate`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ cadence: CadenceDetail }>(res);
  return data.cadence;
}

export async function deleteCadence(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/cadences/${id}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<{ ok: boolean }>(res);
}

export async function enrollRecord(
  orgSlug: string,
  cadenceId: string,
  input: { recordModule: string; recordId: string },
): Promise<{ enrollment: unknown }> {
  const res = await fetch(`/crm/v2.1/settings/cadences/${cadenceId}/enroll`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  return handleResponse<{ enrollment: unknown }>(res);
}

export async function enrollRecords(
  orgSlug: string,
  cadenceId: string,
  input: { recordModule: string; recordIds: string[] },
): Promise<{ enrolled: unknown[]; skippedCount: number }> {
  const res = await fetch(`/crm/v2.1/settings/cadences/${cadenceId}/enroll`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  return handleResponse<{ enrolled: unknown[]; skippedCount: number }>(res);
}

export async function fetchCadenceEnrollments(
  orgSlug: string,
  cadenceId: string,
  params?: { recordId?: string; state?: string },
): Promise<unknown[]> {
  const query = new URLSearchParams();
  if (params?.recordId) query.set("recordId", params.recordId);
  if (params?.state) query.set("state", params.state);
  const qs = query.toString();
  const res = await fetch(
    `/crm/v2.1/settings/cadences/${cadenceId}/enrollments${qs ? `?${qs}` : ""}`,
    {
      headers: headers(orgSlug),
    },
  );
  const data = await handleResponse<{ enrollments: unknown[] }>(res);
  return data.enrollments;
}

export async function pauseEnrollment(
  orgSlug: string,
  enrollmentId: string,
): Promise<{ enrollment: unknown }> {
  const res = await fetch(`/crm/v2.1/settings/cadences/enrollments/${enrollmentId}`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify({ action: "pause" }),
  });
  return handleResponse<{ enrollment: unknown }>(res);
}

export async function resumeEnrollment(
  orgSlug: string,
  enrollmentId: string,
): Promise<{ enrollment: unknown }> {
  const res = await fetch(`/crm/v2.1/settings/cadences/enrollments/${enrollmentId}`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify({ action: "resume" }),
  });
  return handleResponse<{ enrollment: unknown }>(res);
}

export async function unenrollRecord(
  orgSlug: string,
  enrollmentId: string,
  reason?: string,
): Promise<{ enrollment: unknown }> {
  const res = await fetch(`/crm/v2.1/settings/cadences/enrollments/${enrollmentId}`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify({ action: "unenroll", reason }),
  });
  return handleResponse<{ enrollment: unknown }>(res);
}
