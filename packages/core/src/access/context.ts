import { insideOrgTransaction, type OrgContext, withOrg } from "../tenancy";
import { loadAccessSnapshot as load, type SnapshotCache } from "./store";
import type { AccessSnapshot } from "./types";

/** Access snapshot of the signed-in user (cached by organisation, user and version). */
export function getAccessSnapshot(ctx: OrgContext, cache?: SnapshotCache): Promise<AccessSnapshot> {
  return load(ctx, { withOrg, cache, skipCacheWrite: insideOrgTransaction() });
}
