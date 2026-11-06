"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import {
  type CreateInvitationAction,
  type InviteAccessOptions,
  InviteMemberDialog,
} from "@/components/members/invite-member-dialog";
import {
  type MemberAccessInfo,
  MemberAccessPickers,
} from "@/components/members/member-access-cells";
import { RemoveMemberButton } from "@/components/members/remove-member-button";
import { type ChangeRoleAction, RoleControl } from "@/components/members/role-control";
import { type MemberRole, roleLabel } from "@/components/members/roles";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Select, SelectItem } from "@/components/ui/select";
import { UserAvatarPlaceholder } from "@/components/ui/user-avatar-placeholder";
import { type ActionState, initialActionState } from "@/lib/action";
import { SettingsTabs } from "./settings-tabs";

export type UserRow = {
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
};

export type UserAccessInfo = MemberAccessInfo;

export type UserLocalization = {
  language?: string;
  locale: string;
  datePattern?: string;
  clock?: 12 | 24;
  timeZone: string;
};

export type RemoveUserAction = (
  userId: string,
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type StatusFilter = "active" | "admin";

/** First word(s) / last word of a display name, for the First Name and Last Name rows. */
export function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return { first: parts[0] ?? "", last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] ?? "" };
}

/**
 * Users tab of Setup → Users (reference master–detail split): the list of members on the left,
 * the selected user's details on the right. Writes reuse the members actions and the
 * member-access API; nothing here decides access on its own.
 */
export function UsersScreen({
  orgSlug,
  users,
  currentUserId,
  canManage,
  access,
  groupsByUser,
  localization,
  inviteAction,
  inviteOptions,
  onChangeRole,
  onRemove,
}: {
  orgSlug: string;
  users: readonly UserRow[];
  currentUserId: string;
  canManage: boolean;
  access?: UserAccessInfo;
  groupsByUser: Readonly<Record<string, readonly string[]>>;
  localization: UserLocalization;
  inviteAction?: CreateInvitationAction;
  inviteOptions?: InviteAccessOptions;
  onChangeRole?: ChangeRoleAction;
  onRemove?: RemoveUserAction;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("active");
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ownerId = useMemo(
    () => Object.entries(access?.byUser ?? {}).find(([, a]) => a.isOwner)?.[0] ?? null,
    [access],
  );
  const counts = {
    active: users.length,
    admin: users.filter((u) => u.role === "admin").length,
  };
  const visible = users.filter((u) => {
    if (filter === "admin" && u.role !== "admin") return false;
    const q = query.trim().toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
  const selected =
    users.find((u) => u.userId === selectedId) ??
    users.find((u) => u.userId === currentUserId) ??
    users[0];
  const checkable = visible.filter((u) => u.userId !== ownerId);
  const allChecked = checkable.length > 0 && checkable.every((u) => checked.has(u.userId));

  const nameOf = (list: readonly { id: string; name: string }[], id: string | undefined) =>
    list.find((item) => item.id === id)?.name ?? "";

  return (
    <section
      className="flex min-h-[calc(100vh-10rem)] flex-col rounded-lg border border-border bg-surface"
      data-settings-access
    >
      <SettingsTabs set="users" orgSlug={orgSlug} canManage={canManage} />
      {error ? (
        <div className="px-6 pt-4">
          <Alert variant="danger">{error}</Alert>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-3 border-border p-6 md:w-[22rem] md:border-r lg:w-[26rem]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select
              label="User status"
              hideLabel
              items={[
                { id: "active", name: `Active Users (${counts.active})` },
                { id: "admin", name: `Admin Users (${counts.admin})` },
              ]}
              selectedKey={filter}
              onSelectionChange={(key) => setFilter(key === "admin" ? "admin" : "active")}
            >
              {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
            </Select>
            {canManage && inviteAction ? (
              <div className="inline-flex shrink-0 items-center" data-split-button>
                <InviteMemberDialog
                  action={inviteAction}
                  accessOptions={inviteOptions}
                  trigger={
                    <Button size="splitPrimary" className="rounded-r-none">
                      <Icons.plus aria-hidden="true" className="h-4 w-4" />
                      New User
                    </Button>
                  }
                />
                <span
                  aria-hidden="true"
                  className="h-(--size-button-split-height) w-px bg-(--color-primary-divider)"
                />
                <MenuTrigger>
                  <Button
                    aria-label="More user actions"
                    size="splitArrow"
                    className="rounded-l-none"
                  >
                    <Icons.chevronDown aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <Menu
                    onAction={(key) => {
                      if (key === "activate")
                        router.push(`/crm/${orgSlug}/settings/activate-users`);
                    }}
                  >
                    <MenuItem id="activate">Activate Users</MenuItem>
                  </Menu>
                </MenuTrigger>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3 border-b border-border pb-2">
            {canManage ? (
              <Checkbox
                label="Select all users"
                hideLabel
                isSelected={allChecked}
                isDisabled={checkable.length === 0}
                onChange={(on) =>
                  setChecked(on ? new Set(checkable.map((u) => u.userId)) : new Set())
                }
              />
            ) : null}
            <Icons.filterSearch aria-hidden="true" className="h-4 w-4 text-text-muted" />
            <input
              type="search"
              aria-label="Search users"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-md text-text outline-none placeholder:text-text-muted"
            />
          </div>
          <ul aria-label="Users" className="flex flex-col">
            {visible.length === 0 ? (
              <li className="py-6 text-center text-sm text-text-muted">No users found.</li>
            ) : null}
            {visible.map((user) => {
              const info = access?.byUser[user.userId];
              const isOwner = user.userId === ownerId;
              const isSelected = user.userId === selected?.userId;
              const roleName = nameOf(access?.roles ?? [], info?.roleId);
              const profileName = nameOf(access?.profiles ?? [], info?.profileId);
              return (
                <li
                  key={user.userId}
                  data-user-row={user.userId}
                  className={`flex items-center gap-3 px-2 py-3 ${isSelected ? "bg-primary-subtle" : ""}`}
                >
                  <span className="w-5 shrink-0">
                    {canManage && !isOwner ? (
                      <Checkbox
                        label={`Select ${user.name}`}
                        hideLabel
                        isSelected={checked.has(user.userId)}
                        onChange={(on) => {
                          const next = new Set(checked);
                          if (on) next.add(user.userId);
                          else next.delete(user.userId);
                          setChecked(next);
                        }}
                      />
                    ) : null}
                  </span>
                  <button
                    type="button"
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() => setSelectedId(user.userId)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <Avatar ring={isSelected} online={user.userId === currentUserId} size="3rem" />
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 truncate text-md font-semibold text-text">
                        {user.name}
                        {user.userId === currentUserId ? <Badge>You</Badge> : null}
                      </span>
                      <span className="truncate text-sm text-text-muted">
                        {access ? (
                          <>
                            {roleName || roleLabel(user.role)},{" "}
                            {isOwner ? <SuperAdminPill solid /> : profileName}
                          </>
                        ) : (
                          roleLabel(user.role)
                        )}
                      </span>
                      <span className="truncate text-sm text-text">{user.email}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {selected ? (
          <UserDetail
            key={selected.userId}
            user={selected}
            isOwner={selected.userId === ownerId}
            canManage={canManage}
            access={access}
            groups={groupsByUser[selected.userId] ?? []}
            localization={localization}
            roleName={nameOf(access?.roles ?? [], access?.byUser[selected.userId]?.roleId)}
            profileName={nameOf(access?.profiles ?? [], access?.byUser[selected.userId]?.profileId)}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
            report={setError}
          />
        ) : null}
      </div>
    </section>
  );
}

function Avatar({ ring, online, size }: { ring: boolean; online?: boolean; size: string }) {
  return (
    <span
      className={`relative inline-flex shrink-0 rounded-full ${ring ? "ring-2 ring-warning ring-offset-2 ring-offset-surface" : ""}`}
    >
      <UserAvatarPlaceholder size={size} />
      {online === undefined ? null : (
        <span
          aria-hidden="true"
          data-presence={online ? "online" : "offline"}
          className={`absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-surface ${online ? "bg-success" : "bg-text-muted"}`}
        />
      )}
    </span>
  );
}

function SuperAdminPill({ solid = false }: { solid?: boolean }) {
  return solid ? (
    <span className="inline-flex rounded px-1.5 text-sm font-semibold text-primary-text bg-warning">
      Super Admin
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-warning bg-warning/10 px-3 py-0.5 text-sm font-semibold text-warning">
      Super Admin
    </span>
  );
}

function Row({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-[12rem_1fr] items-center gap-6 py-2">
      <dt className="text-right text-md text-text-muted">{label}</dt>
      <dd className="min-w-0 text-md text-text">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="pt-4 text-md font-semibold text-text">{title}</h3>
      <dl className="flex flex-col">{children}</dl>
    </section>
  );
}

function UserDetail({
  user,
  isOwner,
  canManage,
  access,
  groups,
  localization,
  roleName,
  profileName,
  onChangeRole,
  onRemove,
  report,
}: {
  user: UserRow;
  isOwner: boolean;
  canManage: boolean;
  access?: UserAccessInfo;
  groups: readonly string[];
  localization: UserLocalization;
  roleName: string;
  profileName: string;
  onChangeRole?: ChangeRoleAction;
  onRemove?: RemoveUserAction;
  report: (message: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const { first, last } = splitName(user.name);
  const editable = canManage && Boolean(onChangeRole && onRemove);
  return (
    <article aria-label={`User details: ${user.name}`} className="min-w-0 flex-1 p-6 lg:px-10">
      <header className="flex flex-wrap items-start gap-6">
        <Avatar ring={false} size="6rem" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-text">{user.name}</h2>
            {isOwner ? <SuperAdminPill /> : null}
            {editable ? (
              <Button
                variant="ghost"
                size="sm"
                aria-label="Edit user"
                aria-pressed={editing}
                onPress={() => setEditing((on) => !on)}
              >
                <Icons.fieldEdit aria-hidden="true" className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          {roleName ? <p className="text-md text-text-muted">{roleName}</p> : null}
          <p className="flex items-center gap-2 text-md text-text">
            <Icons.envelope aria-hidden="true" className="h-4 w-4 text-primary" />
            {user.email}
          </p>
        </div>
      </header>
      {editing && editable && onChangeRole && onRemove ? (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-border p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-text-muted">Membership</span>
            <RoleControl
              userId={user.userId}
              name={user.name}
              role={user.role}
              onChangeRole={onChangeRole}
              report={report}
            />
          </div>
          {access ? (
            <MemberAccessPickers
              access={access}
              userId={user.userId}
              name={user.name}
              report={report}
              showLabels
            />
          ) : null}
          <RemoveMemberButton
            name={user.name}
            report={report}
            onRemove={() => onRemove(user.userId, initialActionState, new FormData())}
          />
        </div>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="mt-6"
        aria-expanded={expanded}
        onPress={() => setExpanded((on) => !on)}
      >
        {expanded ? "Hide details" : "Show details"}
        {expanded ? (
          <Icons.chevronUp aria-hidden="true" className="h-4 w-4 text-primary" />
        ) : (
          <Icons.chevronDown aria-hidden="true" className="h-4 w-4 text-primary" />
        )}
      </Button>
      {expanded ? (
        <div className="flex flex-col" data-testid="user-detail-sections">
          <Section title="User Information">
            <Row label="First Name">{first}</Row>
            <Row label="Last Name">{last}</Row>
            <Row label="Email">
              <a className="text-primary" href={`mailto:${user.email}`}>
                {user.email}
              </a>
            </Row>
            <Row label="Role">{roleName || roleLabel(user.role)}</Row>
            <Row label="Profile">{profileName}</Row>
            <Row label="Alias" />
            <Row label="Phone" />
            <Row label="Mobile" />
            <Row label="Website" />
            <Row label="Fax" />
            <Row label="Date of Birth" />
          </Section>
          <Section title="Address Information">
            <Row label="Street" />
            <Row label="City" />
            <Row label="State" />
            <Row label="Zip Code" />
            <Row label="Country" />
          </Section>
          <Section title="Audit Information">
            <Row label="Created By" />
            <Row label="Modified By" />
            <Row label="Invited By" />
            <Row label="Confirmed Time">{user.joinedAt}</Row>
          </Section>
          <Section title="Localization">
            <Row label="Language">{localization.language ?? "-"}</Row>
            <Row label="Country Locale">{localization.locale}</Row>
            <Row label="Date Format">{localization.datePattern ?? "-"}</Row>
            <Row label="Time Format">
              {localization.clock ? `${localization.clock} Hours` : "-"}
            </Row>
            <Row label="Time Zone">{localization.timeZone}</Row>
          </Section>
          <Section title="Groups">
            <Row label="Member in">{groups.length ? groups.join(", ") : "-"}</Row>
          </Section>
        </div>
      ) : null}
    </article>
  );
}
