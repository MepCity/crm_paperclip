import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import { massUpdateFieldsInLayoutOrder } from "./mass-update-fields";

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Org",
  userId: "user-1",
  role: "admin" as const,
};

describe("massUpdateFieldsInLayoutOrder", () => {
  it("returns only massUpdate fields in layout order without duplicates", async () => {
    const metadata = await createFixtureRecordService(ctx).getModule("Leads");
    const fields = massUpdateFieldsInLayoutOrder(metadata);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.every((field) => field.massUpdate)).toBe(true);
    const apiNames = fields.map((field) => field.apiName);
    expect(new Set(apiNames).size).toBe(apiNames.length);
    const layoutOrder = metadata.layout.flatMap((section) =>
      section.columns.flatMap((column) => column.flat()),
    );
    const firstMass = layoutOrder.find((name) =>
      metadata.fields.some((field) => field.apiName === name && field.massUpdate),
    );
    expect(fields[0]?.apiName).toBe(firstMass);
  });
});
