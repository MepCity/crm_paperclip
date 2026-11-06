import { ForbiddenError } from "../errors";
import { MANAGED_SYSTEM_FIELDS, type ModuleApiName } from "./catalogue";
import { descendantRoleIds, resolveGroupUsers } from "./groups";
import {
  ACCESS_LEVELS,
  type AccessData,
  type AccessLevel,
  type AccessSnapshot,
  type DefaultAccess,
  type FieldAccessMode,
  type ModuleAction,
  type RecordOperation,
  type SubjectKind,
} from "./types";

const rank = (level: AccessLevel): number => ACCESS_LEVELS.indexOf(level);

export function maxLevel(a: AccessLevel, b: AccessLevel): AccessLevel {
  return rank(a) >= rank(b) ? a : b;
}

export function defaultToLevel(value: DefaultAccess): AccessLevel {
  switch (value) {
    case "private":
      return "none";
    case "public_read":
      return "read";
    case "public_read_write":
      return "read_write";
    case "public_read_write_delete":
      return "read_write_delete";
  }
}

/** Does `have` satisfy what `operation` needs? read -> R, edit -> RW, delete -> RWD. */
export function levelAllows(have: AccessLevel, operation: RecordOperation): boolean {
  const need: AccessLevel =
    operation === "read" ? "read" : operation === "edit" ? "read_write" : "read_write_delete";
  return rank(have) >= rank(need);
}

/** 4.1 Profile gate. Module actions other than view also require view. */
export function can(snapshot: AccessSnapshot, module: string, action: ModuleAction): boolean {
  if (snapshot.profileKind === "administrator") return true;
  const entry = (snapshot.permissions.modules as Record<string, Record<ModuleAction, boolean>>)[
    module
  ];
  if (!entry) return false;
  if (action === "view") return entry.view;
  return entry.view && entry[action];
}

/** Throws `permission_denied` (403) when the profile does not allow the action. */
export function assertCan(snapshot: AccessSnapshot, module: string, action: ModuleAction): void {
  if (!can(snapshot, module, action)) throw new ForbiddenError(undefined, "permission_denied");
}

/** 4.2 Field security. Administrator is fixed read_write; managed system fields are never hidden. */
export function fieldAccess(
  snapshot: AccessSnapshot,
  module: string,
  field: string,
): FieldAccessMode {
  if (snapshot.profileKind === "administrator") return "read_write";
  const stored = snapshot.fieldAccess.get(module)?.get(field) ?? "read_write";
  if (stored === "hidden" && MANAGED_SYSTEM_FIELDS.includes(field)) return "read_only";
  return stored;
}

/** Throws `field_forbidden` (403) unless the field may be used for `use`. */
export function assertFieldUsable(
  snapshot: AccessSnapshot,
  module: string,
  field: string,
  use: "read" | "write",
): void {
  const mode = fieldAccess(snapshot, module, field);
  if (mode === "hidden" || (use === "write" && mode === "read_only")) {
    throw new ForbiddenError(undefined, "field_forbidden");
  }
}

/** 4.3 level 3: the level the viewer gets on records owned by `ownerId`. */
export function ownerLevels(
  snapshot: AccessSnapshot,
  module: string,
): ReadonlyMap<string, AccessLevel> {
  return snapshot.ownerLevels.get(module) ?? new Map();
}

/**
 * 4.3 Record access level: the maximum of view-all/modify-all, ownership, hierarchy/peers/rules
 * and the module default. Child modules pass the parent's level through {@link childRecordLevel}.
 */
export function recordLevel(
  snapshot: AccessSnapshot,
  module: string,
  ownerId: string | null | undefined,
): AccessLevel {
  if (snapshot.profileKind === "administrator") return "read_write_delete";
  const admin = snapshot.permissions.admin;
  const m = module as ModuleApiName;
  if (admin.modifyAllRecords.includes(m)) return "read_write_delete";
  let level: AccessLevel = admin.viewAllRecords.includes(m) ? "read" : "none";
  if (ownerId) {
    if (ownerId === snapshot.userId) return "read_write_delete";
    level = maxLevel(level, ownerLevels(snapshot, module).get(ownerId) ?? "none");
  }
  return maxLevel(level, snapshot.defaults.get(module) ?? "none");
}

/**
 * 4.3 item 5: Notes/Attachments/line items follow the parent level; an author keeps RWD on
 * their own note when the parent is at least readable.
 */
export function childRecordLevel(parentLevel: AccessLevel, isAuthor: boolean): AccessLevel {
  return isAuthor && parentLevel !== "none" ? "read_write_delete" : parentLevel;
}

/** Profile gate AND record level (§1): neither alone grants anything. */
export function canOnRecord(
  snapshot: AccessSnapshot,
  module: string,
  action: Exclude<ModuleAction, "create">,
  ownerId: string | null | undefined,
): boolean {
  const op: RecordOperation = action === "view" ? "read" : action === "edit" ? "edit" : "delete";
  return can(snapshot, module, action) && levelAllows(recordLevel(snapshot, module, ownerId), op);
}

/**
 * Owner ids visible with at least `operation` for a module: input of the query predicate
 * `default >= R OR Owner IN (...)` (ADR 0017 §6). `null` means "everything" (view-all /
 * modify-all / administrator / default is enough).
 */
export function visibleOwnerIds(
  snapshot: AccessSnapshot,
  module: string,
  operation: RecordOperation = "read",
): { all: true } | { all: false; owners: string[] } {
  if (snapshot.profileKind === "administrator") return { all: true };
  const admin = snapshot.permissions.admin;
  const m = module as ModuleApiName;
  if (admin.modifyAllRecords.includes(m)) return { all: true };
  if (operation === "read" && admin.viewAllRecords.includes(m)) return { all: true };
  if (levelAllows(snapshot.defaults.get(module) ?? "none", operation)) return { all: true };
  const owners = [snapshot.userId];
  for (const [owner, level] of ownerLevels(snapshot, module)) {
    if (levelAllows(level, operation)) owners.push(owner);
  }
  return { all: false, owners: [...new Set(owners)] };
}

function subjectUsers(
  kind: SubjectKind,
  id: string,
  data: AccessData,
  usersByRole: ReadonlyMap<string, readonly string[]>,
  memo: Map<string, Set<string>>,
): Set<string> {
  const key = `${kind}:${id}`;
  const cached = memo.get(key);
  if (cached) return cached;
  const resolved = resolveSubject(kind, id, data, usersByRole);
  memo.set(key, resolved);
  return resolved;
}

function resolveSubject(
  kind: SubjectKind,
  id: string,
  data: AccessData,
  usersByRole: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  if (kind === "group") return resolveGroupUsers(id, data.groupMembers, data.roles, usersByRole);
  const users = new Set(usersByRole.get(id) ?? []);
  if (kind === "role_and_subordinates") {
    for (const r of descendantRoleIds(data.roles, id)) {
      for (const u of usersByRole.get(r) ?? []) users.add(u);
    }
  }
  return users;
}

/** Pure snapshot construction (ADR 0017 §4.3 and §5). */
export function buildAccessSnapshot(data: AccessData): AccessSnapshot {
  const me = data.members.find((m) => m.userId === data.userId);
  const roleId = me?.roleId ?? "";
  const usersByRole = new Map<string, string[]>();
  for (const member of data.members) {
    const list = usersByRole.get(member.roleId) ?? [];
    list.push(member.userId);
    usersByRole.set(member.roleId, list);
  }

  const fieldAccess = new Map<string, Map<string, FieldAccessMode>>();
  for (const row of data.fieldRows) {
    const inner = fieldAccess.get(row.module) ?? new Map<string, FieldAccessMode>();
    inner.set(row.field, row.access);
    fieldAccess.set(row.module, inner);
  }

  const defaults = new Map<string, AccessLevel>();
  for (const row of data.defaults) defaults.set(row.module, defaultToLevel(row.level));

  const subordinateRoles = descendantRoleIds(data.roles, roleId);
  const subordinateUserIds = new Set<string>();
  for (const r of subordinateRoles)
    for (const u of usersByRole.get(r) ?? []) subordinateUserIds.add(u);

  const myRole = data.roles.find((r) => r.id === roleId);
  const peerIds = new Set<string>();
  if (myRole?.shareWithPeers) {
    for (const u of usersByRole.get(roleId) ?? []) if (u !== data.userId) peerIds.add(u);
  }

  const base = new Map<string, AccessLevel>();
  for (const u of subordinateUserIds) base.set(u, "read_write_delete");
  for (const u of peerIds) base.set(u, "read_write_delete");

  const memo = new Map<string, Set<string>>();
  const ownerLevelsByModule = new Map<string, Map<string, AccessLevel>>();
  const rulesByModule = new Map<string, (typeof data.rules)[number][]>();
  for (const rule of data.rules) {
    const list = rulesByModule.get(rule.module) ?? [];
    list.push(rule);
    rulesByModule.set(rule.module, list);
  }
  const modules = new Set<string>([
    ...rulesByModule.keys(),
    ...defaults.keys(),
    ...(Object.keys(data.profile.permissions.modules) as string[]),
  ]);
  for (const module of modules) {
    const levels = new Map(base);
    for (const rule of rulesByModule.get(module) ?? []) {
      const targets = subjectUsers(rule.targetKind, rule.targetId, data, usersByRole, memo);
      if (!targets.has(data.userId)) continue;
      for (const owner of subjectUsers(rule.sourceKind, rule.sourceId, data, usersByRole, memo)) {
        levels.set(owner, maxLevel(levels.get(owner) ?? "none", rule.level));
      }
    }
    ownerLevelsByModule.set(module, levels);
  }

  return {
    orgId: data.orgId,
    userId: data.userId,
    version: data.version,
    profileId: data.profile.id,
    profileName: data.profile.name,
    profileKind: data.profile.kind,
    permissions: data.profile.permissions,
    fieldAccess,
    roleId,
    ownerLevels: ownerLevelsByModule,
    defaults,
    subordinateUserIds,
  };
}
