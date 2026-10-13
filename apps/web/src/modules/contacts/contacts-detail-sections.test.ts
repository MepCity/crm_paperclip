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

const testCtx = {
  orgId: "test-org",
  orgSlug: "test-org",
  orgName: "Test Org",
  userId: "user-1",
  role: "admin" as const,
};

test("Contact Information balances two columns matching reference CRM with phone call icon", async () => {
  const { createFixtureRecordService } = await import("@crm/core/records/fixture");
  const metadata = await createFixtureRecordService(testCtx).getModule("Contacts");
  const record = contactRecord({
    Owner: "user-1",
    First_Name: "Sample",
    Last_Name: "Person",
    Full_Name: "Sample Person",
    Account_Name: { module: "Accounts", id: "acc-1", name: "Account One" },
    Email: "person@example.com",
    Phone: "555-1234",
    Other_Phone: "555-5678",
    Mobile: "555-9012",
    Assistant: "Assistant Name",
    Lead_Source: "Web",
    Vendor_Name: "Vendor One",
    Title: "Manager",
    Department: "Sales",
    Home_Phone: "555-3456",
    Fax: "555-7890",
    Date_of_Birth: "1990-01-01",
    Asst_Phone: "555-2345",
    Email_Opt_Out: false,
    Skype_ID: "skype-sample",
    Secondary_Email: "sec@example.com",
    Twitter: "@sample",
    Reporting_To: null,
  });

  const sections = buildContactsDetailSections(metadata, record);
  const infoSection = sections.find((s) => s.title === "Contact Information");
  expect(infoSection).toBeDefined();

  const leftFields = infoSection?.fields.filter((f) => f.column === "left") ?? [];
  const rightFields = infoSection?.fields.filter((f) => f.column === "right") ?? [];

  // Left column order and labels:
  // Contact Owner, Account Name, Email, Phone, Other Phone, Mobile, Assistant
  expect(leftFields.map((f) => f.field.label)).toEqual([
    "Contact Owner",
    "Account Name",
    "Email",
    "Phone",
    "Other Phone",
    "Mobile",
    "Assistant",
  ]);
  expect(leftFields.map((f) => f.field.apiName)).toEqual([
    "Owner",
    "Account_Name",
    "Email",
    "Phone",
    "Other_Phone",
    "Mobile",
    "Assistant",
  ]);

  // Right column order and labels (first nine fields matching reference CRM):
  // Lead Source, Contact Name, Vendor Name, Title, Department, Home Phone, Fax, Date of Birth, Asst Phone
  expect(rightFields.slice(0, 9).map((f) => f.field.label)).toEqual([
    "Lead Source",
    "Contact Name",
    "Vendor Name",
    "Title",
    "Department",
    "Home Phone",
    "Fax",
    "Date of Birth",
    "Asst Phone",
  ]);
  expect(rightFields.slice(0, 9).map((f) => f.field.apiName)).toEqual([
    "Lead_Source",
    "Full_Name",
    "Vendor_Name",
    "Title",
    "Department",
    "Home_Phone",
    "Fax",
    "Date_of_Birth",
    "Asst_Phone",
  ]);

  // Phone on left column has callAction when Phone is populated
  const phoneLeft = leftFields.find((f) => f.field.apiName === "Phone");
  expect(phoneLeft?.callAction).toBe(true);

  // Business card Phone also has callAction
  const cardFields = buildContactsBusinessCardFields(metadata, record);
  const phoneCard = cardFields.find((f) => f.field.apiName === "Phone");
  expect(phoneCard?.callAction).toBe(true);
});

test("omits callAction when Phone value is empty in summary card and details", async () => {
  const { createFixtureRecordService } = await import("@crm/core/records/fixture");
  const metadata = await createFixtureRecordService(testCtx).getModule("Contacts");
  const record = contactRecord({
    Phone: null,
    Mobile: "555-9012",
  });

  const sections = buildContactsDetailSections(metadata, record);
  const infoSection = sections.find((s) => s.title === "Contact Information");
  const leftFields = infoSection?.fields.filter((f) => f.column === "left") ?? [];
  const phoneLeft = leftFields.find((f) => f.field.apiName === "Phone");
  expect(phoneLeft?.callAction).toBeUndefined();

  const cardFields = buildContactsBusinessCardFields(metadata, record);
  const phoneCard = cardFields.find((f) => f.field.apiName === "Phone");
  expect(phoneCard?.callAction).toBeUndefined();
});
