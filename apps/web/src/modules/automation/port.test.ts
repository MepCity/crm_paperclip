import type { OrgContext } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { createAutomationPort } from "./port";

const ctx: OrgContext = {
  orgId: "synthetic-org",
  orgSlug: "synthetic",
  orgName: "Synthetic organization",
  userId: "synthetic-admin",
  role: "admin",
};
const empty = { ok: true, value: { items: [], nextCursor: null } };

describe("automation read port factory", () => {
  it.each(["assignment", "workflow"] as const)("returns an empty page for %s", async (kind) => {
    const port = createAutomationPort();
    expect(await port.list(ctx, { kind, limit: 50 })).toEqual(empty);
    expect(await port.list(ctx, { kind, module: "Leads", limit: 1 })).toEqual(empty);
  });
  it("exposes read methods only", () => {
    expect(Object.keys(createAutomationPort()).sort()).toEqual(["get", "list"]);
  });
  it("denies non-admin callers", async () => {
    expect(
      await createAutomationPort().list(
        { ...ctx, role: "member" },
        { kind: "assignment", limit: 50 },
      ),
    ).toEqual({ ok: false, error: { code: "forbidden" } });
  });
  it("treats another organization as empty", async () => {
    expect(
      await createAutomationPort().list(
        { ...ctx, orgId: "other-synthetic-org" },
        { kind: "assignment", limit: 50 },
      ),
    ).toEqual(empty);
  });
  it.each([0, -1, 101, 1.5, Number.NaN])("rejects invalid limit %s", async (limit) => {
    expect(await createAutomationPort().list(ctx, { kind: "assignment", limit })).toEqual({
      ok: false,
      error: { code: "invalid_query" },
    });
  });
  it("rejects unissued cursors", async () => {
    expect(
      await createAutomationPort().list(ctx, { kind: "assignment", limit: 5, cursor: "x" }),
    ).toEqual({ ok: false, error: { code: "invalid_query" } });
  });
  it("get on a missing rule is not found", async () => {
    expect(await createAutomationPort().get(ctx, { kind: "workflow", id: "none" })).toEqual({
      ok: false,
      error: { code: "not_found" },
    });
  });
});
