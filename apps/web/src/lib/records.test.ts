import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
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
  const created = await service.create("Leads", {
    Last_Name: "Example Lead",
    Company: "Example Company",
  });
  expect(created.fields.Owner).toBe(ctx.userId);
  expect(await getRecordService(ctx).get("Leads", created.id)).toEqual(created);
  const views = await service.listViews("Leads");
  const view = views.find((view) => view.isDefault);
  expect(view).toBeDefined();
  expect(await service.count("Leads", { viewId: view?.id ?? "" })).toBe(251);
});
