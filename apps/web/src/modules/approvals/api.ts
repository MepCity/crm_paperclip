import { apiFetch } from "@/lib/api/client/fetch";
import type {
  ApprovalCounts,
  ApprovalDetail,
  ApprovalHistoryItem,
  ApprovalListItem,
  ApprovalProcess,
  DecisionAction,
  DecisionInput,
  HistoryMeta,
  Page,
} from "./types";

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

export async function fetchApprovalCounts(orgSlug: string): Promise<ApprovalCounts> {
  const res = (await apiFetch(orgSlug, "/crm/v2.2/approvals/counts")) as ApprovalCounts;
  return res ?? { blueprint: 0, approval: 0, review: 0, image_validation: 0 };
}

export async function fetchQueue(
  orgSlug: string,
  params: {
    type?: string;
    status?: string;
    module?: string;
    cursor?: string;
    limit?: number;
  },
): Promise<Page<ApprovalListItem>> {
  const path = `/crm/v2.2/approvals${buildQuery(params)}`;
  const res = (await apiFetch(orgSlug, path)) as Page<ApprovalListItem> | null;
  return res ?? { items: [], nextCursor: null };
}

export async function fetchApprovalDetail(orgSlug: string, id: string): Promise<ApprovalDetail> {
  return (await apiFetch(
    orgSlug,
    `/crm/v2.2/approvals/${encodeURIComponent(id)}`,
  )) as ApprovalDetail;
}

export async function decideApprovalAction(
  orgSlug: string,
  id: string,
  action: DecisionAction,
  body?: DecisionInput,
): Promise<ApprovalDetail> {
  return (await apiFetch(
    orgSlug,
    `/crm/v2.2/approvals/${encodeURIComponent(id)}/actions/${encodeURIComponent(action)}`,
    {
      method: "POST",
      body: body ?? {},
    },
  )) as ApprovalDetail;
}

export async function fetchHistoryMeta(orgSlug: string, type = "review"): Promise<HistoryMeta> {
  const res = (await apiFetch(
    orgSlug,
    `/crm/v2.2/approvals/history/meta${buildQuery({ type })}`,
  )) as HistoryMeta | null;
  return res ?? { types: ["approval", "review"], actions: [], modules: [], users: [] };
}

export async function fetchHistory(
  orgSlug: string,
  params: {
    type?: string;
    module?: string;
    user?: string;
    action?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
  },
): Promise<Page<ApprovalHistoryItem>> {
  const path = `/crm/v2.2/approvals/history${buildQuery(params)}`;
  const res = (await apiFetch(orgSlug, path)) as Page<ApprovalHistoryItem> | null;
  return res ?? { items: [], nextCursor: null };
}

/* Setup API */

export async function fetchApprovalProcesses(orgSlug: string): Promise<ApprovalProcess[]> {
  const res = (await apiFetch(orgSlug, "/crm/v2.1/settings/approval_processes")) as {
    approval_processes: ApprovalProcess[];
  } | null;
  return res?.approval_processes ?? [];
}

export async function fetchApprovalProcess(orgSlug: string, id: string): Promise<ApprovalProcess> {
  return (await apiFetch(
    orgSlug,
    `/crm/v2.1/settings/approval_processes/${encodeURIComponent(id)}`,
  )) as ApprovalProcess;
}

export async function createApprovalProcess(
  orgSlug: string,
  data: unknown,
): Promise<ApprovalProcess> {
  return (await apiFetch(orgSlug, "/crm/v2.1/settings/approval_processes", {
    method: "POST",
    body: data,
  })) as ApprovalProcess;
}

export async function updateApprovalProcess(
  orgSlug: string,
  id: string,
  data: unknown,
): Promise<ApprovalProcess> {
  return (await apiFetch(
    orgSlug,
    `/crm/v2.1/settings/approval_processes/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: data,
    },
  )) as ApprovalProcess;
}

export async function deleteApprovalProcess(orgSlug: string, id: string): Promise<void> {
  await apiFetch(orgSlug, `/crm/v2.1/settings/approval_processes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function reorderApprovalProcesses(
  orgSlug: string,
  ids: string[],
): Promise<ApprovalProcess[]> {
  const res = (await apiFetch(orgSlug, "/crm/v2.1/settings/approval_processes/actions/reorder", {
    method: "POST",
    body: { ids },
  })) as { approval_processes: ApprovalProcess[] } | null;
  return res?.approval_processes ?? [];
}

/* Review processes Setup API */

export async function fetchReviewProcesses(orgSlug: string): Promise<ApprovalProcess[]> {
  const res = (await apiFetch(orgSlug, "/crm/v2.1/settings/review_processes")) as {
    review_processes: ApprovalProcess[];
  } | null;
  return res?.review_processes ?? [];
}

export async function fetchReviewProcess(orgSlug: string, id: string): Promise<ApprovalProcess> {
  return (await apiFetch(
    orgSlug,
    `/crm/v2.1/settings/review_processes/${encodeURIComponent(id)}`,
  )) as ApprovalProcess;
}

export async function createReviewProcess(
  orgSlug: string,
  data: unknown,
): Promise<ApprovalProcess> {
  return (await apiFetch(orgSlug, "/crm/v2.1/settings/review_processes", {
    method: "POST",
    body: data,
  })) as ApprovalProcess;
}

export async function updateReviewProcess(
  orgSlug: string,
  id: string,
  data: unknown,
): Promise<ApprovalProcess> {
  return (await apiFetch(orgSlug, `/crm/v2.1/settings/review_processes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: data,
  })) as ApprovalProcess;
}

export async function deleteReviewProcess(orgSlug: string, id: string): Promise<void> {
  await apiFetch(orgSlug, `/crm/v2.1/settings/review_processes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function reorderReviewProcesses(
  orgSlug: string,
  ids: string[],
): Promise<ApprovalProcess[]> {
  const res = (await apiFetch(orgSlug, "/crm/v2.1/settings/review_processes/actions/reorder", {
    method: "POST",
    body: { ids },
  })) as { review_processes: ApprovalProcess[] } | null;
  return res?.review_processes ?? [];
}
