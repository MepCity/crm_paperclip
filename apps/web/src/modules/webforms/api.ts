import type {
  EligibleField,
  Webform,
  WebformAutoResponseRule,
  WebformDetail,
  WebformField,
  WebformLocation,
  WebformModule,
  WebformSettings,
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

export async function fetchWebforms(orgSlug: string): Promise<Webform[]> {
  const res = await fetch("/crm/v2.1/settings/webforms", {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ webforms: Webform[] }>(res);
  return data.webforms;
}

export async function fetchWebform(orgSlug: string, id: string): Promise<WebformDetail> {
  const res = await fetch(`/crm/v2.1/settings/webforms/${id}`, {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ webform: WebformDetail }>(res);
  return data.webform;
}

export async function createWebform(
  orgSlug: string,
  input: { name: string; module: WebformModule },
): Promise<WebformDetail> {
  const res = await fetch("/crm/v2.1/settings/webforms", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ webform: WebformDetail }>(res);
  return data.webform;
}

export async function updateDraft(
  orgSlug: string,
  id: string,
  input: {
    name?: string;
    fields?: WebformField[];
    settings?: WebformSettings;
  },
): Promise<WebformDetail> {
  const res = await fetch(`/crm/v2.1/settings/webforms/${id}`, {
    method: "PUT",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ webform: WebformDetail }>(res);
  return data.webform;
}

export async function publishWebform(orgSlug: string, id: string): Promise<WebformDetail> {
  const res = await fetch(`/crm/v2.1/settings/webforms/${id}/actions/publish`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ webform: WebformDetail }>(res);
  return data.webform;
}

export async function activateWebform(orgSlug: string, id: string): Promise<Webform> {
  const res = await fetch(`/crm/v2.1/settings/webforms/${id}/actions/activate`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ webform: Webform }>(res);
  return data.webform;
}

export async function deactivateWebform(orgSlug: string, id: string): Promise<Webform> {
  const res = await fetch(`/crm/v2.1/settings/webforms/${id}/actions/deactivate`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ webform: Webform }>(res);
  return data.webform;
}

export async function deleteWebform(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/webforms/${id}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<{ ok: boolean }>(res);
}

export async function regenerateKey(
  orgSlug: string,
  id: string,
): Promise<{ publicKey: string; keyHash: string }> {
  const res = await fetch(`/crm/v2.1/settings/webforms/${id}/actions/regenerate_key`, {
    method: "POST",
    headers: headers(orgSlug),
  });
  return handleResponse<{ publicKey: string; keyHash: string }>(res);
}

export async function fetchLocations(orgSlug: string, id: string): Promise<WebformLocation[]> {
  const res = await fetch(`/crm/v2.1/settings/webforms/${id}/locations`, {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ locations: WebformLocation[] }>(res);
  return data.locations;
}

export async function addLocation(
  orgSlug: string,
  id: string,
  input: { origin: string; label?: string },
): Promise<WebformLocation> {
  const res = await fetch(`/crm/v2.1/settings/webforms/${id}/locations`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ location: WebformLocation }>(res);
  return data.location;
}

export async function removeLocation(orgSlug: string, id: string, origin: string): Promise<void> {
  const res = await fetch(
    `/crm/v2.1/settings/webforms/${id}/locations?origin=${encodeURIComponent(origin)}`,
    {
      method: "DELETE",
      headers: headers(orgSlug),
    },
  );
  await handleResponse<{ ok: boolean }>(res);
}

export async function fetchEligibleFields(
  orgSlug: string,
  module: WebformModule,
): Promise<EligibleField[]> {
  const res = await fetch(`/crm/v2.1/settings/webforms/eligible_fields?module=${module}`, {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ fields: EligibleField[] }>(res);
  return data.fields;
}

export async function fetchAutoResponseRules(
  orgSlug: string,
  module?: WebformModule,
): Promise<WebformAutoResponseRule[]> {
  const url = module
    ? `/crm/v2.1/settings/webform_auto_response_rules?module=${module}`
    : "/crm/v2.1/settings/webform_auto_response_rules";
  const res = await fetch(url, {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ rules: WebformAutoResponseRule[] }>(res);
  return data.rules;
}

export async function createAutoResponseRule(
  orgSlug: string,
  input: {
    module: WebformModule;
    name: string;
    criteria?: WebformAutoResponseRule["criteria"];
    templateId?: string | null;
    active?: boolean;
  },
): Promise<WebformAutoResponseRule> {
  const res = await fetch("/crm/v2.1/settings/webform_auto_response_rules", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ rule: WebformAutoResponseRule }>(res);
  return data.rule;
}

export async function updateAutoResponseRule(
  orgSlug: string,
  id: string,
  input: {
    name?: string;
    criteria?: WebformAutoResponseRule["criteria"];
    templateId?: string | null;
    active?: boolean;
  },
): Promise<WebformAutoResponseRule> {
  const res = await fetch(`/crm/v2.1/settings/webform_auto_response_rules/${id}`, {
    method: "PUT",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ rule: WebformAutoResponseRule }>(res);
  return data.rule;
}

export async function deleteAutoResponseRule(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/webform_auto_response_rules/${id}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<{ ok: boolean }>(res);
}

export async function reorderAutoResponseRules(
  orgSlug: string,
  module: WebformModule,
  ids: string[],
): Promise<WebformAutoResponseRule[]> {
  const res = await fetch("/crm/v2.1/settings/webform_auto_response_rules/actions/reorder", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify({ module, ids }),
  });
  const data = await handleResponse<{ rules: WebformAutoResponseRule[] }>(res);
  return data.rules;
}
