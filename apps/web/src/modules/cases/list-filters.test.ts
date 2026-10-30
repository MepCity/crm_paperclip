import { expect, test } from "vitest";
import { buildCasesFilterGroups, casesFilterGroups } from "./list-filters";
import { caseField } from "./test-metadata";

test("Cases system rows are exactly the six reference rows in order (KL-17 - KL-22)", () => {
  expect(casesFilterGroups[0]?.items.map((row) => row.label)).toEqual([
    "Latest Email Status",
    "Locked",
    "Record Action",
    "Related Records Action",
    "Touched Records",
    "Untouched Records",
  ]);
  expect(casesFilterGroups[0]?.items).toHaveLength(6);
  expect(casesFilterGroups[0]?.items[0]?.laterModule).toBe("M10");
});

test("Cases field rows follow KL-24 - KL-31 then DOM-only catalogue, then alphabetical", () => {
  const groups = buildCasesFilterGroups({
    fields: [
      caseField("Subject", { label: "Subject" }),
      caseField("Status", { label: "Status", dataType: "picklist" }),
      caseField("Priority", { label: "Priority", dataType: "picklist" }),
      caseField("Case_Origin", { label: "Case Origin", dataType: "picklist" }),
      caseField("Case_Reason", { label: "Case Reason", dataType: "picklist" }),
      caseField("Product_Name", { label: "Product Name", dataType: "lookup" }),
      caseField("Connected_To__s", { label: "Connected To", dataType: "multi_module_lookup" }),
      caseField("Tag", { label: "Tag" }),
      caseField("Description", { label: "Description", dataType: "textarea" }),
      caseField("Comments", { label: "Comments", dataType: "text" }),
    ],
    users: [{ userId: "u1", name: "User 1" }],
    linkField: "Subject",
    currencyCode: "TRY",
  });

  const labels = groups[1]?.items.map((row) => row.label) ?? [];
  expect(labels.slice(0, 8)).toEqual([
    "Account Name",
    "Case Number",
    "Case Origin",
    "Case Owner",
    "Case Reason",
    "Connected To",
    "Created By",
    "Created Time",
  ]);

  expect(labels.slice(8, 23)).toEqual([
    "Deal Name",
    "Email",
    "Last Activity Time",
    "Modified By",
    "Modified Time",
    "No. of comments",
    "Phone",
    "Priority",
    "Product Name",
    "Related To",
    "Reported By",
    "Status",
    "Subject",
    "Tag",
    "Type",
  ]);

  // Remaining metadata fields appended alphabetically
  expect(labels.slice(23)).toEqual(["Comments", "Description"]);

  const items = groups[1]?.items ?? [];
  expect(items.find((i) => i.id === "Connected_To__s")?.editor?.fieldType).toBe("multilookup");
  expect(items.find((i) => i.id === "Tag")?.editor?.fieldType).toBe("tag");
  expect(items.find((i) => i.id === "Status")?.editor?.fieldType).toBe("picklist");

  // Product Name has laterModule="P2" and no text-match editor
  const productItem = items.find((i) => i.id === "Product_Name");
  expect(productItem?.laterModule).toBe("P2");
  expect(productItem?.editor).toBeUndefined();
  expect(productItem?.disabled).toBe(true);
});

test("Cases Filter By Related Modules has Calls, Emails, Meetings, Notes, Tasks with laterModule", () => {
  const relatedGroup = casesFilterGroups[2];
  expect(relatedGroup?.id).toBe("related");
  expect(relatedGroup?.label).toBe("Filter By Related Modules");
  expect(relatedGroup?.items.map((i) => i.label)).toEqual([
    "Calls",
    "Emails",
    "Meetings",
    "Notes",
    "Tasks",
  ]);
  expect(relatedGroup?.items.map((i) => i.laterModule)).toEqual([
    undefined,
    "M10",
    undefined,
    undefined,
    undefined,
  ]);
  expect(relatedGroup?.items.map((i) => i.relatedModule?.module)).toEqual([
    "Calls",
    undefined,
    "Meetings",
    "Notes",
    "Tasks",
  ]);
});

test("Cases enables five system editors, keeps email deferred and maps Meetings to Events", () => {
  const rows = casesFilterGroups[0]?.items ?? [];
  expect(rows[0]?.laterModule).toBe("M10");
  expect(rows.slice(1).map((row) => row.systemEditor)).toEqual([
    "locked",
    "record_action",
    "related_records_action",
    "touched",
    "untouched",
  ]);
  expect(rows.slice(1).every((row) => !row.disabled && !row.laterModule)).toBe(true);
  expect(
    rows.find((row) => row.systemEditor === "related_records_action")?.systemOptions
      ?.relatedModules,
  ).toEqual([
    { id: "Notes", label: "Notes" },
    { id: "Attachments", label: "Attachments" },
    { id: "Tasks", label: "Tasks" },
    { id: "Events", label: "Meetings" },
    { id: "Calls", label: "Calls" },
  ]);
});
