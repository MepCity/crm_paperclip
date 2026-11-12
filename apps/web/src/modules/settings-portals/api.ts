import type {
  ContactOption,
  MemberOption,
  Portal,
  PortalAuthEvent,
  PortalIdentity,
  PortalModules,
  PortalUserType,
  PortalUserTypeSettings,
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

export async function fetchPortal(orgSlug: string): Promise<Portal | null> {
  const res = await fetch("/crm/v2.1/settings/portals", {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ portal: Portal | null }>(res);
  return data.portal;
}

export async function createPortal(
  orgSlug: string,
  input: { name: string; slug: string; defaultLanguage?: "en" | "tr" },
): Promise<Portal> {
  const res = await fetch("/crm/v2.1/settings/portals", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ portal: Portal }>(res);
  return data.portal;
}

export async function updatePortal(
  orgSlug: string,
  input: { name?: string; status?: "active" | "disabled"; defaultLanguage?: "en" | "tr" },
): Promise<Portal> {
  const res = await fetch("/crm/v2.1/settings/portals", {
    method: "PATCH",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ portal: Portal }>(res);
  return data.portal;
}

export async function deletePortal(orgSlug: string): Promise<void> {
  const res = await fetch("/crm/v2.1/settings/portals", {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<null>(res);
}

export async function fetchUserTypes(orgSlug: string): Promise<PortalUserType[]> {
  const res = await fetch("/crm/v2.1/settings/portals/user-types", {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ userTypes: PortalUserType[] }>(res);
  return data.userTypes;
}

export async function createUserType(
  orgSlug: string,
  input: { name: string; modules?: PortalModules; settings?: PortalUserTypeSettings },
): Promise<PortalUserType> {
  const res = await fetch("/crm/v2.1/settings/portals/user-types", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ userType: PortalUserType }>(res);
  return data.userType;
}

export async function updateUserType(
  orgSlug: string,
  id: string,
  input: { name?: string; modules?: PortalModules; settings?: PortalUserTypeSettings },
): Promise<PortalUserType> {
  const res = await fetch(`/crm/v2.1/settings/portals/user-types/${id}`, {
    method: "PATCH",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ userType: PortalUserType }>(res);
  return data.userType;
}

export async function deleteUserType(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/portals/user-types/${id}`, {
    method: "DELETE",
    headers: headers(orgSlug),
  });
  await handleResponse<null>(res);
}

export async function fetchPortalUsers(orgSlug: string): Promise<PortalIdentity[]> {
  const res = await fetch("/crm/v2.1/settings/portals/users", {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ users: PortalIdentity[] }>(res);
  return data.users;
}

export async function invitePortalUser(
  orgSlug: string,
  input: { contactId: string; userTypeId: string },
): Promise<PortalIdentity> {
  const res = await fetch("/crm/v2.1/settings/portals/users", {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ user: PortalIdentity }>(res);
  return data.user;
}

export async function reinvitePortalUser(orgSlug: string, id: string): Promise<PortalIdentity> {
  const res = await fetch(`/crm/v2.1/settings/portals/users/${id}/actions/reinvite`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify({}),
  });
  const data = await handleResponse<{ user: PortalIdentity }>(res);
  return data.user;
}

export async function sendResetToUser(orgSlug: string, id: string): Promise<void> {
  const res = await fetch(`/crm/v2.1/settings/portals/users/${id}/actions/send-reset`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify({}),
  });
  await handleResponse<{ ok: true }>(res);
}

export async function disablePortalUser(orgSlug: string, id: string): Promise<PortalIdentity> {
  const res = await fetch(`/crm/v2.1/settings/portals/users/${id}/actions/disable`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify({}),
  });
  const data = await handleResponse<{ user: PortalIdentity }>(res);
  return data.user;
}

export async function enablePortalUser(orgSlug: string, id: string): Promise<PortalIdentity> {
  const res = await fetch(`/crm/v2.1/settings/portals/users/${id}/actions/enable`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify({}),
  });
  const data = await handleResponse<{ user: PortalIdentity }>(res);
  return data.user;
}

export async function changeUserType(
  orgSlug: string,
  id: string,
  userTypeId: string,
): Promise<PortalIdentity> {
  const res = await fetch(`/crm/v2.1/settings/portals/users/${id}/actions/change-user-type`, {
    method: "POST",
    headers: headers(orgSlug),
    body: JSON.stringify({ userTypeId }),
  });
  const data = await handleResponse<{ user: PortalIdentity }>(res);
  return data.user;
}

export async function fetchAuthEvents(orgSlug: string): Promise<PortalAuthEvent[]> {
  const res = await fetch("/crm/v2.1/settings/portals/auth-events", {
    headers: headers(orgSlug),
  });
  const data = await handleResponse<{ events: PortalAuthEvent[] }>(res);
  return data.events;
}

export async function fetchContacts(orgSlug: string): Promise<ContactOption[]> {
  try {
    const res = await fetch("/crm/v2.2/Contacts/bulk?cvid=all-contacts&per_page=100", {
      method: "POST",
      headers: {
        ...headers(orgSlug),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = (json.data ?? []) as Array<Record<string, unknown>>;
    return rows
      .filter((r) => typeof r.Email === "string" && r.Email.trim() !== "")
      .map((r) => ({
        id: String(r.id),
        fullName: String(
          r.Full_Name || `${r.First_Name || ""} ${r.Last_Name || ""}`.trim() || r.Email,
        ),
        email: String(r.Email),
      }));
  } catch {
    return [];
  }
}

export async function fetchMembers(orgSlug: string): Promise<MemberOption[]> {
  try {
    const res = await fetch("/crm/v9/users", {
      headers: headers(orgSlug),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = (json.users ?? []) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name || r.email || "Member"),
      email: String(r.email || ""),
    }));
  } catch {
    return [];
  }
}
