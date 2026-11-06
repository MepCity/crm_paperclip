"use client";

import type { GroupDetail, GroupMemberRef, MemberAccessRow, RoleNode } from "@crm/core/access";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icon";
import { Select, SelectItem } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { createAccessClient } from "./api";
import { errorText, HelpText, Screen, useLoad } from "./shared";

type Directory = {
  groups: GroupDetail[];
  roles: RoleNode[];
  members: MemberAccessRow[];
};

const KINDS = [
  { id: "user", label: "User" },
  { id: "role", label: "Role" },
  { id: "role_and_subordinates", label: "Role and subordinates" },
  { id: "group", label: "Group" },
] as const;

function optionsFor(kind: GroupMemberRef["kind"], dir: Directory, selfId?: string) {
  if (kind === "user") return dir.members.map((m) => ({ id: m.userId, name: m.name }));
  if (kind === "group") return dir.groups.filter((g) => g.id !== selfId);
  return dir.roles;
}

function memberLabel(ref: GroupMemberRef, dir: Directory): string {
  const kind = KINDS.find((k) => k.id === ref.kind)?.label ?? ref.kind;
  const name = optionsFor(ref.kind, dir).find((o) => o.id === ref.id)?.name ?? "Unknown";
  return `${kind}: ${name}`;
}

function GroupDialog({
  orgSlug,
  dir,
  group,
  label,
  onDone,
}: {
  orgSlug: string;
  dir: Directory;
  group?: GroupDetail;
  label: string;
  onDone: () => void;
}) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [members, setMembers] = useState<GroupMemberRef[]>(group?.members ?? []);
  const [kind, setKind] = useState<GroupMemberRef["kind"]>("user");
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <DialogTrigger>
      <Button variant={group ? "secondary" : "primary"}>{label}</Button>
      <Dialog title={group ? "Edit group" : "Create group"}>
        {({ close }) => (
          <form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const input = { name, description, members };
                if (group) await api.updateGroup(group.id, input);
                else await api.createGroup(input);
                close();
                onDone();
              } catch (e) {
                setError(errorText(e));
                setBusy(false);
              }
            }}
          >
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <TextField label="Group name" value={name} onChange={setName} isRequired />
            <TextArea label="Description" value={description} onChange={setDescription} />
            <div className="flex items-end gap-2">
              <Select
                label="Member type"
                items={KINDS}
                selectedKey={kind}
                onSelectionChange={(key) => {
                  setKind(String(key) as GroupMemberRef["kind"]);
                  setMemberId("");
                }}
              >
                {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
              </Select>
              <Select
                label="Group member"
                items={optionsFor(kind, dir, group?.id)}
                selectedKey={memberId || null}
                onSelectionChange={(key) => setMemberId(String(key))}
              >
                {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
              </Select>
              <Button
                variant="secondary"
                isDisabled={!memberId}
                onPress={() => {
                  if (!members.some((m) => m.kind === kind && m.id === memberId)) {
                    setMembers([...members, { kind, id: memberId }]);
                  }
                  setMemberId("");
                }}
              >
                Add member
              </Button>
            </div>
            <ul className="flex flex-col gap-1 text-sm" aria-label="Group members">
              {members.length === 0 ? <li className="text-text-muted">No members yet.</li> : null}
              {members.map((m) => (
                <li key={`${m.kind}:${m.id}`} className="flex items-center justify-between">
                  <span>{memberLabel(m, dir)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${memberLabel(m, dir)}`}
                    onPress={() => setMembers(members.filter((x) => x !== m))}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <Button type="submit" isPending={busy}>
              Save group
            </Button>
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

export function GroupsScreen({ orgSlug }: { orgSlug: string }) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const load = useCallback(
    async (): Promise<Directory> => ({
      groups: await api.listGroups(),
      roles: await api.listRoles(),
      members: await api.listMembers(),
    }),
    [api],
  );
  const [state, reload] = useLoad(load);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <Screen
      state={state}
      title="Groups"
      actions={
        state.status === "ready" ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
            <Icons.help aria-hidden className="size-4" />
            Help
          </span>
        ) : null
      }
    >
      {(dir) => (
        <>
          <HelpText>
            Groups combine users, roles and other groups. Use them as the source or target of a
            sharing rule.
          </HelpText>
          <div>
            <GroupDialog orgSlug={orgSlug} dir={dir} label="Create Group" onDone={reload} />
          </div>
          {deleteError ? <Alert variant="danger">{deleteError}</Alert> : null}
          {dir.groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <svg
                aria-hidden
                viewBox="0 0 120 80"
                className="h-24 w-36 text-primary-subtle"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M20 30 40 12h40l20 18v36H20z" className="text-border" />
                <rect x="20" y="30" width="80" height="36" className="text-border" />
                <circle cx="50" cy="48" r="2" fill="currentColor" className="text-border" />
                <circle cx="70" cy="48" r="2" fill="currentColor" className="text-border" />
              </svg>
              <p className="text-sm text-text-muted">No groups have been created</p>
            </div>
          ) : null}
          {dir.groups.length === 0 ? null : (
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody columnCount={4}>
                    {dir.groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>{group.description}</TableCell>
                        <TableCell>{group.members.length}</TableCell>
                        <TableCell>
                          <span className="inline-flex gap-2">
                            <GroupDialog
                              orgSlug={orgSlug}
                              dir={dir}
                              group={group}
                              label="Edit"
                              onDone={reload}
                            />
                            <Button
                              variant="danger"
                              aria-label={`Delete ${group.name}`}
                              onPress={async () => {
                                try {
                                  await api.deleteGroup(group.id);
                                  setDeleteError(null);
                                  reload();
                                } catch (e) {
                                  setDeleteError(errorText(e));
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
