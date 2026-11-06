"use client";

import type { FieldPermissionRow, ProfileSummary } from "@crm/core/access";
import { MANAGED_SYSTEM_FIELDS, OWNED_MODULES } from "@crm/core/access/catalogue";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Select, SelectItem } from "@/components/ui/select";
import { createAccessClient } from "./api";
import { errorText, HelpText, Screen, useLoad } from "./shared";

export type FieldInfo = { apiName: string; label: string; required: boolean };
type Mode = "read_write" | "read_only" | "hidden";

const MODES: { id: Mode; label: string }[] = [
  { id: "read_write", label: "Read and Write" },
  { id: "read_only", label: "Read Only" },
  { id: "hidden", label: "Don't Show" },
];

export function FieldPermissionsScreen({
  orgSlug,
  fieldsByModule,
}: {
  orgSlug: string;
  fieldsByModule: Record<string, FieldInfo[]>;
}) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const [state] = useLoad(api.listProfiles);
  const [module, setModule] = useState<string>(OWNED_MODULES[0]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const fieldsHref = `/crm/${orgSlug}/settings/modules/${encodeURIComponent(module)}/fields`;

  return (
    <Screen state={state} title="Field Permissions">
      {(profiles) => {
        const profile: ProfileSummary | undefined =
          profiles.find((p) => p.id === profileId) ?? profiles[0];
        const q = query.trim().toLowerCase();
        const fields = (fieldsByModule[module] ?? []).filter(
          (f) => !q || f.label.toLowerCase().includes(q),
        );
        return (
          <div className="flex min-h-[32rem] flex-col rounded-lg border border-border bg-surface md:flex-row">
            <aside className="w-full shrink-0 border-b border-border p-4 md:w-60 md:border-r md:border-b-0">
              <h2 className="px-2 pb-3 text-md font-semibold text-text">Modules</h2>
              <nav aria-label="Modules">
                <ul className="flex flex-col gap-0.5">
                  {OWNED_MODULES.map((m) => (
                    <li key={m}>
                      <button
                        type="button"
                        aria-current={m === module ? "true" : undefined}
                        onClick={() => setModule(m)}
                        className={`block w-full rounded-md px-3 py-2 text-left text-md outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                          m === module
                            ? "bg-primary-subtle font-semibold text-text"
                            : "text-text hover:bg-surface-hover"
                        }`}
                      >
                        {m}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
              <h2 className="text-xl font-semibold text-text">{module}</h2>
              <nav
                aria-label="Field view"
                className="inline-flex w-fit rounded-full border border-border p-1"
              >
                <Link
                  href={fieldsHref}
                  className="rounded-full px-5 py-1.5 text-md text-text no-underline"
                >
                  Field Listing
                </Link>
                <span
                  aria-current="page"
                  className="rounded-full border border-primary bg-primary-subtle px-5 py-1.5 text-md text-text"
                >
                  Field Permissions
                </span>
              </nav>
              <HelpText>
                Decide per field whether users with the chosen profile can read and write it, only
                read it, or not see it at all. Required fields cannot be restricted.
              </HelpText>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  label="Profile"
                  hideLabel
                  items={profiles}
                  selectedKey={profile?.id ?? null}
                  onSelectionChange={(key) => setProfileId(String(key))}
                >
                  {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
                </Select>
                <div className="relative">
                  <Icons.filterSearch
                    aria-hidden="true"
                    className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-text-muted"
                  />
                  <input
                    type="search"
                    aria-label="Search fields"
                    placeholder="Search fields"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full max-w-72 rounded-md border border-border bg-surface py-2 pr-3 pl-8 text-md focus:border-primary focus:outline-hidden"
                  />
                </div>
                <Link variant="primary" href={fieldsHref} className="ml-auto">
                  Create and Edit Fields
                </Link>
              </div>
              {profile ? (
                <ProfileFields
                  key={`${profile.id}:${module}`}
                  api={api}
                  profile={profile}
                  module={module}
                  fields={fields}
                />
              ) : null}
            </div>
          </div>
        );
      }}
    </Screen>
  );
}

/** Stable text of the non-default entries, to tell whether anything changed. */
function restrictedKey(rows: Record<string, Mode>): string {
  return Object.entries(rows)
    .filter(([, mode]) => mode !== "read_write")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([field, mode]) => `${field}=${mode}`)
    .join("&");
}

function ProfileFields({
  api,
  profile,
  module,
  fields,
}: {
  api: ReturnType<typeof createAccessClient>;
  profile: ProfileSummary;
  module: string;
  fields: FieldInfo[];
}) {
  const [rows, setRows] = useState<Record<string, Mode> | null>(null);
  const [initial, setInitial] = useState<Record<string, Mode>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const fixed = profile.kind === "administrator";

  useEffect(() => {
    let live = true;
    api
      .getFieldPermissions(profile.id, module)
      .then((list) => {
        if (!live) return;
        const loaded = Object.fromEntries(list.map((r) => [r.field, r.access])) as Record<
          string,
          Mode
        >;
        setRows(loaded);
        setInitial(loaded);
      })
      .catch((e: unknown) => live && setError(errorText(e)));
    return () => {
      live = false;
    };
  }, [api, profile.id, module]);

  if (rows === null) {
    return error ? (
      <Alert variant="danger">{error}</Alert>
    ) : (
      <p role="status" className="text-sm text-text-muted">
        Loading…
      </p>
    );
  }
  const current = rows;

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const payload: FieldPermissionRow[] = Object.entries(current)
        .filter(([, mode]) => mode !== "read_write")
        .map(([field, mode]) => ({ field, access: mode as "read_only" | "hidden" }));
      await api.putFieldPermissions(profile.id, module, payload);
      setInitial(current);
      setSaved(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const dirty = restrictedKey(current) !== restrictedKey(initial);

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {saved && !dirty ? <Alert variant="success">Field permissions saved.</Alert> : null}
      {fixed ? (
        <Alert variant="info">The Administrator profile always has full field access.</Alert>
      ) : null}
      <section
        aria-label="Field permissions table"
        // A scrollable region must be reachable from the keyboard (axe scrollable-region-focusable).
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the region scrolls sideways on narrow screens.
        tabIndex={0}
        className="overflow-x-auto rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        <table className="w-full min-w-[40rem] text-md" data-testid="field-permissions">
          <thead>
            <tr className="border-b-2 border-border text-left">
              <th className="px-6 py-3 font-semibold">Fields</th>
              {MODES.map((m) => (
                <th key={m.id} className="w-40 px-4 py-3 text-center font-semibold">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => {
              const locked =
                fixed || field.required || MANAGED_SYSTEM_FIELDS.includes(field.apiName);
              const value: Mode = locked ? "read_write" : (current[field.apiName] ?? "read_write");
              return (
                <tr key={field.apiName} className="border-b border-border last:border-b-0">
                  <td className="px-6 py-3">
                    {field.label}
                    {field.required ? <span className="text-text-muted"> (required)</span> : null}
                  </td>
                  {MODES.map((m) => (
                    <td key={m.id} className="px-4 py-3 text-center">
                      <input
                        className="h-5 w-5 accent-(--color-primary) disabled:opacity-40"
                        type="radio"
                        name={`${profile.id}:${field.apiName}`}
                        aria-label={`${field.label}: ${m.label}`}
                        checked={value === m.id}
                        disabled={locked}
                        onChange={() => setRows({ ...current, [field.apiName]: m.id })}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {fixed ? null : (
        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface py-3">
          <Button onPress={save} isPending={busy} isDisabled={!dirty}>
            Save
          </Button>
          <Button
            variant="secondary"
            isDisabled={!dirty || busy}
            onPress={() => {
              setRows(initial);
              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
