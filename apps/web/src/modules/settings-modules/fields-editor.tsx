"use client";

import type { LayoutDefinition } from "@crm/core/customization";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  type FieldsApiResult,
  sendFieldCommand,
  withFieldHidden,
  withFieldPlaced,
  withFieldRemoved,
  withFieldShown,
} from "./fields-api";
import {
  apiNameFromLabel,
  CUSTOM_FIELD_TYPES,
  type CustomFieldType,
  type FieldRow,
  typeLabel,
} from "./fields-model";

export type FieldEditorData = {
  revision: string;
  layout: LayoutDefinition;
  retired: FieldRow[];
};

type Draft = {
  id: string | null;
  label: string;
  dataType: CustomFieldType;
  required: boolean;
  readOnly: boolean;
};

const EMPTY: Draft = { id: null, label: "", dataType: "text", required: false, readOnly: false };

const button = "rounded-md border border-border px-3 py-1 text-sm hover:bg-surface-muted";

export function useFieldEditor(orgSlug: string, module: string, data: FieldEditorData) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<{ message: string; stale: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(call: () => Promise<FieldsApiResult>): Promise<boolean> {
    setBusy(true);
    const result = await call();
    setBusy(false);
    if (result.ok) {
      setError(null);
      router.refresh();
      return true;
    }
    setError({ message: result.message, stale: result.stale });
    return false;
  }

  const send = (
    method: "POST" | "PATCH" | "DELETE",
    resource: "fields" | "layouts",
    command: Record<string, unknown>,
  ) => sendFieldCommand(orgSlug, module, method, resource, data.revision, command);

  async function save() {
    if (!draft) return;
    const label = draft.label.trim();
    if (!label) {
      setError({ message: "Field label is required.", stale: false });
      return;
    }
    const ok = await run(() => {
      if (draft.id) {
        return send("PATCH", "fields", {
          type: "field.patch",
          fieldId: draft.id,
          properties: { label, required: draft.required, readOnly: draft.readOnly },
        });
      }
      const apiName = apiNameFromLabel(label);
      return send("POST", "fields", {
        type: "field.create",
        field: {
          apiName,
          label,
          dataType: draft.dataType,
          required: draft.required,
          readOnly: draft.readOnly,
          unique: false,
          massUpdate: true,
          views: { view: true, create: true, edit: true, quickCreate: false },
        },
        layout: withFieldPlaced(data.layout, apiName),
      });
    });
    if (ok) setDraft(null);
  }

  const toolbar: ReactNode = (
    <button
      type="button"
      onClick={() => {
        setError(null);
        setDraft(EMPTY);
      }}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-text"
    >
      Create and Edit Fields
    </button>
  );

  function actions(row: FieldRow): ReactNode {
    if (!row.id) return null;
    const id = row.id;
    return (
      <div className="flex gap-2">
        <button
          type="button"
          className={button}
          aria-label={`Edit ${row.label}`}
          onClick={() => {
            setError(null);
            setDraft({
              id,
              label: row.label,
              dataType: "text",
              required: row.required ?? false,
              readOnly: row.readOnly ?? false,
            });
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className={button}
          disabled={busy}
          aria-label={`${row.placed === false ? "Show" : "Hide"} ${row.label}`}
          onClick={() =>
            run(() =>
              send("PATCH", "layouts", {
                type: "layout.patch",
                layout:
                  row.placed === false
                    ? withFieldShown(data.layout, id)
                    : withFieldHidden(data.layout, id),
              }),
            )
          }
        >
          {row.placed === false ? "Show in layout" : "Hide in layout"}
        </button>
        {row.custom ? (
          <button
            type="button"
            className={button}
            disabled={busy}
            aria-label={`Retire ${row.label}`}
            onClick={() =>
              run(() =>
                send("DELETE", "fields", {
                  type: "field.retire",
                  fieldId: id,
                  layout: withFieldRemoved(data.layout, id),
                }),
              )
            }
          >
            Retire
          </button>
        ) : null}
      </div>
    );
  }

  const banner: ReactNode =
    error && !draft ? (
      <p role="alert" className="mb-3 rounded-md border border-border px-3 py-2 text-sm text-text">
        {error.message}
      </p>
    ) : null;

  const retired: ReactNode = data.retired.length ? (
    <section className="mt-6" aria-label="Retired fields">
      <h2 className="mb-2 text-sm font-semibold text-text">Retired fields</h2>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {data.retired.map((r) => (
          <li key={r.apiName} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              {r.label} <span className="text-text-muted">· {r.dataType}</span>
            </span>
            <button
              type="button"
              className={button}
              disabled={busy}
              aria-label={`Restore ${r.label}`}
              onClick={() => {
                const rid = r.id;
                if (!rid) return;
                run(() =>
                  send("PATCH", "fields", {
                    type: "field.restore",
                    fieldId: rid,
                    layout: withFieldPlaced(data.layout, rid),
                  }),
                );
              }}
            >
              Restore
            </button>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  const dialog: ReactNode = draft ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={draft.id ? "Edit field" : "New field"}
        className="w-96 rounded-lg border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="mb-4 text-base font-semibold text-text">
          {draft.id ? "Edit field" : "New field"}
        </h2>
        <label className="mb-3 block text-sm text-text">
          Field label
          <input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        {draft.id ? null : (
          <label className="mb-3 block text-sm text-text">
            Data type
            <select
              value={draft.dataType}
              onChange={(e) => setDraft({ ...draft, dataType: e.target.value as CustomFieldType })}
              className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
            >
              {CUSTOM_FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="mb-2 flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={draft.required}
            onChange={(e) => setDraft({ ...draft, required: e.target.checked })}
          />
          Required
        </label>
        <label className="mb-3 flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={draft.readOnly}
            onChange={(e) => setDraft({ ...draft, readOnly: e.target.checked })}
          />
          Read only
        </label>
        {error ? (
          <p role="alert" className="mb-3 text-sm text-text">
            {error.message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          {error?.stale ? (
            <button type="button" className={button} onClick={() => router.refresh()}>
              Refresh
            </button>
          ) : null}
          <button type="button" className={button} onClick={() => setDraft(null)}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={save}
            className="rounded-md bg-primary px-4 py-1 text-sm font-semibold text-primary-text"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { toolbar, actions, banner, retired, dialog };
}
