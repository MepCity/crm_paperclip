"use client";

import type { ProfileDetail, ProfileSummary } from "@crm/core/access";
import { OWNED_MODULES, type ProfilePermissions } from "@crm/core/access/catalogue";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { createAccessClient } from "./api";
import { CloneProfileDialog } from "./profiles-screen";
import { errorText, HelpText, Screen, useLoad } from "./shared";

type Perms = ProfilePermissions;
type Section = "modules" | "other";

/** `camelCase` key to a label ("createTeamFolder" -> "Create team folder"). */
export function humanize(key: string): string {
  const words = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

type ListPath = readonly [string, string?];

type ListRowDef = { label: string; path: ListPath; on?: readonly string[] };
type FlagRowDef = { label: string; group: "tools" | "admin"; key: string };

const IMPORT_EXPORT_ROWS: ListRowDef[] = [
  { label: "Import Records", path: ["importModules"] },
  { label: "Export", path: ["exportModules"] },
];
const EMAIL_ROWS: ListRowDef[] = [
  { label: "Send Email", path: ["email", "send"] },
  { label: "Mass Email", path: ["email", "mass"] },
  { label: "Delete Email", path: ["email", "delete"] },
];
const TOOL_LIST_ROWS: ListRowDef[] = [
  { label: "Mass Update", path: ["tools", "massUpdate"] },
  { label: "Mass Delete", path: ["tools", "massDelete"] },
  { label: "Change Owner", path: ["tools", "changeOwner"] },
  { label: "Mass Transfer", path: ["tools", "massTransfer"] },
  { label: "Convert", path: ["tools", "convert"], on: ["Leads"] },
  { label: "Share", path: ["tools", "share"] },
  { label: "Print View", path: ["tools", "printView"] },
  { label: "Find & Merge", path: ["tools", "findAndMerge"] },
  {
    label: "Enroll in Cadence",
    path: ["tools", "enrollInCadence"],
    on: ["Leads", "Contacts", "Accounts", "Deals"],
  },
];
const TOOL_FLAG_ROWS: FlagRowDef[] = [
  { label: "Manage Views", group: "tools", key: "manageViews" },
  { label: "Tags", group: "tools", key: "tags" },
  { label: "Only list subordinates", group: "tools", key: "onlyListSubordinates" },
  { label: "Record timeline", group: "tools", key: "recordTimeline" },
];
const ADMIN_FLAG_ROWS: FlagRowDef[] = [
  { label: "User Management", group: "admin", key: "userManagement" },
  { label: "Module Customization", group: "admin", key: "moduleCustomization" },
  { label: "Manage Currencies", group: "admin", key: "manageCurrencies" },
  { label: "Customize Home Page", group: "admin", key: "customizeHome" },
  { label: "Manage Integrations", group: "admin", key: "manageIntegrations" },
];
const ADMIN_LIST_ROWS: ListRowDef[] = [
  { label: "View All Records", path: ["admin", "viewAllRecords"] },
  { label: "Modify All Records", path: ["admin", "modifyAllRecords"] },
];
const EMAIL_TEMPLATE_ROWS: FlagRowDef[] = [
  { label: "Email & chat settings", group: "admin", key: "emailSettings" },
  { label: "Manage templates", group: "admin", key: "manageTemplates" },
];
const AUTOMATION_ROWS: FlagRowDef[] = [
  { label: "Manage Automation", group: "admin", key: "manageAutomation" },
  { label: "Manage Webforms", group: "admin", key: "manageWebforms" },
  { label: "Manage Journeys", group: "admin", key: "manageJourneys" },
  { label: "Manage Portals", group: "admin", key: "managePortals" },
];
const DATA_ROWS: FlagRowDef[] = [
  { label: "Data Management", group: "admin", key: "dataManagement" },
];

const FEATURE_LABELS: Record<keyof Perms["features"], string> = {
  reports: "Reports",
  analytics: "Analytics",
  documents: "Documents",
  notes: "Notes",
  attachments: "Attachments",
  feeds: "Feeds",
  cadences: "Cadences",
  journeys: "Journeys",
};

/** Left anchor menu of the profile page, grouped as in the reference. */
export const PROFILE_ANCHORS: { group: string; items: { id: string; label: string }[] }[] = [
  {
    group: "Module Permissions",
    items: [
      { id: "basic", label: "Basic" },
      { id: "import-export", label: "Import/Export" },
      { id: "send-email", label: "Send Email" },
      { id: "tools", label: "Tools" },
      { id: "other", label: "Other" },
    ],
  },
  {
    group: "Set Permissions",
    items: [
      { id: "administrator-level", label: "Administrator Level" },
      { id: "email-templates", label: "Email & Templates" },
      { id: "automation", label: "Automation" },
      { id: "data-management", label: "Data Management" },
    ],
  },
];

function moduleList(perms: Perms, path: ListPath): string[] {
  const [a, b] = path;
  const root = perms as unknown as Record<string, unknown>;
  const value = b ? (root[a] as Record<string, string[]>)[b] : root[a];
  return value as string[];
}

function withModuleList(perms: Perms, path: ListPath, next: string[]): Perms {
  const [a, b] = path;
  const draft = structuredClone(perms) as unknown as Record<string, unknown>;
  if (b) (draft[a] as Record<string, string[]>)[b] = next;
  else draft[a] = next;
  return draft as unknown as Perms;
}

/** "Leads, Contacts, Accounts, Deals & 9 more" — the reference's module-list summary. */
export function listSummary(items: readonly string[]): string {
  if (items.length === 0) return "None";
  if (items.length <= 4) return items.join(", ");
  return `${items.slice(0, 4).join(", ")} & ${items.length - 4} more`;
}

/** One permission row: name, a toggle and (optionally) the action-summary dropdown. */
function PermissionRow({
  label,
  on,
  disabled,
  onToggle,
  options,
}: {
  label: string;
  on: boolean;
  disabled: boolean;
  onToggle: (next: boolean) => void;
  options?: { key: string; label: string; checked: boolean; onChange: (next: boolean) => void }[];
}) {
  const chosen = options?.filter((o) => o.checked).map((o) => o.label) ?? [];
  const summary = options && options.length > 6 ? listSummary(chosen) : chosen.join(", ") || "None";
  return (
    <div
      className="grid grid-cols-[minmax(10rem,16rem)_auto_minmax(0,1fr)] items-center gap-6 border-b border-border py-3"
      data-permission-row={label}
    >
      <span className="text-md text-text">{label}</span>
      <Switch label={label} hideLabel isSelected={on} isDisabled={disabled} onChange={onToggle} />
      {options ? (
        <PopoverTrigger>
          <Button
            variant="secondary"
            size="sm"
            aria-label={`${label} actions: ${summary}`}
            isDisabled={!on}
            className="max-w-md justify-between"
          >
            <span className="truncate">{summary}</span>
            <Icons.chevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
          </Button>
          <Popover title={`${label} actions`} hideTitle placement="bottom start">
            <div className="flex max-h-80 flex-col gap-2 overflow-auto">
              {options.map((option) => (
                <Checkbox
                  key={option.key}
                  label={`${label}: ${option.label}`}
                  isDisabled={disabled}
                  isSelected={option.checked}
                  onChange={option.onChange}
                />
              ))}
            </div>
          </Popover>
        </PopoverTrigger>
      ) : (
        <span />
      )}
    </div>
  );
}

function PermSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={`profile-${id}`} aria-labelledby={`profile-${id}-title`} className="scroll-mt-4">
      <h3 id={`profile-${id}-title`} className="pt-6 pb-2 text-md font-semibold text-text">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
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
  const basic = editable("modules");
  const other = editable("other");
  const all = [...OWNED_MODULES] as string[];

  const listRow = (row: ListRowDef) => {
    const selected = moduleList(perms, row.path);
    return (
      <PermissionRow
        key={row.label}
        label={row.label}
        on={selected.length > 0}
        disabled={!other}
        onToggle={(next) =>
          onChange(withModuleList(perms, row.path, next ? [...(row.on ?? all)] : []))
        }
        options={OWNED_MODULES.map((module) => ({
          key: module,
          label: module,
          checked: selected.includes(module),
          onChange: (next: boolean) =>
            onChange(
              withModuleList(
                perms,
                row.path,
                next
                  ? all.filter((m) => m === module || selected.includes(m))
                  : selected.filter((m) => m !== module),
              ),
            ),
        }))}
      />
    );
  };
  const flagRow = (row: FlagRowDef) => (
    <PermissionRow
      key={row.key}
      label={row.label}
      on={(perms[row.group] as Record<string, unknown>)[row.key] as boolean}
      disabled={!other}
      onToggle={(next) =>
        set((d) => {
          (d[row.group] as Record<string, unknown>)[row.key] = next;
        })
      }
    />
  );

  return (
    <div className="flex flex-col" data-testid="profile-permissions">
      <h2 className="text-lg font-semibold text-text">Module Permissions</h2>
      <PermSection id="basic" title="Basic Permissions">
        <div data-testid="perm-modules" className="flex flex-col">
          {OWNED_MODULES.map((module) => {
            const actions = perms.modules[module];
            return (
              <PermissionRow
                key={module}
                label={module}
                on={Object.values(actions).some(Boolean)}
                disabled={!basic}
                onToggle={(next) =>
                  set((d) => {
                    d.modules[module] = { view: next, create: next, edit: next, delete: next };
                  })
                }
                options={(["view", "create", "edit", "delete"] as const).map((action) => ({
                  key: action,
                  label: humanize(action),
                  checked: actions[action],
                  onChange: (next: boolean) =>
                    set((d) => {
                      d.modules[module][action] = next;
                    }),
                }))}
              />
            );
          })}
        </div>
        <div data-testid="perm-features" className="flex flex-col">
          {(Object.keys(perms.features) as (keyof Perms["features"])[]).map((feature) => {
            const actions = perms.features[feature] as Record<string, boolean>;
            const label = FEATURE_LABELS[feature] ?? humanize(feature);
            return (
              <PermissionRow
                key={feature}
                label={label}
                on={Object.values(actions).some(Boolean)}
                disabled={!basic}
                onToggle={(next) =>
                  set((d) => {
                    const target = d.features[feature] as Record<string, boolean>;
                    for (const key of Object.keys(target)) target[key] = next;
                  })
                }
                options={Object.keys(actions).map((key) => ({
                  key,
                  label: humanize(key),
                  checked: actions[key] as boolean,
                  onChange: (next: boolean) =>
                    set((d) => {
                      (d.features[feature] as Record<string, boolean>)[key] = next;
                    }),
                }))}
              />
            );
          })}
        </div>
      </PermSection>
      <PermSection id="import-export" title="Import/Export">
        {IMPORT_EXPORT_ROWS.map(listRow)}
      </PermSection>
      <PermSection id="send-email" title="Send Email">
        {EMAIL_ROWS.map(listRow)}
      </PermSection>
      <PermSection id="tools" title="Tools">
        {TOOL_LIST_ROWS.map(listRow)}
        {TOOL_FLAG_ROWS.map(flagRow)}
      </PermSection>
      <PermSection id="other" title="Other">
        <p className="py-3 text-sm text-text-muted">
          Home, Feeds and Approvals tabs are visible to all profiles based on the organization
          settings.
        </p>
      </PermSection>
      <h2 className="pt-8 text-lg font-semibold text-text">Set Permissions</h2>
      <PermSection id="administrator-level" title="Administrator Level Permissions">
        <div data-testid="perm-admin" className="flex flex-col">
          {ADMIN_FLAG_ROWS.map(flagRow)}
          {ADMIN_LIST_ROWS.map(listRow)}
        </div>
      </PermSection>
      <PermSection id="email-templates" title="Email & Templates">
        {EMAIL_TEMPLATE_ROWS.map(flagRow)}
      </PermSection>
      <PermSection id="automation" title="Automation">
        {AUTOMATION_ROWS.map(flagRow)}
      </PermSection>
      <PermSection id="data-management" title="Data Management">
        {DATA_ROWS.map(flagRow)}
      </PermSection>
    </div>
  );
}

function AnchorMenu() {
  return (
    <nav
      aria-label="Profile permissions"
      className="sticky top-4 flex w-56 shrink-0 flex-col gap-1 self-start"
    >
      {PROFILE_ANCHORS.map((group) => (
        <div key={group.group} className="flex flex-col gap-1 pb-3">
          <span className="px-3 py-1 text-md font-semibold text-text">{group.group}</span>
          {group.items.map((item) => (
            <a
              key={item.id}
              href={`#profile-${item.id}`}
              className="rounded-md px-6 py-1.5 text-md text-text-muted hover:bg-surface-hover hover:text-text"
            >
              {item.label}
            </a>
          ))}
        </div>
      ))}
    </nav>
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
          key={profile.id}
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
  const [editingName, setEditingName] = useState(false);
  const [perms, setPerms] = useState<Perms>(profile.permissions);
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [replacement, setReplacement] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const system = profile.kind !== "custom";
  const editable = (section: Section) => {
    if (profile.kind === "administrator") return false;
    if (profile.kind === "standard") return section !== "other";
    return true;
  };
  const others = all.filter((p) => p.id !== profile.id);
  const dirty = editingName || JSON.stringify(perms) !== JSON.stringify(profile.permissions);

  function reset() {
    setName(profile.name);
    setDescription(profile.description ?? "");
    setPerms(profile.permissions);
    setError(null);
    setEditingName(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateProfile(profile.id, {
        ...(system ? {} : { name, description }),
        permissions: perms,
      });
      setName(updated.name);
      setDescription(updated.description ?? "");
      setPerms(updated.permissions);
      setSaved(true);
      setEditingName(false);
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
            <Icons.arrowLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
          <h2 className="text-lg font-semibold text-text">Profile: {profile.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <CloneProfileDialog
            orgSlug={orgSlug}
            profiles={all}
            defaultSourceId={profile.id}
            label="Clone"
          />
          <Link variant="secondary" href={`/crm/${orgSlug}/settings/users`}>
            View Users ({profile.memberCount})
          </Link>
          {system ? null : (
            <Button
              variant="secondary"
              isDisabled={editingName}
              onPress={() => {
                setSaved(false);
                setError(null);
                setEditingName(true);
              }}
            >
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
            : "This is a system-defined profile; you can only change basic permissions. Clone it or create a new profile to manage other permissions."}
        </Alert>
      ) : null}
      {saved && !dirty ? <Alert variant="success">Profile saved.</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {system ? null : editingName ? (
        <div className="flex max-w-xl flex-col gap-3">
          <TextField label="Profile name" value={name} onChange={setName} />
          <TextArea label="Description" value={description} onChange={setDescription} />
        </div>
      ) : (
        <HelpText>{profile.description || "No description."}</HelpText>
      )}
      <div className="flex gap-8 rounded-lg border border-border bg-surface p-6">
        <AnchorMenu />
        <div className="min-w-0 flex-1">
          <PermissionsEditor
            perms={perms}
            onChange={(next) => {
              setSaved(false);
              setPerms(next);
            }}
            editable={editable}
          />
        </div>
      </div>
      {dirty ? (
        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface py-3">
          <Button onPress={save} isPending={busy}>
            Save
          </Button>
          <Button variant="secondary" onPress={reset} isDisabled={busy}>
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}
