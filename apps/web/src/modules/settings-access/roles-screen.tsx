"use client";

import type { MemberAccessRow, RoleNode } from "@crm/core/access";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "@/components/ui/link";
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

/** Role ids below `roleId` (used so a role cannot be moved under itself). */
export function descendantIds(roles: readonly RoleNode[], roleId: string): Set<string> {
  const out = new Set<string>();
  const walk = (id: string) => {
    for (const r of roles) {
      if (r.parentRoleId === id && !out.has(r.id)) {
        out.add(r.id);
        walk(r.id);
      }
    }
  };
  walk(roleId);
  return out;
}

export function RoleFormDialog({
  orgSlug,
  roles,
  role,
  label,
  onDone,
}: {
  orgSlug: string;
  roles: readonly RoleNode[];
  role?: RoleNode;
  label: string;
  onDone: (saved: RoleNode) => void;
}) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const root = roles.find((r) => r.parentRoleId === null);
  const isRoot = role !== undefined && role.parentRoleId === null;
  const blocked = role ? new Set([role.id, ...descendantIds(roles, role.id)]) : new Set<string>();
  const parents = roles.filter((r) => !blocked.has(r.id));
  const [name, setName] = useState(role?.name ?? "");
  const [parent, setParent] = useState(role?.parentRoleId ?? root?.id ?? "");
  const [peers, setPeers] = useState(role?.shareWithPeers ?? false);
  const [description, setDescription] = useState(role?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <DialogTrigger>
      <Button variant={role ? "secondary" : "primary"}>{label}</Button>
      <Dialog title={role ? "Edit role" : "New role"}>
        {({ close }) => (
          <form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const saved = role
                  ? await api.updateRole(role.id, {
                      name,
                      parentRoleId: isRoot ? undefined : parent,
                      shareWithPeers: peers,
                      description,
                    })
                  : await api.createRole({
                      name,
                      parentRoleId: parent,
                      shareWithPeers: peers,
                      description,
                    });
                close();
                onDone(saved);
              } catch (e) {
                setError(errorText(e));
                setBusy(false);
              }
            }}
          >
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <TextField label="Role name" value={name} onChange={setName} isRequired />
            {isRoot ? (
              <p className="text-sm text-text-muted">The top role has no reporting line.</p>
            ) : (
              <Select
                label="Reporting To"
                items={parents}
                selectedKey={parent || null}
                onSelectionChange={(key) => setParent(String(key))}
                isRequired
              >
                {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
              </Select>
            )}
            <Checkbox label="Share data with peers" isSelected={peers} onChange={setPeers} />
            <TextArea label="Description" value={description} onChange={setDescription} />
            <Button type="submit" isPending={busy}>
              Save role
            </Button>
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

function TreeNode({
  orgSlug,
  roles,
  node,
  expanded,
  toggle,
}: {
  orgSlug: string;
  roles: readonly RoleNode[];
  node: RoleNode;
  expanded: ReadonlySet<string>;
  toggle: (id: string) => void;
}) {
  const children = roles.filter((r) => r.parentRoleId === node.id);
  const open = expanded.has(node.id);
  return (
    <li>
      <div className="relative flex items-center gap-2 py-1.5">
        {children.length > 0 ? (
          <button
            type="button"
            className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border bg-surface text-xs leading-none text-text-muted"
            aria-label={`${open ? "Collapse" : "Expand"} ${node.name}`}
            aria-expanded={open}
            onClick={() => toggle(node.id)}
          >
            {open ? "–" : "+"}
          </button>
        ) : null}
        <Link href={`/crm/${orgSlug}/settings/roles/${node.id}`}>{node.name}</Link>
      </div>
      {open && children.length > 0 ? (
        <ul className="ml-2.5 border-l border-dashed border-border pl-6">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              orgSlug={orgSlug}
              roles={roles}
              node={child}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function RolesScreen({ orgSlug, orgName }: { orgSlug: string; orgName: string }) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const router = useRouter();
  const [state] = useLoad(api.listRoles);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [initial, setInitial] = useState(false);
  if (state.status === "ready" && !initial) {
    setInitial(true);
    setExpanded(new Set(state.data.map((r) => r.id)));
  }
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <Screen
      state={state}
      title="Roles"
      actions={
        state.status === "ready" ? (
          <RoleFormDialog
            orgSlug={orgSlug}
            roles={state.data}
            label="New Role"
            onDone={(saved) => router.push(`/crm/${orgSlug}/settings/roles/${saved.id}`)}
          />
        ) : null
      }
    >
      {(roles) => (
        <>
          <HelpText>
            Roles decide which records a user can see: managers see the records of their
            subordinates, never the other way round.
          </HelpText>
          <div className="flex gap-3 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setExpanded(new Set(roles.map((r) => r.id)))}
            >
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onPress={() => setExpanded(new Set())}>
              Collapse All
            </Button>
          </div>
          <Card>
            <CardContent>
              <p className="py-1 text-sm font-semibold text-text">{orgName}</p>
              <ul className="ml-4" data-testid="role-tree">
                {roles
                  .filter((r) => r.parentRoleId === null)
                  .map((root) => (
                    <TreeNode
                      key={root.id}
                      orgSlug={orgSlug}
                      roles={roles}
                      node={root}
                      expanded={expanded}
                      toggle={toggle}
                    />
                  ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </Screen>
  );
}

export function RoleDetailScreen({ orgSlug, roleId }: { orgSlug: string; roleId: string }) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const router = useRouter();
  const load = useCallback(
    async () => ({
      roles: await api.listRoles(),
      members: await api.listMembers(),
    }),
    [api],
  );
  const [state, reload] = useLoad(load);
  const [transfer, setTransfer] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <Screen state={state} title="Role">
      {({ roles, members }) => {
        const role = roles.find((r) => r.id === roleId);
        if (!role) {
          return (
            <Alert variant="danger">
              This role does not exist.{" "}
              <Link href={`/crm/${orgSlug}/settings/roles`}>Go to roles list</Link>
            </Alert>
          );
        }
        const parent = roles.find((r) => r.id === role.parentRoleId);
        const users: MemberAccessRow[] = members.filter((m) => m.roleId === role.id);
        const targets = roles.filter(
          (r) => r.id !== role.id && !descendantIds(roles, role.id).has(r.id),
        );
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">{role.name}</h2>
              <div className="flex gap-2">
                <RoleFormDialog
                  orgSlug={orgSlug}
                  roles={roles}
                  role={role}
                  label="Edit"
                  onDone={reload}
                />
                {role.parentRoleId === null ? null : (
                  <DialogTrigger>
                    <Button variant="danger">Delete</Button>
                    <Dialog title="Delete role">
                      {({ close }) => (
                        <div className="flex flex-col gap-4">
                          {deleteError ? <Alert variant="danger">{deleteError}</Alert> : null}
                          <p className="text-sm text-text">
                            Users and child roles of this role move to the role you choose.
                          </p>
                          <Select
                            label="Transfer to role"
                            items={targets}
                            selectedKey={transfer || null}
                            onSelectionChange={(key) => setTransfer(String(key))}
                            isRequired
                          >
                            {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
                          </Select>
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" onPress={close}>
                              Cancel
                            </Button>
                            <Button
                              variant="danger"
                              onPress={async () => {
                                try {
                                  await api.deleteRole(role.id, transfer);
                                  router.push(`/crm/${orgSlug}/settings/roles`);
                                } catch (e) {
                                  setDeleteError(errorText(e));
                                }
                              }}
                            >
                              Delete role
                            </Button>
                          </div>
                        </div>
                      )}
                    </Dialog>
                  </DialogTrigger>
                )}
                <Link variant="secondary" href={`/crm/${orgSlug}/settings/roles`}>
                  Go to roles list
                </Link>
              </div>
            </div>
            <Card>
              <CardContent>
                <dl className="grid grid-cols-[12rem_1fr] gap-y-2 text-sm">
                  <dt className="text-text-muted">Role Name</dt>
                  <dd>{role.name}</dd>
                  <dt className="text-text-muted">Reporting To</dt>
                  <dd>{parent?.name ?? "—"}</dd>
                  <dt className="text-text-muted">Share data with peers</dt>
                  <dd>{role.shareWithPeers ? "Yes" : "No"}</dd>
                  <dt className="text-text-muted">Description</dt>
                  <dd>{role.description || "—"}</dd>
                </dl>
              </CardContent>
            </Card>
            <h3 className="text-md font-semibold text-text">Associated users</h3>
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email address</TableHead>
                      <TableHead>User status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody columnCount={3} emptyMessage="No users have this role.">
                    {users.map((u) => (
                      <TableRow key={u.userId}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge>{u.isOwner ? "Super Admin" : "Active"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </Screen>
  );
}
