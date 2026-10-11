import { expect, test } from "vitest";
import {
  buildContactsBusinessCardFields,
  buildContactsDetailSections,
  formatContactsAddress,
} from "./contacts-detail-sections";
import { contactField, contactMetadata, contactRecord } from "./test-metadata";

test("uses service business-card order and visibility instead of hardcoding fields", () => {
  const fields = [
    contactField("Department"),
    contactField("Email"),
    contactField("Phone", { views: { view: false, create: true, edit: true, quickCreate: false } }),
  ];
  const metadata = {
    ...contactMetadata(fields),
    businessCardFields: ["Email", "Phone", "Department", "Missing"],
  };
  expect(
    buildContactsBusinessCardFields(
      metadata,
      contactRecord({ Email: null, Department: "Sample", Phone: "123" }),
    ).map((row) => [row.field.apiName, row.value]),
  ).toEqual([
    ["Email", null],
    ["Department", "Sample"],
  ]);
});
test("uses layout columns, audit timestamps, and full-width description", () => {
  const metadata = {
    ...contactMetadata([
      contactField("Full_Name"),
      contactField("Owner"),
      contactField("Created_By"),
      contactField("Description"),
    ]),
    layout: [
      { label: "Contact Image", columnCount: 1, columns: [[]], fields: [] },
      {
        label: "Contact Information",
        columnCount: 2,
        columns: [["Owner", "Created_By"], ["Full_Name"]],
        fields: ["Owner", "Created_By", "Full_Name"],
      },
      {
        label: "Description Information",
        columnCount: 1,
        columns: [["Description"]],
        fields: ["Description"],
      },
    ],
  };
  const sections = buildContactsDetailSections(
    metadata,
    contactRecord({
      Full_Name: "Sample Person",
      Owner: null,
      Created_By: "sample-user",
      Created_Time: "2026-01-01T00:00:00Z",
      Description: null,
    }),
  );
  expect(sections.map((section) => section.title)).toEqual([
    "Contact Information",
    "Description Information",
  ]);
  expect(sections[0]?.fields.map((entry) => [entry.column, entry.field.label])).toEqual([
    ["left", "Owner"],
    ["left", "Created_By"],
    ["right", "Contact Name"],
  ]);
  expect(sections[0]?.fields[1]?.auditTimestamp).toBe("2026-01-01T00:00:00Z");
  expect(sections[1]?.fields[0]?.column).toBe("full");
});
test("renders separate address composites without duplicating component fields", () => {
  const names = ["Mailing_Address", "Mailing_City", "Other_Address", "Other_Country"];
  const metadata = {
    ...contactMetadata(names.map((name) => contactField(name))),
    layout: [
      {
        label: "Address Information",
        columnCount: 2,
        columns: [names.slice(0, 2), names.slice(2)],
        fields: names,
      },
    ],
  };
  const record = contactRecord({
    Mailing_City: "Sample City",
    Other_Country: "Sample Country",
    Mailing_Latitude: 10,
  });
  expect(formatContactsAddress(record, "Mailing")).toBe("Sample City");
  expect(
    buildContactsDetailSections(metadata, record)[0]?.fields.map((entry) => [
      entry.column,
      entry.value,
    ]),
  ).toEqual([
    ["left", "Sample City"],
    ["right", "Sample Country"],
  ]);
});
