import type { OrgContext } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { createSyntheticAssignmentRulesPort } from "./fixture-port";

const ctx: OrgContext = {
  orgId: "synthetic-org",
  orgSlug: "synthetic",
  orgName: "Synthetic organization",
  userId: "synthetic-admin",
  role: "admin",
};
const query = { kind: "assignment", limit: 50 } as const;

describe("synthetic assignment read port", () => {
  it("returns an empty successful page and defensive copies without writes", async () => {
    const port = createSyntheticAssignmentRulesPort(ctx.orgId);
    const first = await port.list(ctx, query);
    const second = await port.list(ctx, query);
    expect(first).toEqual({ ok: true, value: { items: [], nextCursor: null } });
    expect(second).toEqual(first);
    if (!first.ok || !second.ok) throw new Error("Expected empty pages");
    expect(first.value).not.toBe(second.value);
    expect(first.value.items).not.toBe(second.value.items);
    expect(Object.keys(port)).toEqual(["list"]);
    expect(await createSyntheticAssignmentRulesPort(ctx.orgId).list(ctx, query)).toEqual(first);
  });
  it("withholds foreign snapshots and denies non-admin callers", async () => {
    const port = createSyntheticAssignmentRulesPort(ctx.orgId);
    expect(await port.list({ ...ctx, orgId: "other-synthetic-org" }, query)).toEqual({
      ok: false,
      error: { code: "not_found" },
    });
    expect(await port.list({ ...ctx, role: "member" }, query)).toEqual({
      ok: false,
      error: { code: "forbidden" },
    });
  });
  it.each([0, -1, 101, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid limit %s",
    async (limit) => {
      expect(
        await createSyntheticAssignmentRulesPort(ctx.orgId).list(ctx, { ...query, limit }),
      ).toEqual({
        ok: false,
        error: { code: "invalid_query" },
      });
    },
  );
  it("rejects unissued cursors and accepts module-filtered empty reads", async () => {
    const port = createSyntheticAssignmentRulesPort(ctx.orgId);
    expect(await port.list(ctx, { ...query, cursor: "unissued" })).toEqual({
      ok: false,
      error: { code: "invalid_query" },
    });
    expect(await port.list(ctx, { ...query, module: "Leads", limit: 1 })).toEqual({
      ok: true,
      value: { items: [], nextCursor: null },
    });
  });
});
