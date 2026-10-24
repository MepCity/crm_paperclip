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
  | { ok: true; revision: string; viewId?: string; view?: ListView }
  | {
      ok: false;
      stale: boolean;
      forbidden: boolean;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export interface ModuleFieldMeta {
  id: string;
  apiName: string;
  label: string;
  dataType: string;
}

/** Fetches real effective fields with stable IDs and current revision from settings. */
export async function fetchModuleFieldsAndRevision(
  orgSlug: string,
  module: string,
): Promise<{
  revision: string;
  fields: ModuleFieldMeta[];
}> {
  const res = await fetch(`/crm/v2.2/settings/fields?module=${encodeURIComponent(module)}`, {
    headers: { "X-CRM-ORG": orgSlug },
  });
  if (!res.ok) {
    throw new Error(`Failed to load fields for module ${module}`);
  }
  const body = (await res.json().catch(() => ({}))) as {
    revision?: string;
    fields?: Array<{
      id: string;
      api_name: string;
      field_label: string;
      data_type: string;
    }>;
  };
  return {
    revision: body.revision ?? "",
    fields: (body.fields ?? []).map((f) => ({
      id: f.id,
      apiName: f.api_name,
      label: f.field_label,
      dataType: f.data_type,
    })),
  };
}

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
        viewId: "view" in command ? command.view.id : viewId,
        view: body.custom_views?.[0],
      };
    }

    if (
      res.status === 403 ||
      body.code === "AUTHENTICATION_FAILURE" ||
      body.code === "NO_PERMISSION"
    ) {
      return {
        ok: false,
        stale: false,
        forbidden: true,
        message:
          body.message && body.message !== "Forbidden"
            ? body.message
            : "Only administrators can customize organization views.",
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
    let message = body.message ?? "The view could not be saved.";

    if (fieldErrors?.view?.includes("protected_view")) {
      message = "protected_view: system and default views are immutable.";
    } else if (fieldErrors?.view_field && fieldErrors.view_field.length > 0) {
      const offending = fieldErrors.view_field[0];
      message = `View references an inactive or unknown field: ${offending}.`;
    } else if (fieldErrors?.customization && fieldErrors.customization.length > 0) {
      message = fieldErrors.customization[0] ?? message;
    }

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
