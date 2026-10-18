import { expect, test } from "vitest";
import {
  LEADS_LIST_CURRENCY_CODE,
  LEADS_MODULE,
  LEADS_SORT_FIELD_LABELS,
  leadsListPageConfig,
} from "./list-config";

test("defines Leads identity labels, default view and routes using the Full_Name link column", () => {
  expect(leadsListPageConfig.module).toBe(LEADS_MODULE);
  expect(leadsListPageConfig.module).toBe("Leads");
  expect(leadsListPageConfig.linkField).toBe("Full_Name");
  expect(leadsListPageConfig.linkFieldLabel).toBe("Lead Name");
  expect(leadsListPageConfig.singularLabel).toBe("Lead");
  expect(leadsListPageConfig.pluralLabel).toBe("Leads");
  expect(leadsListPageConfig.createLabel).toBe("Create Lead");
  expect(leadsListPageConfig.filterTitle).toBe("Filter Leads by");
  expect(leadsListPageConfig.filterGroups.length).toBeGreaterThan(0);
  expect(leadsListPageConfig.defaultPresentation).toBeUndefined();
  expect(leadsListPageConfig.activityRibbon).toBe(true);
  expect(LEADS_LIST_CURRENCY_CODE).toBe("TRY");

  expect(leadsListPageConfig.paths.defaultList("sample-org", "Leads")).toContain("/tab/Leads/list");
  expect(leadsListPageConfig.paths.customList("sample-org", "Leads", "v1")).toContain(
    "/tab/Leads/custom-view/v1/list",
  );
  expect(leadsListPageConfig.paths.record("sample-org", "Leads", "rec-1")).toContain(
    "/tab/Leads/rec-1",
  );
  expect(leadsListPageConfig.paths.create("sample-org", "Leads")).toContain("/tab/Leads/create");

  expect(leadsListPageConfig.sortFieldLabels).toBe(LEADS_SORT_FIELD_LABELS);
  expect(LEADS_SORT_FIELD_LABELS).toContain("Lead Name");
  expect(LEADS_SORT_FIELD_LABELS).toContain("Lead Status");
  expect(LEADS_SORT_FIELD_LABELS).toContain("Lead Source");
  expect(LEADS_SORT_FIELD_LABELS).toContain("Company");
  expect(LEADS_SORT_FIELD_LABELS).toContain("Annual Revenue");
  expect(LEADS_SORT_FIELD_LABELS).not.toContain("Contact Name");
  expect(LEADS_SORT_FIELD_LABELS).not.toContain("Deal Name");
  expect(LEADS_SORT_FIELD_LABELS).not.toContain("Account Name");
  expect(LEADS_SORT_FIELD_LABELS).toHaveLength(39);
});

test("keeps the Leads Actions menu inventory in reference order and assigns later modules", () => {
  const actions =
    leadsListPageConfig.toolbarActions ?? leadsListPageConfig.inventory?.actions ?? [];

  expect(actions.map((item) => item.label)).toEqual([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Mass Convert",
    "Manage Tags",
    "Assignment Rules",
    "Drafts",
    "Mass Email",
    "Approve Leads",
    "Deduplicate Leads",
    "Add to Campaigns",
    "Create Client Script",
    "Export Leads",
    "Sheet view",
    "Print View",
  ]);

  expect(actions.map((item) => item.id)).toEqual([
    "mass-transfer",
    "mass-delete",
    "mass-update",
    "mass-convert",
    "tags",
    "assignment-rules",
    "drafts",
    "mass-email",
    "approve",
    "deduplicate",
    "campaigns",
    "client-script",
    "export",
    "sheet",
    "print",
  ]);

  expect(actions.find((item) => item.id === "print")?.submenuIndicator).toBe(true);
  expect(actions.filter((item) => item.submenuIndicator).map((item) => item.id)).toEqual(["print"]);

  expect(actions.find((item) => item.id === "sheet")?.laterModule).toBe("P3");
  expect(actions.find((item) => item.id === "print")?.laterModule).toBe("M6");
  expect(actions.find((item) => item.id === "tags")?.laterModule).toBe("M11");
  expect(actions.find((item) => item.id === "assignment-rules")?.laterModule).toBe("M12");
  expect(actions.find((item) => item.id === "mass-email")?.laterModule).toBe("M10");
  expect(actions.find((item) => item.id === "approve")?.laterModule).toBe("P3");
  expect(actions.find((item) => item.id === "campaigns")?.laterModule).toBe("M7");
  expect(actions.find((item) => item.id === "client-script")?.laterModule).toBe("M11");
  expect(actions.find((item) => item.id === "export")?.laterModule).toBeUndefined();
});

test("verifies Leads-specific actions entries", () => {
  const actions =
    leadsListPageConfig.toolbarActions ?? leadsListPageConfig.inventory?.actions ?? [];

  const massConvert = actions.find((item) => item.id === "mass-convert");
  expect(massConvert).toEqual({ id: "mass-convert", label: "Mass Convert" });
  expect(massConvert?.laterModule).toBeUndefined();

  const assignmentRules = actions.find((item) => item.id === "assignment-rules");
  expect(assignmentRules).toEqual({
    id: "assignment-rules",
    label: "Assignment Rules",
    laterModule: "M12",
  });

  expect(actions.find((item) => item.id === "approve")?.label).toBe("Approve Leads");
  expect(actions.find((item) => item.id === "deduplicate")?.label).toBe("Deduplicate Leads");
  expect(actions.find((item) => item.id === "export")?.label).toBe("Export Leads");

  expect(actions.filter((item) => !item.laterModule).map((item) => item.id)).toEqual([
    "mass-transfer",
    "mass-delete",
    "mass-update",
    "mass-convert",
    "drafts",
    "deduplicate",
    "export",
  ]);
});
