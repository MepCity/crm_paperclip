import type { Criteria, ListView } from "@crm/core/records";

export interface CustomViewCommandPayload {
  expectedRevision: string;
  command:
    | {
        type: "view.create";
        view: {
          id: string;
          name: string;
          systemDefined: false;
          isDefault: false;
          columns: string[];
          criteria: Criteria | null;
          sort: { field: string; order: "asc" | "desc" } | null;
        };
      }
    | {
        type: "view.patch";
        view: {
          id: string;
          name: string;
          systemDefined: false;
          isDefault: false;
          columns: string[];
          criteria: Criteria | null;
          sort: { field: string; order: "asc" | "desc" } | null;
        };
      }
    | {
        type: "view.delete";
      };
}

export type ViewApiResult =
  | { ok: true; revision: string; view?: ListView }
  | {
      ok: false;
      stale: boolean;
      forbidden: boolean;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

/** Sends one revisioned view customization command to the existing view routes. */
export async function sendViewCommand(
  orgSlug: string,
  module: string,
  method: "POST" | "PATCH" | "DELETE",
  expectedRevision: string,
  command: CustomViewCommandPayload["command"],
  viewId?: string,
): Promise<ViewApiResult> {
  const base = "/crm/v9/settings/custom_views";
  const url =
    viewId && method !== "POST"
      ? `${base}/${encodeURIComponent(viewId)}?module=${encodeURIComponent(module)}`
      : `${base}?module=${encodeURIComponent(module)}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-CRM-ORG": orgSlug,
      },
      body: JSON.stringify({ expectedRevision, command }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      revision?: string;
      code?: string;
      message?: string;
      details?: { fields?: Record<string, string[]> };
      custom_views?: ListView[];
    };

    if (res.ok) {
      return {
        ok: true,
        revision: body.revision ?? "",
        view: body.custom_views?.[0],
      };
    }

    if (res.status === 403 || body.code === "NO_PERMISSION") {
      return {
        ok: false,
        stale: false,
        forbidden: true,
        message: body.message ?? "Only administrators can customize shared views.",
      };
    }

    if (res.status === 409 || body.code === "SCHEMA_REVISION_MISMATCH") {
      return {
        ok: false,
        stale: true,
        forbidden: false,
        message:
          "The views changed since this page loaded. Refresh to load the latest definition, then save again; your entries are kept.",
      };
    }

    const fieldErrors = body.details?.fields;
    const detailList = fieldErrors
      ? Object.values(fieldErrors).flatMap((val) => (Array.isArray(val) ? val : []))
      : [];
    const message = body.message ?? detailList[0] ?? "The view could not be saved.";

    return {
      ok: false,
      stale: false,
      forbidden: false,
      message,
      fieldErrors,
    };
  } catch {
    return {
      ok: false,
      stale: false,
      forbidden: false,
      message: "The view could not be saved.",
    };
  }
}

const STORAGE_PREFIX = "crm:private_views";

function storageKey(orgSlug: string, module: string): string {
  return `${STORAGE_PREFIX}:${orgSlug}:${module}`;
}

export function getPrivateViews(orgSlug: string, module: string): ListView[] {
  try {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(storageKey(orgSlug, module)) : null;
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePrivateView(orgSlug: string, module: string, view: ListView): ListView {
  const views = getPrivateViews(orgSlug, module);
  const existingIndex = views.findIndex((v) => v.id === view.id);
  const updatedView = { ...view, systemDefined: false, isDefault: false };
  let nextViews: ListView[];
  if (existingIndex >= 0) {
    nextViews = [...views];
    nextViews[existingIndex] = updatedView;
  } else {
    nextViews = [...views, updatedView];
  }
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey(orgSlug, module), JSON.stringify(nextViews));
    }
  } catch {
    // fallback
  }
  return updatedView;
}

export function deletePrivateView(orgSlug: string, module: string, viewId: string): void {
  const views = getPrivateViews(orgSlug, module);
  const nextViews = views.filter((v) => v.id !== viewId);
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey(orgSlug, module), JSON.stringify(nextViews));
    }
  } catch {
    // fallback
  }
}
