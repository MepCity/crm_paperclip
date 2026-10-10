import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import { buildLeadsFilterGroups } from "./list-filters";

const ctx = {
  orgId: "org-test",
  orgSlug: "org-test",
  orgName: "Org",
  userId: "user-1",
  role: "admin" as const,
};

describe("buildLeadsFilterGroups", () => {
  it("maps labels to metadata fields and fills picklist and owner options", async () => {
    const service = createFixtureRecordService(ctx);
    const module = await service.getModule("Leads");
    const users = [{ userId: "user-1", name: "Sample User", email: "sample@example.test" }];
    const groups = buildLeadsFilterGroups({
      fields: module.fields,
      users,
      linkField: "Full_Name",
      currencyCode: "TRY",
    });
    const fieldGroup = groups.find((group) => group.id === "fields");
    expect(fieldGroup).toBeTruthy();
    const company = fieldGroup?.items.find((item) => item.label === "Company");
    expect(company?.disabled).toBeFalsy();
    expect(company?.id).toBe("Company");
    expect(company?.editor?.fieldType).toBe("text");

    const leadName = fieldGroup?.items.find((item) => item.label === "Lead Name");
    expect(leadName?.id).toBe("Full_Name");
    expect(leadName?.editor?.fieldType).toBe("text");

    const leadSource = fieldGroup?.items.find((item) => item.label === "Lead Source");
    expect(leadSource?.editor?.fieldType).toBe("picklist");
    expect(leadSource?.editor?.options?.length).toBeGreaterThan(0);
    expect(leadSource?.editor?.options?.[0]).toEqual(
      expect.objectContaining({ id: expect.any(String), label: expect.any(String) }),
    );

    const owner = fieldGroup?.items.find((item) => item.label === "Lead Owner");
    expect(owner?.editor?.fieldType).toBe("ownerlookup");
    expect(owner?.editor?.options).toEqual([
      { id: "user-1", label: "Sample User", detail: "sample@example.test" },
    ]);

    const revenue = fieldGroup?.items.find((item) => item.label === "Annual Revenue");
    expect(revenue?.editor?.currencyCode).toBe("TRY");
  });

  it("enables observed Website and integer fields and keeps unresolved types disabled", async () => {
    const service = createFixtureRecordService(ctx);
    const module = await service.getModule("Leads");
    const groups = buildLeadsFilterGroups({
      fields: module.fields,
      users: [],
      linkField: "Full_Name",
      currencyCode: "TRY",
    });
    const items = groups.find((group) => group.id === "fields")?.items ?? [];
    expect(items.find((item) => item.label === "Tag")?.editor?.fieldType).toBe("tag");
    expect(items.find((item) => item.label === "Website")?.editor?.fieldType).toBe("website");
    expect(items.find((item) => item.label === "No. of Employees")?.editor?.fieldType).toBe(
      "integer",
    );
    expect(items.find((item) => item.label === "Connected To")?.editor?.fieldType).toBe(
      "multilookup",
    );
    expect(items.find((item) => item.label === "Address")?.editor?.fieldType).toBe(
      "compound_address",
    );
  });
});
