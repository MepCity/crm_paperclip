import type {
  AdCampaign,
  AdGroup,
  AdItem,
  AdKeyword,
  AdsSettings,
  CreateAdGroupInput,
  CreateAdItemInput,
  CreateAdKeywordInput,
  CreateCampaignInput,
  UpdateAdGroupInput,
  UpdateAdItemInput,
  UpdateAdKeywordInput,
  UpdateCampaignInput,
} from "@crm/core/ads";

export interface AdsTreeResponse {
  settings: AdsSettings;
  campaigns: AdCampaign[];
  groups: AdGroup[];
  keywords: AdKeyword[];
  items: AdItem[];
}

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
      // Ignore JSON parse errors
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchAdsTree(orgSlug: string): Promise<AdsTreeResponse> {
  const res = await fetch("/crm/v2.1/settings/ads/tree", {
    headers: headers(orgSlug),
  });
  return handleResponse<AdsTreeResponse>(res);
}

export async function createCampaign(
  orgSlug: string,
  input: CreateCampaignInput,
): Promise<AdCampaign> {
  const res = await fetch("/crm/v2.1/settings/ads/campaigns", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ campaign: AdCampaign }>(res);
  return data.campaign;
}

export async function updateCampaign(
  orgSlug: string,
  id: string,
  input: UpdateCampaignInput,
): Promise<AdCampaign> {
  const res = await fetch(`/crm/v2.1/settings/ads/campaigns/${id}`, {
    method: "PUT",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ campaign: AdCampaign }>(res);
  return data.campaign;
}

export async function deleteCampaign(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/ads/campaigns/${id}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<{ success: boolean }>(res);
}

export async function createAdGroup(orgSlug: string, input: CreateAdGroupInput): Promise<AdGroup> {
  const res = await fetch("/crm/v2.1/settings/ads/groups", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ group: AdGroup }>(res);
  return data.group;
}

export async function updateAdGroup(
  orgSlug: string,
  id: string,
  input: UpdateAdGroupInput,
): Promise<AdGroup> {
  const res = await fetch(`/crm/v2.1/settings/ads/groups/${id}`, {
    method: "PUT",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ group: AdGroup }>(res);
  return data.group;
}

export async function deleteAdGroup(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/ads/groups/${id}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<{ success: boolean }>(res);
}

export async function createAdKeyword(
  orgSlug: string,
  input: CreateAdKeywordInput,
): Promise<AdKeyword> {
  const res = await fetch("/crm/v2.1/settings/ads/keywords", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ keyword: AdKeyword }>(res);
  return data.keyword;
}

export async function updateAdKeyword(
  orgSlug: string,
  id: string,
  input: UpdateAdKeywordInput,
): Promise<AdKeyword> {
  const res = await fetch(`/crm/v2.1/settings/ads/keywords/${id}`, {
    method: "PUT",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ keyword: AdKeyword }>(res);
  return data.keyword;
}

export async function deleteAdKeyword(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/ads/keywords/${id}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<{ success: boolean }>(res);
}

export async function createAdItem(orgSlug: string, input: CreateAdItemInput): Promise<AdItem> {
  const res = await fetch("/crm/v2.1/settings/ads/items", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ item: AdItem }>(res);
  return data.item;
}

export async function updateAdItem(
  orgSlug: string,
  id: string,
  input: UpdateAdItemInput,
): Promise<AdItem> {
  const res = await fetch(`/crm/v2.1/settings/ads/items/${id}`, {
    method: "PUT",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ item: AdItem }>(res);
  return data.item;
}

export async function deleteAdItem(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/ads/items/${id}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<{ success: boolean }>(res);
}
