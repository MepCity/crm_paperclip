"use client";

import type { FieldPermissionRow, ProfileSummary } from "@crm/core/access";
import { MANAGED_SYSTEM_FIELDS, OWNED_MODULES } from "@crm/core/access/catalogue";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Screen state={state} title="Field Permissions">
      {(profiles) => (
        <>
          <HelpText>
            Choose a module and a profile, then decide per field whether users with that profile can
            read and write it, only read it, or not see it at all. Required fields cannot be
            restricted.
          </HelpText>
          <Select
            label="Module"
            items={OWNED_MODULES.map((id) => ({ id }))}
            selectedKey={module}
            onSelectionChange={(key) => setModule(String(key))}
          >
            {(item) => <SelectItem id={item.id}>{item.id}</SelectItem>}
          </Select>
          <div role="tablist" aria-label="Profiles" className="flex gap-2">
            {profiles.map((profile) => {
              const active = (profileId ?? profiles[0]?.id) === profile.id;
              return (
                <Button
                  key={profile.id}
                  variant={active ? "primary" : "secondary"}
                  aria-pressed={active}
                  onPress={() => setProfileId(profile.id)}
                >
                  {profile.name}
                </Button>
              );
            })}
          </div>
          {(() => {
            const profile: ProfileSummary | undefined =
              profiles.find((p) => p.id === profileId) ?? profiles[0];
            return profile ? (
              <ProfileFields
                key={`${profile.id}:${module}`}
                api={api}
                profile={profile}
                module={module}
                fields={fieldsByModule[module] ?? []}
              />
            ) : null;
          })()}
        </>
      )}
    </Screen>
  );
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
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const fixed = profile.kind === "administrator";

  useEffect(() => {
    let live = true;
    api
      .getFieldPermissions(profile.id, module)
      .then((list) => {
        if (live) setRows(Object.fromEntries(list.map((r) => [r.field, r.access])));
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
      setSaved(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {saved ? <Alert variant="success">Field permissions saved.</Alert> : null}
        {fixed ? (
          <Alert variant="info">The Administrator profile always has full field access.</Alert>
        ) : null}
        <table className="w-full text-sm" data-testid="field-permissions">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2">Field</th>
              {MODES.map((m) => (
                <th key={m.id} className="py-2">
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
                <tr key={field.apiName} className="border-b border-border">
                  <td className="py-2">
                    {field.label}
                    {field.required ? <span className="text-text-muted"> (required)</span> : null}
                  </td>
                  {MODES.map((m) => (
                    <td key={m.id} className="py-2">
                      <input
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
        {fixed ? null : (
          <div className="mt-4">
            <Button onPress={save} isPending={busy}>
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
