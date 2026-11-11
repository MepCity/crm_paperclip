import type {
  CreateJourneyInput,
  JourneyDetail,
  JourneyFilters,
  JourneyInstanceFilterOptions,
  JourneyInstanceSummary,
  JourneySummary,
  JourneyTransitionRunSummary,
  UpdateJourneyDraftInput,
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
      else if (err.errors) {
        const msgs = Object.values(err.errors).flat() as string[];
        if (msgs.length > 0) msg = msgs.join("\n");
      }
    } catch {
      // Ignore json parse error
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchJourneys(
  orgSlug: string,
  filters?: JourneyFilters,
): Promise<JourneySummary[]> {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.module && filters.module !== "all") query.set("module", filters.module);
  if (filters?.status && filters.status !== "all") query.set("status", filters.status);

  const qs = query.toString();
  const url = `/crm/v2.1/settings/journeys${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ journeys: JourneySummary[] }>(res);
  return data.journeys;
}

export async function fetchJourney(orgSlug: string, id: string): Promise<JourneyDetail> {
  const res = await fetch(`/crm/v2.1/settings/journeys/${id}`, {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ journey: JourneyDetail }>(res);
  return data.journey;
}

export async function createJourney(
  orgSlug: string,
  input: CreateJourneyInput,
): Promise<JourneyDetail> {
  const res = await fetch("/crm/v2.1/settings/journeys", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ journey: JourneyDetail }>(res);
  return data.journey;
}

export async function updateJourneyDraft(
  orgSlug: string,
  id: string,
  input: UpdateJourneyDraftInput,
): Promise<JourneyDetail> {
  const res = await fetch(`/crm/v2.1/settings/journeys/${id}`, {
    method: "PUT",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ journey: JourneyDetail }>(res);
  return data.journey;
}

export async function publishJourney(orgSlug: string, id: string): Promise<JourneyDetail> {
  const res = await fetch(`/crm/v2.1/settings/journeys/${id}/actions/publish`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ journey: JourneyDetail }>(res);
  return data.journey;
}

export async function activateJourney(orgSlug: string, id: string): Promise<JourneyDetail> {
  const res = await fetch(`/crm/v2.1/settings/journeys/${id}/actions/activate`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ journey: JourneyDetail }>(res);
  return data.journey;
}

export async function deactivateJourney(orgSlug: string, id: string): Promise<JourneyDetail> {
  const res = await fetch(`/crm/v2.1/settings/journeys/${id}/actions/deactivate`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ journey: JourneyDetail }>(res);
  return data.journey;
}

export async function deleteJourney(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/journeys/${id}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<{ ok: boolean }>(res);
}

export async function fetchJourneyInstances(
  orgSlug: string,
  journeyId: string,
  options?: JourneyInstanceFilterOptions,
): Promise<{ instances: JourneyInstanceSummary[]; total: number }> {
  const query = new URLSearchParams();
  if (options?.stateId) query.set("stateId", options.stateId);
  if (options?.status) query.set("status", options.status);
  if (options?.enteredBefore)
    query.set(
      "enteredBefore",
      typeof options.enteredBefore === "string"
        ? options.enteredBefore
        : options.enteredBefore.toISOString(),
    );
  if (options?.enteredAfter)
    query.set(
      "enteredAfter",
      typeof options.enteredAfter === "string"
        ? options.enteredAfter
        : options.enteredAfter.toISOString(),
    );
  if (options?.deadlineBefore)
    query.set(
      "deadlineBefore",
      typeof options.deadlineBefore === "string"
        ? options.deadlineBefore
        : options.deadlineBefore.toISOString(),
    );
  if (options?.deadlineAfter)
    query.set(
      "deadlineAfter",
      typeof options.deadlineAfter === "string"
        ? options.deadlineAfter
        : options.deadlineAfter.toISOString(),
    );
  if (options?.page) query.set("page", String(options.page));
  if (options?.limit) query.set("limit", String(options.limit));

  const qs = query.toString();
  const res = await fetch(
    `/crm/v2.1/settings/journeys/${journeyId}/instances${qs ? `?${qs}` : ""}`,
    {
      headers: headers(orgSlug),
    },
  );
  return handleResponse<{ instances: JourneyInstanceSummary[]; total: number }>(res);
}

export async function fetchJourneyTransitionLog(
  orgSlug: string,
  journeyId: string,
  instanceId: string,
): Promise<JourneyTransitionRunSummary[]> {
  const res = await fetch(`/crm/v2.1/settings/journeys/${journeyId}/instances/${instanceId}/log`, {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{
    log?: JourneyTransitionRunSummary[];
    data?: JourneyTransitionRunSummary[];
  }>(res);
  return data.log ?? data.data ?? [];
}

export async function stopJourneyInstance(
  orgSlug: string,
  journeyId: string,
  instanceId: string,
): Promise<JourneyInstanceSummary> {
  const res = await fetch(`/crm/v2.1/settings/journeys/${journeyId}/instances/${instanceId}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ instance: JourneyInstanceSummary }>(res);
  return data.instance;
}
