import type { LayoutDefinition } from "@crm/core/customization";

export type FieldsApiResult =
  | { ok: true; revision: string }
  | { ok: false; stale: boolean; message: string };

type Command = Record<string, unknown>;

function detailMessages(details: unknown): string[] {
  if (!details || typeof details !== "object") return [];
  return Object.values(details as Record<string, unknown>).flatMap((value) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [],
  );
}

/** Sends one revisioned customization command to the existing settings routes. */
export async function sendFieldCommand(
  orgSlug: string,
  module: string,
  method: "POST" | "PATCH" | "DELETE",
  resource: "fields" | "layouts",
  expectedRevision: string,
  command: Command,
): Promise<FieldsApiResult> {
  const path = resource === "fields" ? "/crm/v2.2/settings/fields" : "/crm/v2.1/settings/layouts";
  try {
    const res = await fetch(`${path}?module=${encodeURIComponent(module)}`, {
      method,
      headers: { "Content-Type": "application/json", "X-CRM-ORG": orgSlug },
      body: JSON.stringify({ expectedRevision, command }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      revision?: string;
      code?: string;
      message?: string;
      details?: unknown;
    };
    if (res.ok && typeof body.revision === "string") return { ok: true, revision: body.revision };
    if (body.code === "SCHEMA_REVISION_MISMATCH" || res.status === 409) {
      return {
        ok: false,
        stale: true,
        message:
          "The fields changed since this page loaded. Refresh to load the latest definition, then save again; your entries are kept.",
      };
    }
    const extra = detailMessages(body.details).filter((m) => m !== body.message);
    return {
      ok: false,
      stale: false,
      message: [body.message ?? "The change could not be saved.", ...extra].join(" "),
    };
  } catch {
    return { ok: false, stale: false, message: "The change could not be saved." };
  }
}

function shortestColumn(columns: readonly (readonly string[])[]): number {
  let best = 0;
  columns.forEach((column, i) => {
    if (column.length < (columns[best]?.length ?? 0)) best = i;
  });
  return best;
}

/** Adds an identity to a section's membership and its shortest column. */
export function withFieldPlaced(
  layout: LayoutDefinition,
  value: string,
  sectionIndex = layout.sections.length - 1,
): LayoutDefinition {
  return {
    ...layout,
    sections: layout.sections.map((section, i) => {
      if (i !== sectionIndex) return section;
      const target = shortestColumn(section.columns);
      return {
        ...section,
        fields: section.fields.includes(value) ? section.fields : [...section.fields, value],
        columns: section.columns.map((column, c) =>
          c === target && !column.includes(value) ? [...column, value] : column,
        ),
      };
    }),
  };
}

/** Removes a field from the visible columns; membership stays so it can be shown again. */
export function withFieldHidden(layout: LayoutDefinition, id: string): LayoutDefinition {
  return {
    ...layout,
    sections: layout.sections.map((section) => ({
      ...section,
      columns: section.columns.map((column) => column.filter((v) => v !== id)),
    })),
  };
}

export function withFieldShown(layout: LayoutDefinition, id: string): LayoutDefinition {
  const index = layout.sections.findIndex((s) => s.fields.includes(id));
  return withFieldPlaced(layout, id, index === -1 ? layout.sections.length - 1 : index);
}
