import { expect, test } from "vitest";
import { casesListPageConfig } from "./list-config";

test("list config names the link column, labels and Actions rows for Cases", () => {
  expect(casesListPageConfig).toMatchObject({
    module: "Cases",
    linkField: "Subject",
    pluralLabel: "Cases",
    createLabel: "Create Case",
    filterTitle: "Filter Cases by",
    pinnedViews: ["All Cases"],
    badgeColumn: false,
  });
  expect(casesListPageConfig.sortFieldLabels).toContain("Subject");
  expect(casesListPageConfig.sortFieldLabels).toContain("Case Number");
  const rows = casesListPageConfig.inventory?.actions.map((a) => a.label);
  expect(rows).toEqual([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Mass Email",
    "Approve Cases",
    "Create Client Script",
    "Export Cases",
    "Sheet view",
    "Print View",
  ]);
  const massEmail = casesListPageConfig.inventory?.actions.find((a) => a.id === "mass-email");
  expect(massEmail?.laterModule).toBe("M10");
  const approve = casesListPageConfig.inventory?.actions.find((a) => a.id === "approve");
  expect(approve?.laterModule).toBe("P3");
  const sheet = casesListPageConfig.inventory?.actions.find((a) => a.id === "sheet");
  expect(sheet?.laterModule).toBe("P3");
});
