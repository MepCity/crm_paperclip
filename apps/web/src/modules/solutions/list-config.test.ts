import { expect, test } from "vitest";
import { solutionsListPageConfig } from "./list-config";

test("list config names the link column, labels and Actions rows for Solutions", () => {
  expect(solutionsListPageConfig).toMatchObject({
    module: "Solutions",
    linkField: "Solution_Title",
    pluralLabel: "Solutions",
    createLabel: "Create Solution",
    filterTitle: "Filter Solutions by",
    pinnedViews: ["All Solutions"],
    badgeColumn: false,
  });
  expect(solutionsListPageConfig.sortFieldLabels).toContain("Solution Title");
  expect(solutionsListPageConfig.sortFieldLabels).toContain("Solution Number");
  const rows = solutionsListPageConfig.inventory?.actions.map((a) => a.label);
  expect(rows).toEqual([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Create Client Script",
    "Export Solutions",
    "Sheet view",
    "Print View",
  ]);
  // No Mass Email or Approve Solutions in Solutions actions
  expect(rows).not.toContain("Mass Email");
  expect(rows).not.toContain("Approve Solutions");

  const manageTags = solutionsListPageConfig.inventory?.actions.find((a) => a.id === "tags");
  expect(manageTags?.laterModule).toBeUndefined();
  const exportItem = solutionsListPageConfig.inventory?.actions.find((a) => a.id === "export");
  expect(exportItem).toEqual({ id: "export", label: "Export Solutions" });
  const clientScript = solutionsListPageConfig.inventory?.actions.find(
    (a) => a.id === "client-script",
  );
  expect(clientScript?.laterModule).toBe("M11");
  const sheet = solutionsListPageConfig.inventory?.actions.find((a) => a.id === "sheet");
  expect(sheet?.laterModule).toBe("P3");
});
