import { randomUUID } from "node:crypto";
import { expect, it, vi } from "vitest";

vi.mock("@crm/core/access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@crm/core/access")>()),
  getAccessSnapshot: vi.fn(async () => ({ profileKind: "administrator" })),
}));

// No database here: the approval observer fails closed without one (MEP-1518).
vi.mock("./approvals", () => ({
  getApprovals: () => ({
    writeObserver: () => ({ assertEditable: async () => {}, afterWrite: async () => {} }),
  }),
}));

import { getRecordService } from "./records";

it("selects the fixture adapter with the caller's organization and user context", async () => {
  const ctx = {
    orgId: randomUUID(),
    orgSlug: "synthetic",
    orgName: "Example Organization",
    userId: "example-user",
    role: "admin" as const,
  };
  const service = getRecordService(ctx);
  expect((await service.getModule("Leads")).fields).toHaveLength(56);
  const views = await service.listViews("Leads");
  const view = views.find((candidate) => candidate.isDefault);
  expect(view).toBeDefined();
  const before = await service.count("Leads", { viewId: view?.id ?? "" });
  const created = await service.create("Leads", {
    Last_Name: "Example Lead",
    Company: "Example Company",
  });
  expect(created.fields.Owner).toBe(ctx.userId);
  expect(await getRecordService(ctx).get("Leads", created.id)).toEqual(created);
  expect(await service.count("Leads", { viewId: view?.id ?? "" })).toBe(before + 1);
});
