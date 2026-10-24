import type { LayoutDefinition } from "@crm/core/customization";

export type LayoutApiResult =
  | { ok: true; revision: string }
  | { ok: false; stale: boolean; message: string };

function detailMessages(details: unknown): string[] {
  if (!details || typeof details !== "object") return [];
  return Object.values(details as Record<string, unknown>).flatMap((value) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [],
  );
}

/** Sends one revisioned layout patch command to the existing settings route. */
export async function saveLayout(
  orgSlug: string,
  module: string,
  expectedRevision: string,
  layout: LayoutDefinition,
): Promise<LayoutApiResult> {
  try {
    const res = await fetch(`/crm/v2.1/settings/layouts?module=${encodeURIComponent(module)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CRM-ORG": orgSlug,
      },
      body: JSON.stringify({
        expectedRevision,
        command: {
          type: "layout.patch",
          layout,
        },
      }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      revision?: string;
      code?: string;
      message?: string;
      details?: unknown;
    };

    if (res.ok && typeof body.revision === "string") {
      return { ok: true, revision: body.revision };
    }

    if (body.code === "SCHEMA_REVISION_MISMATCH" || res.status === 409) {
      return {
        ok: false,
        stale: true,
        message:
          "The layout changed since this page loaded. Refresh to load the latest definition, then save again; your draft has been kept.",
      };
    }

    const extra = detailMessages(body.details).filter((m) => m !== body.message);
    return {
      ok: false,
      stale: false,
      message: [body.message ?? "The layout could not be saved.", ...extra].join(" "),
    };
  } catch {
    return { ok: false, stale: false, message: "The layout could not be saved." };
  }
}

/** Pure helper to reorder sections in layout */
export function reorderSection(
  layout: LayoutDefinition,
  fromIndex: number,
  toIndex: number,
): LayoutDefinition {
  if (fromIndex < 0 || fromIndex >= layout.sections.length) return layout;
  if (toIndex < 0 || toIndex >= layout.sections.length) return layout;
  const sections = [...layout.sections];
  const [removed] = sections.splice(fromIndex, 1);
  if (!removed) return layout;
  sections.splice(toIndex, 0, removed);
  return { ...layout, sections };
}

/** Pure helper to add a section to layout */
export function addSection(
  layout: LayoutDefinition,
  label: string,
  columnCount: 1 | 2 = 2,
): LayoutDefinition {
  const cleanLabel = label.trim() || `Section ${layout.sections.length + 1}`;
  const id = `${layout.id}:section:${Date.now()}`;
  const columns: string[][] = columnCount === 1 ? [[]] : [[], []];
  return {
    ...layout,
    sections: [
      ...layout.sections,
      {
        id,
        label: cleanLabel,
        columnCount,
        columns,
        fields: [],
      },
    ],
  };
}

/** Pure helper to rename a section */
export function renameSection(
  layout: LayoutDefinition,
  sectionId: string,
  label: string,
): LayoutDefinition {
  return {
    ...layout,
    sections: layout.sections.map((s) => (s.id === sectionId ? { ...s, label } : s)),
  };
}

/** Pure helper to change column count (1 or 2) */
export function setSectionColumnCount(
  layout: LayoutDefinition,
  sectionId: string,
  columnCount: 1 | 2,
): LayoutDefinition {
  return {
    ...layout,
    sections: layout.sections.map((s) => {
      if (s.id !== sectionId) return s;
      if (s.columnCount === columnCount) return s;
      if (columnCount === 1) {
        const merged = [...(s.columns[0] ?? []), ...(s.columns[1] ?? [])];
        return {
          ...s,
          columnCount: 1,
          columns: [merged],
        };
      }
      // Switching to 2 columns
      return {
        ...s,
        columnCount: 2,
        columns: [s.columns[0] ?? [], []],
      };
    }),
  };
}

/** Pure helper to remove a section */
export function removeSection(layout: LayoutDefinition, sectionId: string): LayoutDefinition {
  return {
    ...layout,
    sections: layout.sections.filter((s) => s.id !== sectionId),
  };
}

/** Pure helper to reorder field within a column */
export function moveFieldInColumn(
  layout: LayoutDefinition,
  sectionId: string,
  columnIndex: number,
  fromIndex: number,
  toIndex: number,
): LayoutDefinition {
  return {
    ...layout,
    sections: layout.sections.map((s) => {
      if (s.id !== sectionId) return s;
      const col = s.columns[columnIndex];
      if (!col || fromIndex < 0 || fromIndex >= col.length || toIndex < 0 || toIndex >= col.length)
        return s;
      const newCol = [...col];
      const [moved] = newCol.splice(fromIndex, 1);
      if (!moved) return s;
      newCol.splice(toIndex, 0, moved);
      const newColumns = s.columns.map((c, idx) => (idx === columnIndex ? newCol : c));
      return {
        ...s,
        columns: newColumns,
      };
    }),
  };
}

/** Pure helper to move field between columns of the same section */
export function moveFieldToColumn(
  layout: LayoutDefinition,
  sectionId: string,
  fromColumnIndex: number,
  toColumnIndex: number,
  fieldId: string,
): LayoutDefinition {
  return {
    ...layout,
    sections: layout.sections.map((s) => {
      if (s.id !== sectionId) return s;
      const fromCol = s.columns[fromColumnIndex];
      const toCol = s.columns[toColumnIndex];
      if (!fromCol || !toCol || !fromCol.includes(fieldId)) return s;
      const newFromCol = fromCol.filter((id) => id !== fieldId);
      const newToCol = [...toCol, fieldId];
      return {
        ...s,
        columns: s.columns.map((col, idx) =>
          idx === fromColumnIndex ? newFromCol : idx === toColumnIndex ? newToCol : col,
        ),
      };
    }),
  };
}

/** Pure helper to hide a field from all sections */
export function hideField(layout: LayoutDefinition, fieldId: string): LayoutDefinition {
  return {
    ...layout,
    sections: layout.sections.map((s) => ({
      ...s,
      fields: s.fields.filter((id) => id !== fieldId),
      columns: s.columns.map((col) => col.filter((id) => id !== fieldId)),
    })),
  };
}

/** Pure helper to place a field in a section's column */
export function placeField(
  layout: LayoutDefinition,
  sectionId: string,
  columnIndex: number,
  fieldId: string,
): LayoutDefinition {
  // First remove from anywhere else
  const stripped = hideField(layout, fieldId);
  return {
    ...stripped,
    sections: stripped.sections.map((s) => {
      if (s.id !== sectionId) return s;
      const colIdx = Math.min(Math.max(0, columnIndex), s.columns.length - 1);
      const newColumns = s.columns.map((col, idx) =>
        idx === colIdx && !col.includes(fieldId) ? [...col, fieldId] : col,
      );
      return {
        ...s,
        fields: s.fields.includes(fieldId) ? s.fields : [...s.fields, fieldId],
        columns: newColumns,
      };
    }),
  };
}
