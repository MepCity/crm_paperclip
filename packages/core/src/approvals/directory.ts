import { sql } from "drizzle-orm";
import { resolveGroupUsers } from "../access/groups";
import type { AccessGroupMemberRow, AccessRoleRow, GroupMemberKind } from "../access/types";
import type { Transaction } from "../tenancy/types";
import { isUuid, rowsOf } from "./shared";

/** Resolves approver groups and the record owner's manager (ADR 0017 access data). */
export interface ApproverDirectory {
  groupMembers(tx: Transaction, orgId: string, groupIds: readonly string[]): Promise<string[]>;
  ownerManagers(tx: Transaction, orgId: string, ownerId: string | null): Promise<string[]>;
}

async function roles(tx: Transaction, orgId: string): Promise<AccessRoleRow[]> {
  return rowsOf(
    await tx.execute(
      sql`SELECT id, name, parent_role_id, share_with_peers FROM access_roles
          WHERE organization_id = ${orgId}`,
    ),
  ).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    parentRoleId: row.parent_role_id ? String(row.parent_role_id) : null,
    shareWithPeers: Boolean(row.share_with_peers),
  }));
}

async function usersByRole(tx: Transaction, orgId: string): Promise<Map<string, string[]>> {
  const byRole = new Map<string, string[]>();
  for (const row of rowsOf(
    await tx.execute(
      sql`SELECT a.user_id, a.role_id FROM member_access a
          JOIN memberships m ON m.organization_id = a.organization_id AND m.user_id = a.user_id
          WHERE a.organization_id = ${orgId}`,
    ),
  )) {
    const list = byRole.get(String(row.role_id)) ?? [];
    list.push(String(row.user_id));
    byRole.set(String(row.role_id), list);
  }
  return byRole;
}

/**
 * The directory backed by the organisation's roles and groups. Group members are resolved
 * through nested groups and roles (with subordinates); the owner's manager is every user in the
 * parent role of the owner's role. An unknown group or a top-level owner yields no approver, and
 * the approval service keeps such a request pending instead of approving it.
 */
export const accessApproverDirectory: ApproverDirectory = {
  async groupMembers(tx, orgId, groupIds) {
    const ids = groupIds.filter(isUuid);
    if (ids.length === 0) return [];
    const groupMembers: AccessGroupMemberRow[] = rowsOf(
      await tx.execute(
        sql`SELECT group_id, member_kind, member_id FROM access_group_members
            WHERE organization_id = ${orgId}`,
      ),
    ).map((row) => ({
      groupId: String(row.group_id),
      kind: row.member_kind as GroupMemberKind,
      memberId: String(row.member_id),
    }));
    const [roleRows, byRole] = [await roles(tx, orgId), await usersByRole(tx, orgId)];
    const members = new Set([...byRole.values()].flat());
    const users = new Set<string>();
    for (const id of ids)
      for (const user of resolveGroupUsers(id, groupMembers, roleRows, byRole))
        if (members.has(user)) users.add(user);
    return [...users];
  },
  async ownerManagers(tx, orgId, ownerId) {
    if (!ownerId || !isUuid(ownerId)) return [];
    const owner = rowsOf(
      await tx.execute(
        sql`SELECT r.parent_role_id FROM member_access a
            JOIN access_roles r ON r.organization_id = a.organization_id AND r.id = a.role_id
            WHERE a.organization_id = ${orgId} AND a.user_id = ${ownerId}`,
      ),
    )[0];
    const parent = owner?.parent_role_id ? String(owner.parent_role_id) : null;
    if (!parent) return [];
    return (await usersByRole(tx, orgId)).get(parent)?.filter((id) => id !== ownerId) ?? [];
  },
};
