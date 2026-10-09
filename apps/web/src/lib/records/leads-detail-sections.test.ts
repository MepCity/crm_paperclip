import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import { buildLeadsBusinessCardFields, buildLeadsDetailSections } from "./leads-detail-sections";

const ctx = {
  orgId: "sections-org",
  orgSlug: "sections-org",
  orgName: "Sections Org",
  userId: "sections-user",
  role: "admin" as const,
};

async function defaultLeadsViewId(service: ReturnType<typeof createFixtureRecordService>) {
  const view = (await service.listViews("Leads")).find((item) => item.isDefault);
  if (!view) throw new Error("Missing default view.");
  return view.id;
}

describe("buildLeadsDetailSections", () => {
  it("orders sections from layout and filters view-visible fields", async () => {
    const service = createFixtureRecordService(ctx);
    const module = await service.getModule("Leads");
    const page = await service.list("Leads", {
      viewId: await defaultLeadsViewId(service),
      page: 1,
      perPage: 10,
    });
    const record = page.records[0];
    if (!record) throw new Error("Missing seed record.");
    const sections = buildLeadsDetailSections(module, record);
    expect(sections.map((section) => section.title)).toEqual([
      "Lead Information",
      "Address Information",
      "Description Information",
    ]);
    const leadInfo = sections[0];
    if (!leadInfo) throw new Error("Missing Lead Information section.");
    const apiNames = leadInfo.fields.map((entry) => entry.field.apiName);
    expect(apiNames).toContain("Designation");
    expect(apiNames).not.toContain("Record_Image");
    const fullName = leadInfo.fields.find((entry) => entry.field.apiName === "Full_Name");
    expect(fullName?.field.label).toBe("Lead Name");
    expect(leadInfo.fields.every((entry) => entry.field.views.view)).toBe(true);
  });

  it("renders Address Information as one composite row", async () => {
    const service = createFixtureRecordService(ctx);
    const module = await service.getModule("Leads");
    const page = await service.list("Leads", {
      viewId: await defaultLeadsViewId(service),
      page: 1,
      perPage: 10,
    });
    const base = page.records[0];
    if (!base) throw new Error("Missing seed record.");
    const record = {
      ...base,
      fields: {
        ...base.fields,
        Country: "United States",
        Street: "1 Main St",
        City: "Metro",
      },
    };
    const addressSection = buildLeadsDetailSections(module, record).find(
      (section) => section.title === "Address Information",
    );
    if (!addressSection?.fields[0]) throw new Error("Missing address row.");
    expect(addressSection.fields).toHaveLength(1);
    expect(addressSection.fields[0].column).toBe("full");
    expect(addressSection.fields[0].value).toBe("United States, 1 Main St, Metro");
  });
});

describe("buildLeadsBusinessCardFields", () => {
  it("follows businessCardFields order", async () => {
    const service = createFixtureRecordService(ctx);
    const module = await service.getModule("Leads");
    const page = await service.list("Leads", {
      viewId: await defaultLeadsViewId(service),
      page: 1,
      perPage: 10,
    });
    const record = page.records[0];
    if (!record) throw new Error("Missing seed record.");
    const fields = buildLeadsBusinessCardFields(module, record);
    expect(fields.map((entry) => entry.field.apiName)).toEqual([
      "Owner",
      "Email",
      "Phone",
      "Mobile",
      "Lead_Status",
    ]);
  });
});
