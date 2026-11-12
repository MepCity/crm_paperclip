import type {
  AdCampaign,
  AdGroup,
  AdItem,
  AdKeyword,
  AdsSettings,
  AdsSummary,
  AttributionSource,
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

export interface NamedRef {
  id: string;
  name: string;
}

export interface RecordAttributionView {
  gclid: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  source: AttributionSource;
  modifiedTime: string;
  campaign: NamedRef | null;
  adGroup: NamedRef | null;
  keyword: NamedRef | null;
  ad: NamedRef | null;
}

export interface RecordAttributionOptions {
  campaigns: NamedRef[];
  adGroups: (NamedRef & { campaignId: string })[];
  keywords: (NamedRef & { adGroupId: string })[];
  ads: (NamedRef & { adGroupId: string })[];
}

export interface RecordAttributionResponse {
  attribution: RecordAttributionView | null;
  canEdit: boolean;
  options: RecordAttributionOptions | null;
}

export interface ManualAttributionBody {
  gclid: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  campaignId: string | null;
  adGroupId: string | null;
  keywordId: string | null;
  adItemId: string | null;
}

export async function fetchRecordAttribution(
  orgSlug: string,
  module: string,
  recordId: string,
): Promise<RecordAttributionResponse> {
  const res = await fetch(`/crm/v2.1/${module}/${recordId}/ad_attribution`, {
    headers: headers(orgSlug),
  });
  return handleResponse<RecordAttributionResponse>(res);
}

export async function saveRecordAttribution(
  orgSlug: string,
  module: string,
  recordId: string,
  body: ManualAttributionBody,
): Promise<RecordAttributionResponse> {
  const res = await fetch(`/crm/v2.1/${module}/${recordId}/ad_attribution`, {
    method: "PUT",
    headers: headers(orgSlug),
    body: JSON.stringify(body),
  });
  return handleResponse<RecordAttributionResponse>(res);
}

export async function fetchAdsSummary(
  orgSlug: string,
  range: { from?: string; to?: string },
): Promise<AdsSummary> {
  const params = new URLSearchParams();
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
  const query = params.toString();
  const res = await fetch(`/crm/v2.1/ads/reports/summary${query ? `?${query}` : ""}`, {
    headers: headers(orgSlug),
  });
  return (await handleResponse<{ summary: AdsSummary }>(res)).summary;
}
