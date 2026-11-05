import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { NotFoundError } from "../errors";
import type { OrgContext, Transaction } from "../tenancy/types";
import { parseStoredPermissions } from "./catalogue";
import { buildAccessSnapshot } from "./evaluate";
import type {
  AccessData,
  AccessSnapshot,
  DefaultAccess,
  GroupMemberKind,
  ProfileKind,
  SharingLevel,
  StoredFieldAccess,
  SubjectKind,
} from "./types";

export const SNAPSHOT_CACHE_MAX = 2000;
export const SNAPSHOT_CACHE_TTL_MS = 10 * 60 * 1000;

type Entry = { snapshot: AccessSnapshot; expiresAt: number };

/** Small in-process LRU keyed by (orgId, userId, version) with a TTL backstop (ADR 0017 §5). */
export class SnapshotCache {
  private readonly entries = new Map<string, Entry>();
  constructor(
    private readonly max = SNAPSHOT_CACHE_MAX,
    private readonly ttlMs = SNAPSHOT_CACHE_TTL_MS,
    private readonly now: () => number = Date.now,
  ) {}

  static key(orgId: string, userId: string, version: number): string {
    return `${orgId}:${userId}:${version}`;
  }

  get(orgId: string, userId: string, version: number): AccessSnapshot | undefined {
    const key = SnapshotCache.key(orgId, userId, version);
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.snapshot;
  }

  set(snapshot: AccessSnapshot): void {
    const key = SnapshotCache.key(snapshot.orgId, snapshot.userId, snapshot.version);
    this.entries.delete(key);
    this.entries.set(key, { snapshot, expiresAt: this.now() + this.ttlMs });
    while (this.entries.size > this.max) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  get size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }
}

export const snapshotCache = new SnapshotCache();

/** Reads every row the engine needs for one user (7 small queries, one transaction). */
export async function loadAccessData(
  tx: Transaction,
  orgId: string,
  userId: string,
): Promise<AccessData> {
  const [versionRow] = await tx
    .select({ version: schema.accessVersions.version })
    .from(schema.accessVersions)
    .where(eq(schema.accessVersions.organizationId, orgId));
  const members = await tx
    .select({
      userId: schema.memberAccess.userId,
      roleId: schema.memberAccess.roleId,
      profileId: schema.memberAccess.profileId,
    })
    .from(schema.memberAccess)
    .where(eq(schema.memberAccess.organizationId, orgId));
  const me = members.find((m) => m.userId === userId);
  if (!me) throw new NotFoundError();
  const [profile] = await tx
    .select()
    .from(schema.accessProfiles)
    .where(
      and(
        eq(schema.accessProfiles.organizationId, orgId),
        eq(schema.accessProfiles.id, me.profileId),
      ),
    );
  if (!profile) throw new NotFoundError();
  const fieldRows = await tx
    .select()
    .from(schema.accessFieldPermissions)
    .where(
      and(
        eq(schema.accessFieldPermissions.organizationId, orgId),
        eq(schema.accessFieldPermissions.profileId, me.profileId),
      ),
    );
  const roles = await tx
    .select()
    .from(schema.accessRoles)
    .where(eq(schema.accessRoles.organizationId, orgId));
  const groupMembers = await tx
    .select()
    .from(schema.accessGroupMembers)
    .where(eq(schema.accessGroupMembers.organizationId, orgId));
  const defaults = await tx
    .select()
    .from(schema.accessModuleDefaults)
    .where(eq(schema.accessModuleDefaults.organizationId, orgId));
  const rules = await tx
    .select()
    .from(schema.accessSharingRules)
    .where(eq(schema.accessSharingRules.organizationId, orgId));
  return {
    orgId,
    userId,
    version: versionRow?.version ?? 0,
    profile: {
      id: profile.id,
      name: profile.name,
      kind: profile.kind as ProfileKind,
      permissions: parseStoredPermissions(profile.permissions),
    },
    fieldRows: fieldRows.map((r) => ({
      module: r.module,
      field: r.fieldApiName,
      access: r.access as StoredFieldAccess,
    })),
    roles: roles.map((r) => ({
      id: r.id,
      name: r.name,
      parentRoleId: r.parentRoleId,
      shareWithPeers: r.shareWithPeers,
    })),
    members,
    groupMembers: groupMembers.map((g) => ({
      groupId: g.groupId,
      kind: g.memberKind as GroupMemberKind,
      memberId: g.memberId,
    })),
    defaults: defaults.map((d) => ({ module: d.module, level: d.level as DefaultAccess })),
    rules: rules.map((r) => ({
      id: r.id,
      module: r.module,
      sourceKind: r.sourceKind as SubjectKind,
      sourceId: r.sourceId,
      targetKind: r.targetKind as SubjectKind,
      targetId: r.targetId,
      level: r.level as SharingLevel,
    })),
  };
}

type LoadDeps = {
  /** Opens an organisation-scoped transaction (`withOrg`), injected to avoid an import cycle. */
  withOrg: <T>(ctx: OrgContext, work: (tx: Transaction) => Promise<T>) => Promise<T>;
  cache?: SnapshotCache;
};

/**
 * Snapshot of the signed-in user. A cache hit costs no query: the version rides on the
 * membership query of `requireOrgContext` (`ctx.accessVersion`). Without a version (older
 * callers) the snapshot is built and keyed by the version read in the same transaction.
 */
export async function loadAccessSnapshot(ctx: OrgContext, deps: LoadDeps): Promise<AccessSnapshot> {
  const cache = deps.cache ?? snapshotCache;
  if (typeof ctx.accessVersion === "number") {
    const hit = cache.get(ctx.orgId, ctx.userId, ctx.accessVersion);
    if (hit) return hit;
  }
  const snapshot = await deps.withOrg(ctx, async (tx) =>
    buildAccessSnapshot(await loadAccessData(tx, ctx.orgId, ctx.userId)),
  );
  cache.set(snapshot);
  return snapshot;
}
