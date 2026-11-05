"use client";

import type { ProfileDetail, ProfileSummary } from "@crm/core/access";
import { OWNED_MODULES, type ProfilePermissions } from "@crm/core/access/catalogue";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "@/components/ui/link";
import { Select, SelectItem } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { createAccessClient } from "./api";
import { CloneProfileDialog } from "./profiles-screen";
import { errorText, HelpText, Screen, useLoad } from "./shared";

type Perms = ProfilePermissions;
type Section = "modules" | "features" | "other";

/** `camelCase` key to a label ("createTeamFolder" -> "Create team folder"). */
export function humanize(key: string): string {
  const words = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const MODULE_LIST_ROWS: { label: string; path: [string, string] | [string, string, string] }[] = [
  { label: "Import Records", path: ["importModules", ""] },
  { label: "Export", path: ["exportModules", ""] },
  { label: "Send Email", path: ["email", "send"] },
  { label: "Mass Email", path: ["email", "mass"] },
  { label: "Delete Email", path: ["email", "delete"] },
  { label: "Mass Update", path: ["tools", "massUpdate"] },
  { label: "Mass Delete", path: ["tools", "massDelete"] },
  { label: "Change Owner", path: ["tools", "changeOwner"] },
  { label: "Mass Transfer", path: ["tools", "massTransfer"] },
  { label: "Convert", path: ["tools", "convert"] },
  { label: "Share", path: ["tools", "share"] },
  { label: "Print View", path: ["tools", "printView"] },
  { label: "Find & Merge", path: ["tools", "findAndMerge"] },
  { label: "View All Records", path: ["admin", "viewAllRecords"] },
  { label: "Modify All Records", path: ["admin", "modifyAllRecords"] },
];

const BOOLEAN_ROWS: { label: string; group: "tools" | "admin"; key: string }[] = [
  { label: "Manage Views", group: "tools", key: "manageViews" },
  { label: "Tags", group: "tools", key: "tags" },
  { label: "Record timeline", group: "tools", key: "recordTimeline" },
  { label: "Only list subordinates", group: "tools", key: "onlyListSubordinates" },
  { label: "User Management", group: "admin", key: "userManagement" },
  { label: "Module Customization", group: "admin", key: "moduleCustomization" },
  { label: "Manage Currencies", group: "admin", key: "manageCurrencies" },
  { label: "Customize Home Page", group: "admin", key: "customizeHome" },
  { label: "Manage Automation", group: "admin", key: "manageAutomation" },
  { label: "Manage templates", group: "admin", key: "manageTemplates" },
  { label: "Email & chat settings", group: "admin", key: "emailSettings" },
  { label: "Data Management", group: "admin", key: "dataManagement" },
];

function moduleList(perms: Perms, path: readonly string[]): string[] {
  const [a, b] = path;
  const root = perms as unknown as Record<string, unknown>;
  const value = b ? (root[a as string] as Record<string, string[]>)[b] : root[a as string];
  return value as string[];
}

function withModuleList(perms: Perms, path: readonly string[], next: string[]): Perms {
  const [a, b] = path;
  const draft = structuredClone(perms) as unknown as Record<string, unknown>;
  if (b) (draft[a as string] as Record<string, string[]>)[b] = next;
  else draft[a as string] = next;
  return draft as unknown as Perms;
}

function PermissionsEditor({
  perms,
  onChange,
  editable,
}: {
  perms: Perms;
  onChange: (next: Perms) => void;
  editable: (section: Section) => boolean;
}) {
  const set = (mutate: (draft: Perms) => void) => {
    const draft = structuredClone(perms);
    mutate(draft);
    onChange(draft);
  };
  const mod = editable("modules");
  const feat = editable("features");
  const other = editable("other");
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Module Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2" data-testid="perm-modules">
            {OWNED_MODULES.map((module) => (
              <div key={module} className="flex items-center gap-6">
                <span className="w-32 text-sm font-semibold text-text">{module}</span>
                {(["view", "create", "edit", "delete"] as const).map((action) => (
                  <Checkbox
                    key={action}
                    label={`${module}: ${humanize(action)}`}
                    hideLabel
                    isDisabled={!mod}
                    isSelected={perms.modules[module][action]}
                    onChange={(value) =>
                      set((d) => {
                        d.modules[module][action] = value;
                      })
                    }
                  />
                ))}
                <span className="text-sm text-text-muted">
                  {(["view", "create", "edit", "delete"] as const)
                    .filter((a) => perms.modules[module][a])
                    .map(humanize)
                    .join(", ") || "No access"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2" data-testid="perm-features">
            {(Object.keys(perms.features) as (keyof Perms["features"])[]).map((feature) => (
              <div key={feature} className="flex flex-wrap items-center gap-6">
                <span className="w-32 text-sm font-semibold text-text">{humanize(feature)}</span>
                {Object.entries(perms.features[feature]).map(([key, value]) => (
                  <Checkbox
                    key={key}
                    label={`${humanize(feature)}: ${humanize(key)}`}
                    isDisabled={!feat}
                    isSelected={value as boolean}
                    onChange={(next) =>
                      set((d) => {
                        (d.features[feature] as Record<string, boolean>)[key] = next;
                      })
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Import, Export, Email and Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3" data-testid="perm-module-lists">
            {MODULE_LIST_ROWS.map((row) => {
              const selected = moduleList(perms, row.path);
              const isAdmin = row.path[0] === "admin";
              return (
                <fieldset key={row.label} className="flex flex-col gap-1">
                  <legend className="text-sm font-semibold text-text">
                    {row.label}{" "}
                    <span className="font-normal text-text-muted">
                      ({selected.length} of {OWNED_MODULES.length} modules)
                    </span>
                  </legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {OWNED_MODULES.map((module) => (
                      <Checkbox
                        key={module}
                        label={`${row.label}: ${module}`}
                        hideLabel={false}
                        isDisabled={!other}
                        isSelected={selected.includes(module)}
                        onChange={(on) =>
                          onChange(
                            withModuleList(
                              perms,
                              row.path,
                              on
                                ? [...selected, module]
                                : selected.filter((entry) => entry !== module),
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                  {isAdmin ? null : null}
                </fieldset>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tools and Administrator Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2" data-testid="perm-admin">
            {BOOLEAN_ROWS.map((row) => (
              <Checkbox
                key={row.key}
                label={row.label}
                isDisabled={!other}
                isSelected={(perms[row.group] as Record<string, unknown>)[row.key] as boolean}
                onChange={(on) =>
                  set((d) => {
                    (d[row.group] as Record<string, unknown>)[row.key] = on;
                  })
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfileDetailScreen({
  orgSlug,
  profileId,
}: {
  orgSlug: string;
  profileId: string;
}) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const load = useCallback(
    async () => ({ profile: await api.getProfile(profileId), all: await api.listProfiles() }),
    [api, profileId],
  );
  const [state, reload] = useLoad(load);
  return (
    <Screen state={state} title="Profile">
      {({ profile, all }) => (
        <ProfileBody
          key={`${profile.id}:${profile.updatedAt}`}
          orgSlug={orgSlug}
          profile={profile}
          all={all}
          reload={reload}
        />
      )}
    </Screen>
  );
}

function ProfileBody({
  orgSlug,
  profile,
  all,
  reload,
}: {
  orgSlug: string;
  profile: ProfileDetail;
  all: ProfileSummary[];
  reload: () => void;
}) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [perms, setPerms] = useState<Perms>(profile.permissions);
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [replacement, setReplacement] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const system = profile.kind !== "custom";
  const editable = (section: Section) => {
    if (!editing) return false;
    if (profile.kind === "administrator") return false;
    if (profile.kind === "standard") return section !== "other";
    return true;
  };
  const others = all.filter((p) => p.id !== profile.id);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.updateProfile(profile.id, {
        ...(system ? {} : { name, description }),
        permissions: perms,
      });
      setSaved(true);
      setEditing(false);
      reload();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/crm/${orgSlug}/settings/profiles`} aria-label="Back to profiles">
            ←
          </Link>
          <h2 className="text-lg font-semibold text-text">Profile: {profile.name}</h2>
          {system ? <Badge>System</Badge> : null}
        </div>
        <div className="flex items-center gap-2">
          <CloneProfileDialog
            orgSlug={orgSlug}
            profiles={all}
            defaultSourceId={profile.id}
            label="Clone"
          />
          <Link variant="secondary" href={`/crm/${orgSlug}/settings/members`}>
            View Users ({profile.memberCount})
          </Link>
          {profile.kind === "administrator" ? null : editing ? (
            <>
              <Button variant="secondary" onPress={() => reload()} isDisabled={busy}>
                Cancel
              </Button>
              <Button onPress={save} isPending={busy}>
                Save
              </Button>
            </>
          ) : (
            <Button variant="secondary" onPress={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {system ? null : (
            <DialogTrigger>
              <Button variant="danger">Delete</Button>
              <Dialog title="Delete profile">
                {({ close }) => (
                  <div className="flex flex-col gap-4">
                    {deleteError ? <Alert variant="danger">{deleteError}</Alert> : null}
                    {profile.memberCount > 0 ? (
                      <>
                        <p className="text-sm text-text">
                          {profile.memberCount} user(s) have this profile. Choose the profile they
                          move to.
                        </p>
                        <Select
                          label="Replacement profile"
                          items={others}
                          selectedKey={replacement || null}
                          onSelectionChange={(key) => setReplacement(String(key))}
                        >
                          {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
                        </Select>
                      </>
                    ) : (
                      <p className="text-sm text-text">This profile will be deleted.</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onPress={close}>
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        onPress={async () => {
                          try {
                            await api.deleteProfile(profile.id, replacement || undefined);
                            router.push(`/crm/${orgSlug}/settings/profiles`);
                          } catch (e) {
                            setDeleteError(errorText(e));
                          }
                        }}
                      >
                        Delete profile
                      </Button>
                    </div>
                  </div>
                )}
              </Dialog>
            </DialogTrigger>
          )}
        </div>
      </div>
      {system ? (
        <Alert variant="info">
          {profile.kind === "administrator"
            ? "This is a system-defined profile and cannot be changed. Clone it to create an editable profile."
            : "This is a system-defined profile; you can only change module and feature permissions. Clone it to manage the other permissions."}
        </Alert>
      ) : null}
      {saved && !editing ? <Alert variant="success">Profile saved.</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {system ? null : editing ? (
        <div className="flex max-w-xl flex-col gap-3">
          <TextField label="Profile name" value={name} onChange={setName} />
          <TextArea label="Description" value={description} onChange={setDescription} />
        </div>
      ) : (
        <HelpText>{profile.description || "No description."}</HelpText>
      )}
      <PermissionsEditor perms={perms} onChange={setPerms} editable={editable} />
    </div>
  );
}
