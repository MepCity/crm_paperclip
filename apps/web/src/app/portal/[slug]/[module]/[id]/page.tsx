"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchPortalRecord,
  PortalApiError,
  updatePortalRecord,
} from "@/modules/external-portal/portal-client";
import { usePortal } from "@/modules/external-portal/portal-context";
import { PortalNotFound } from "@/modules/external-portal/portal-not-found";
import type { PortalModule } from "@/modules/external-portal/types";

export default function PortalRecordDetailPage() {
  const params = useParams<{ slug: string; module: string; id: string }>();
  const slug = params?.slug ?? "";
  const moduleParam = (params?.module ?? "") as PortalModule;
  const recordId = params?.id ?? "";

  const { session, loading: sessionLoading, refresh } = usePortal();

  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit mode for own contact
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const moduleConfig = session?.userType?.modules?.[moduleParam];
  const isEnabled = Boolean(moduleConfig?.enabled);

  const isOwnContact =
    moduleParam === "Contacts" && session?.user?.recordId && session.user.recordId === recordId;

  const canEdit = Boolean(isOwnContact && moduleConfig?.actions?.edit);

  const loadRecord = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPortalRecord(slug, moduleParam, recordId);
      const raw = (res.data ?? {}) as Record<string, unknown>;
      const fields = (raw.fields && typeof raw.fields === "object" ? raw.fields : {}) as Record<
        string,
        unknown
      >;
      const recordData: Record<string, unknown> = { id: raw.id ?? recordId, ...fields, ...raw };
      delete recordData.fields;
      setRecord(recordData);
      // Initialize edit values
      const initial: Record<string, string> = {};
      for (const [k, v] of Object.entries(recordData)) {
        if (v !== null && v !== undefined && typeof v !== "object") {
          initial[k] = String(v);
        }
      }
      setEditValues(initial);
    } catch (err) {
      if (err instanceof PortalApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load record");
      }
    } finally {
      setLoading(false);
    }
  }, [slug, moduleParam, recordId]);

  useEffect(() => {
    if (!sessionLoading && session) {
      if (!isEnabled) {
        setNotFound(true);
        return;
      }
      void loadRecord();
    }
  }, [sessionLoading, session, isEnabled, loadRecord]);

  if (sessionLoading || loading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
        Loading record...
      </div>
    );
  }

  if (notFound || !isEnabled || !record) {
    return (
      <PortalNotFound
        slug={slug}
        title="Record Not Found"
        message={`The requested ${moduleParam} record does not exist or you do not have permission to view it.`}
      />
    );
  }

  // Determine editable field names for own contact
  const editableFieldNames = new Set(
    moduleConfig?.fields.filter((f) => f.mode === "edit").map((f) => f.apiName) ?? [],
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Pick only editable fields
      const patch: Record<string, unknown> = {};
      for (const key of editableFieldNames) {
        if (key in editValues) {
          patch[key] = editValues[key];
        }
      }
      await updatePortalRecord(slug, "Contacts", recordId, patch);
      await loadRecord();
      await refresh();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  const fieldKeys = Object.keys(record);

  return (
    <div className="space-y-6" data-testid={`portal-record-detail-${moduleParam}`}>
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/portal/${encodeURIComponent(slug)}/${encodeURIComponent(moduleParam)}`}
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              &larr; Back to {moduleParam}
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--color-text)]">
            {String(
              record.Full_Name ||
                (record.First_Name || record.Last_Name
                  ? `${record.First_Name || ""} ${record.Last_Name || ""}`.trim()
                  : "") ||
                record.Subject ||
                record.Case_Number ||
                record.Deal_Name ||
                record.Account_Name ||
                record.id,
            )}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {moduleParam} &bull; ID: {recordId}
          </p>
        </div>

        {canEdit && (
          <div>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
                data-testid="portal-contact-edit-button"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
                  data-testid="portal-contact-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="portal-edit-form"
                  disabled={saving}
                  className="rounded bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  data-testid="portal-contact-save-button"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Detail Fields Card */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs">
        {editing ? (
          <form id="portal-edit-form" onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fieldKeys.map((key) => {
                const isFieldEditable = editableFieldNames.has(key);
                const val = editValues[key] ?? "";

                if (!isFieldEditable) {
                  return (
                    <div key={key} className="rounded bg-[var(--color-bg-muted)] p-3">
                      <div className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="mt-1 text-xs text-[var(--color-text)]">
                        {String(record[key] ?? "—")}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={key}>
                    <label
                      htmlFor={`field-${key}`}
                      className="block text-xs font-semibold text-[var(--color-text)]"
                    >
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      id={`field-${key}`}
                      data-testid={`portal-input-${key}`}
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fieldKeys.map((key) => {
              const val = record[key];

              // Check if val is a linked record reference
              const isLinkObject =
                val !== null && typeof val === "object" && "id" in val && "module" in val;

              return (
                <div key={key} className="space-y-1" data-testid={`portal-field-${key}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="text-xs font-medium text-[var(--color-text)]">
                    {val === null || val === undefined ? (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    ) : isLinkObject ? (
                      <Link
                        href={`/portal/${encodeURIComponent(slug)}/${encodeURIComponent(String((val as { module: string }).module))}/${encodeURIComponent(String((val as { id: string }).id))}`}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        {String(
                          (val as { name?: string; id: string }).name || (val as { id: string }).id,
                        )}
                      </Link>
                    ) : (
                      <span>{String(val)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
