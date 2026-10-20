import { expect, test } from "vitest";
import { buildSolutionsFilterGroups, solutionsFilterGroups } from "./list-filters";
import { solutionField } from "./test-metadata";

test("Solutions system rows are exactly the five reference rows in order (SL-17 - SL-21), no Latest Email Status", () => {
  expect(solutionsFilterGroups[0]?.items.map((row) => row.label)).toEqual([
    "Locked",
    "Record Action",
    "Related Records Action",
    "Touched Records",
    "Untouched Records",
  ]);
  expect(solutionsFilterGroups[0]?.items).toHaveLength(5);
  expect(solutionsFilterGroups[0]?.items.map((i) => i.label)).not.toContain("Latest Email Status");
});

test("Solutions field rows follow SL-23 - SL-31 then alphabetical remaining", () => {
  const groups = buildSolutionsFilterGroups({
    fields: [
      solutionField("Solution_Title", { label: "Solution Title" }),
      solutionField("Status", { label: "Status", dataType: "picklist" }),
      solutionField("Product_Name", { label: "Product Name", dataType: "lookup" }),
      solutionField("Connected_To__s", { label: "Connected To", dataType: "multi_module_lookup" }),
      solutionField("Tag", { label: "Tag" }),
      solutionField("Question", { label: "Question", dataType: "textarea" }),
      solutionField("Answer", { label: "Answer", dataType: "textarea" }),
    ],
    users: [{ userId: "u1", name: "User 1" }],
    linkField: "Solution_Title",
    currencyCode: "TRY",
  });

  const labels = groups[1]?.items.map((row) => row.label) ?? [];
  expect(labels.slice(0, 9)).toEqual([
    "Connected To",
    "Created By",
    "Created Time",
    "Last Activity Time",
    "Modified By",
    "Modified Time",
    "No. of comments",
    "Product Name",
    "Solution Number",
  ]);

  // Remaining metadata fields appended alphabetically
  expect(labels.slice(9)).toEqual(["Answer", "Question", "Solution Title", "Status", "Tag"]);

  const items = groups[1]?.items ?? [];
  expect(items.find((i) => i.id === "Connected_To__s")?.editor?.fieldType).toBe("multilookup");
  expect(items.find((i) => i.id === "Tag")?.editor?.fieldType).toBe("tag");
  expect(items.find((i) => i.id === "Status")?.editor?.fieldType).toBe("picklist");

  // Product Name is a Products (P2) lookup: it filters by text match
  const productItem = items.find((i) => i.id === "Product_Name");
  expect(productItem?.laterModule).toBeUndefined();
  expect(productItem?.editor?.fieldType).toBe("lookup");
  expect(productItem?.disabled).toBeUndefined();
});

test("Solutions has no Filter By Related Modules group", () => {
  expect(solutionsFilterGroups).toHaveLength(2);
  expect(solutionsFilterGroups.map((g) => g.id)).toEqual(["system", "fields"]);
});
