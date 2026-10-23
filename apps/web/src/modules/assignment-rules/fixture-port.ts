import type { AssignmentRulesPort } from "./port";

/** Synthetic empty snapshot; no reference data, persistence or shared mutable state. */
export function createSyntheticAssignmentRulesPort(orgId: string): AssignmentRulesPort {
  return {
    async list(ctx, query) {
      if (ctx.orgId !== orgId) return { ok: false, error: { code: "not_found" } };
      if (ctx.role !== "admin") return { ok: false, error: { code: "forbidden" } };
      if (
        query.kind !== "assignment" ||
        !Number.isInteger(query.limit) ||
        query.limit < 1 ||
        query.limit > 100 ||
        query.cursor !== undefined
      ) {
        return { ok: false, error: { code: "invalid_query" } };
      }
      return { ok: true, value: { items: [], nextCursor: null } };
    },
  };
}
