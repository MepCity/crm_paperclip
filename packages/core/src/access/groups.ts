import { ValidationError } from "../errors";
import type { AccessGroupMemberRow, AccessRoleRow } from "./types";

export const MAX_GROUP_DEPTH = 5;

/** Strict descendants of a role (children, grandchildren, ...). */
export function descendantRoleIds(roles: readonly AccessRoleRow[], roleId: string): Set<string> {
  const children = new Map<string, string[]>();
  for (const role of roles) {
    if (role.parentRoleId === null) continue;
    const list = children.get(role.parentRoleId) ?? [];
    list.push(role.id);
    children.set(role.parentRoleId, list);
  }
  const out = new Set<string>();
  const queue = [roleId];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const child of children.get(current) ?? []) {
      if (out.has(child)) continue;
      out.add(child);
      queue.push(child);
    }
  }
  return out;
}

/**
 * Users in a group, breadth-first with a visited set (cycle-safe). `usersByRole` maps a role id
 * to the users holding it.
 */
export function resolveGroupUsers(
  groupId: string,
  groupMembers: readonly AccessGroupMemberRow[],
  roles: readonly AccessRoleRow[],
  usersByRole: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const users = new Set<string>();
  const seenGroups = new Set<string>([groupId]);
  const queue = [groupId];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const member of groupMembers) {
      if (member.groupId !== current) continue;
      if (member.kind === "user") users.add(member.memberId);
      else if (member.kind === "role") {
        for (const u of usersByRole.get(member.memberId) ?? []) users.add(u);
      } else if (member.kind === "role_and_subordinates") {
        for (const u of usersByRole.get(member.memberId) ?? []) users.add(u);
        for (const r of descendantRoleIds(roles, member.memberId)) {
          for (const u of usersByRole.get(r) ?? []) users.add(u);
        }
      } else if (!seenGroups.has(member.memberId)) {
        seenGroups.add(member.memberId);
        queue.push(member.memberId);
      }
    }
  }
  return users;
}

/** Nesting depth of a group: 1 for a group without subgroups. Infinity on a cycle. */
export function groupDepth(
  groupId: string,
  groupMembers: readonly AccessGroupMemberRow[],
  path: readonly string[] = [],
): number {
  if (path.includes(groupId)) return Number.POSITIVE_INFINITY;
  let deepest = 0;
  for (const m of groupMembers) {
    if (m.groupId === groupId && m.kind === "group") {
      deepest = Math.max(deepest, groupDepth(m.memberId, groupMembers, [...path, groupId]));
    }
  }
  return deepest + 1;
}

/**
 * Validates the whole group graph after a change. Rejects cycles and nesting deeper than
 * {@link MAX_GROUP_DEPTH} (counting the outermost group as depth 1).
 */
export function assertGroupGraph(groupMembers: readonly AccessGroupMemberRow[]): void {
  const groupIds = new Set(groupMembers.map((m) => m.groupId));
  for (const id of groupIds) {
    const depth = groupDepth(id, groupMembers);
    if (depth === Number.POSITIVE_INFINITY) {
      throw new ValidationError({ members: ["A group cannot contain itself."] });
    }
    if (depth > MAX_GROUP_DEPTH) {
      throw new ValidationError({
        members: [`Groups can be nested at most ${MAX_GROUP_DEPTH} levels deep.`],
      });
    }
  }
}
