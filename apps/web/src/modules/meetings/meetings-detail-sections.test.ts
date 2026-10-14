import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";
import { expect, test } from "vitest";
import { formatFieldValue } from "@/components/records/field-format";
import { DEFAULT_FORMAT } from "@/lib/locale";
import {
  buildMeetingsBusinessCardFields,
  buildMeetingsDetailSections,
  MEETINGS_BUSINESS_CARD_FIELDS,
  meetingRelatedToSuffix,
} from "./meetings-detail-sections";

// ---------------------------------------------------------------------------
// Local test helpers (metadata is set up in this file; no shared test-metadata)
// ---------------------------------------------------------------------------

function meetingField(apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...extra,
  };
}

function meetingRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "test-meeting-1", fields };
}

function meetingMetadata(
  fields: readonly FieldDefinition[] = [],
  extra: Partial<ModuleMetadata> = {},
): ModuleMetadata {
  return {
    apiName: "Events",
    singularLabel: "Meeting",
    pluralLabel: "Meetings",
    fields,
    businessCardFields: [],
    layout: [],
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Business card — field order
// ---------------------------------------------------------------------------

test("builds business card in order: Start_DateTime, End_DateTime, All_day, Meeting_Venue__s, Venue, Owner, What_Id, Who_Id", () => {
  const metadata = meetingMetadata([
    meetingField("Start_DateTime", { label: "From", dataType: "datetime" }),
    meetingField("End_DateTime", { label: "To", dataType: "datetime" }),
    meetingField("All_day", { label: "All day", dataType: "boolean" }),
    meetingField("Meeting_Venue__s", { label: "Meeting Venue", dataType: "picklist" }),
    meetingField("Venue", { label: "Location", dataType: "text" }),
    meetingField("Owner", { label: "Host", dataType: "ownerlookup" }),
    meetingField("What_Id", {
      label: "Related To",
      dataType: "lookup",
      lookup: { module: "Accounts" },
    }),
    meetingField("Who_Id", {
      label: "Contact Name",
      dataType: "lookup",
      lookup: { module: "Contacts" },
    }),
  ]);

  const record = meetingRecord({
    Start_DateTime: "2026-11-01T10:00:00Z",
    End_DateTime: "2026-11-01T11:00:00Z",
    All_day: false,
    Meeting_Venue__s: "Zoom",
    Venue: "Conference Room A",
    Owner: "user-1",
    What_Id: { id: "acc-1", name: "Acme Corp", module: "Accounts" },
    Who_Id: { id: "con-1", name: "Alice Smith", module: "Contacts" },
  });

  const fields = buildMeetingsBusinessCardFields(metadata, record);

  expect(fields.map((f) => f.field.apiName)).toEqual([
    "Start_DateTime",
    "End_DateTime",
    "All_day",
    "Meeting_Venue__s",
    "Venue",
    "Owner",
    "What_Id",
    "Who_Id",
  ]);

  expect(MEETINGS_BUSINESS_CARD_FIELDS).toEqual([
    "Start_DateTime",
    "End_DateTime",
    "All_day",
    "Meeting_Venue__s",
    "Venue",
    "Owner",
    "What_Id",
    "Who_Id",
  ]);
});

// ---------------------------------------------------------------------------
// Business card — link fields (MD-39, MD-45)
// ---------------------------------------------------------------------------

test("What_Id and Who_Id are formatted as record links in the business card (MD-39, MD-45)", () => {
  const whatIdField = meetingField("What_Id", {
    label: "Related To",
    dataType: "lookup",
    lookup: { module: "Accounts" },
  });
  const whoIdField = meetingField("Who_Id", {
    label: "Contact Name",
    dataType: "lookup",
    lookup: { module: "Contacts" },
  });

  const metadata = meetingMetadata([whatIdField, whoIdField]);
  const record = meetingRecord({
    What_Id: { id: "acc-1", name: "Globex Corp", module: "Accounts" },
    Who_Id: { id: "con-1", name: "Bob Jones", module: "Contacts" },
  });

  const fields = buildMeetingsBusinessCardFields(metadata, record);
  const byApi = new Map(fields.map((f) => [f.field.apiName, f]));

  const formattedWhat = formatFieldValue(
    whatIdField,
    byApi.get("What_Id")?.value ?? null,
    {},
    DEFAULT_FORMAT,
  );
  expect(formattedWhat.kind).toBe("link");
  if (formattedWhat.kind === "link") {
    expect(formattedWhat.link.text).toBe("Globex Corp");
  }

  const formattedWho = formatFieldValue(
    whoIdField,
    byApi.get("Who_Id")?.value ?? null,
    {},
    DEFAULT_FORMAT,
  );
  expect(formattedWho.kind).toBe("link");
  if (formattedWho.kind === "link") {
    expect(formattedWho.link.text).toBe("Bob Jones");
  }
});

// ---------------------------------------------------------------------------
// Business card — dash rules (All_day false/absent; empty Venue)
// ---------------------------------------------------------------------------

test("All_day row is included with value false (rendered as dash by renderer)", () => {
  const metadata = meetingMetadata([
    meetingField("All_day", { label: "All day", dataType: "boolean" }),
  ]);

  const record = meetingRecord({ All_day: false });
  const fields = buildMeetingsBusinessCardFields(metadata, record);
  const allDayEntry = fields.find((f) => f.field.apiName === "All_day");
  expect(allDayEntry).toBeDefined();
  expect(allDayEntry?.value).toBe(false);
});

test("All_day row is included with null value when absent in record (dash rule)", () => {
  const metadata = meetingMetadata([
    meetingField("All_day", { label: "All day", dataType: "boolean" }),
  ]);
  // field key exists in record but value is null
  const record = meetingRecord({ All_day: null });
  const fields = buildMeetingsBusinessCardFields(metadata, record);
  const allDayEntry = fields.find((f) => f.field.apiName === "All_day");
  expect(allDayEntry).toBeDefined();
  expect(allDayEntry?.value).toBeNull();
});

test("empty Venue renders null value (dash rule for empty Location)", () => {
  const metadata = meetingMetadata([
    meetingField("Venue", { label: "Location", dataType: "text" }),
  ]);
  const record = meetingRecord({ Venue: null });
  const fields = buildMeetingsBusinessCardFields(metadata, record);
  const venueEntry = fields.find((f) => f.field.apiName === "Venue");
  expect(venueEntry).toBeDefined();
  expect(venueEntry?.value).toBeNull();
});

// ---------------------------------------------------------------------------
// Business card — datetime formatting (From/To)
// ---------------------------------------------------------------------------

test("Start_DateTime and End_DateTime are formatted as datetime (DD.MM.YYYY hh:mm AM/PM)", () => {
  const startField = meetingField("Start_DateTime", { label: "From", dataType: "datetime" });
  const endField = meetingField("End_DateTime", { label: "To", dataType: "datetime" });

  const formattedStart = formatFieldValue(startField, "2026-11-01T10:00:00Z", {}, DEFAULT_FORMAT);
  const formattedEnd = formatFieldValue(endField, "2026-11-01T11:00:00Z", {}, DEFAULT_FORMAT);

  // formatFieldValue for datetime returns kind: "text" with a formatted string
  expect(formattedStart.kind).toBe("text");
  expect(formattedEnd.kind).toBe("text");
  if (formattedStart.kind === "text") {
    expect(typeof formattedStart.text).toBe("string");
    expect(formattedStart.text.length).toBeGreaterThan(0);
  }
});

// ---------------------------------------------------------------------------
// Detail sections
// ---------------------------------------------------------------------------

test("builds Meeting Information section with single-column fields (MD-41)", () => {
  const metadata: ModuleMetadata = {
    ...meetingMetadata([
      meetingField("Event_Title", { label: "Title", dataType: "text" }),
      meetingField("Meeting_Venue__s", { label: "Meeting Venue", dataType: "picklist" }),
      meetingField("Venue", { label: "Location", dataType: "text" }),
      meetingField("All_day", { label: "All day", dataType: "boolean" }),
      meetingField("Start_DateTime", { label: "From", dataType: "datetime" }),
      meetingField("End_DateTime", { label: "To", dataType: "datetime" }),
      meetingField("Owner", { label: "Host", dataType: "ownerlookup" }),
      meetingField("Who_Id", {
        label: "Contact Name",
        dataType: "lookup",
        lookup: { module: "Contacts" },
      }),
      meetingField("Created_By", { label: "Created By", dataType: "ownerlookup" }),
      meetingField("Created_Time", { label: "Created Time", dataType: "datetime" }),
      meetingField("What_Id", {
        label: "Related To",
        dataType: "lookup",
        lookup: { module: "Accounts" },
      }),
    ]),
    layout: [
      {
        label: "Meeting Information",
        columnCount: 1,
        columns: [
          [
            "Event_Title",
            "Meeting_Venue__s",
            "Venue",
            "All_day",
            "Start_DateTime",
            "End_DateTime",
            "Owner",
            "Who_Id",
            "Created_By",
            "What_Id",
          ],
        ],
        fields: [
          "Event_Title",
          "Meeting_Venue__s",
          "Venue",
          "All_day",
          "Start_DateTime",
          "End_DateTime",
          "Owner",
          "Who_Id",
          "Created_By",
          "What_Id",
        ],
      },
    ],
  };

  const record = meetingRecord({
    Event_Title: "Q4 Planning",
    Meeting_Venue__s: "Zoom",
    Venue: "Online",
    All_day: false,
    Start_DateTime: "2026-11-01T10:00:00Z",
    End_DateTime: "2026-11-01T11:00:00Z",
    Owner: "user-1",
    Who_Id: { id: "con-1", name: "Alice Smith", module: "Contacts" },
    Created_By: "admin",
    Created_Time: "2026-10-10T10:00:00Z",
    What_Id: { id: "acc-1", name: "Acme Corp", module: "Accounts" },
  });

  const sections = buildMeetingsDetailSections(metadata, record);
  expect(sections.map((s) => s.title)).toEqual(["Meeting Information"]);

  const infoFields = sections[0]?.fields ?? [];

  // All fields in single-column Meeting Information are assigned column "left"
  for (const entry of infoFields) {
    expect(entry.column).toBe("left");
  }

  // Audit timestamp mapped for Created_By
  const createdByEntry = infoFields.find((f) => f.field.apiName === "Created_By");
  expect(createdByEntry?.auditTimestamp).toBe("2026-10-10T10:00:00Z");

  // What_Id and Who_Id are lookup fields (MD-39, MD-45)
  const whoEntry = infoFields.find((f) => f.field.apiName === "Who_Id");
  expect(whoEntry?.field.dataType).toBe("lookup");
  const whatEntry = infoFields.find((f) => f.field.apiName === "What_Id");
  expect(whatEntry?.field.dataType).toBe("lookup");
});

test("Meeting Additional Information section fields are assigned column full", () => {
  const metadata: ModuleMetadata = {
    ...meetingMetadata([
      meetingField("Description", { label: "Description", dataType: "textarea" }),
    ]),
    layout: [
      {
        label: "Meeting Additional Information",
        columnCount: 1,
        columns: [["Description"]],
        fields: ["Description"],
      },
    ],
  };

  const record = meetingRecord({ Description: "Quarterly planning notes" });
  const sections = buildMeetingsDetailSections(metadata, record);
  const descFields = sections[0]?.fields ?? [];

  expect(descFields[0]?.column).toBe("full");
  expect(descFields[0]?.value).toBe("Quarterly planning notes");
});

// ---------------------------------------------------------------------------
// meetingRelatedToSuffix (MD-39 module suffix helper)
// ---------------------------------------------------------------------------

test("meetingRelatedToSuffix generates unlinked module suffix for What_Id", () => {
  // Accounts
  expect(
    meetingRelatedToSuffix(
      meetingRecord({ What_Id: { id: "acc-1", name: "Acme Corp", module: "Accounts" } }),
    ),
  ).toBe("Account");

  // Deals
  expect(
    meetingRelatedToSuffix(
      meetingRecord({ What_Id: { id: "deal-1", name: "Sample Deal", module: "Deals" } }),
    ),
  ).toBe("Deal");

  // Contacts
  expect(
    meetingRelatedToSuffix(
      meetingRecord({ What_Id: { id: "con-1", name: "Alice", module: "Contacts" } }),
    ),
  ).toBe("Contact");

  // Campaigns (from known dictionary)
  expect(
    meetingRelatedToSuffix(
      meetingRecord({ What_Id: { id: "camp-1", name: "Autumn Promo", module: "Campaigns" } }),
    ),
  ).toBe("Campaign");

  // Missing or empty What_Id
  expect(meetingRelatedToSuffix(meetingRecord({}))).toBeUndefined();
  expect(meetingRelatedToSuffix(meetingRecord({ What_Id: null }))).toBeUndefined();
  expect(meetingRelatedToSuffix(meetingRecord({ What_Id: "" }))).toBeUndefined();
  expect(meetingRelatedToSuffix(meetingRecord({ What_Id: {} }))).toBeUndefined();
  expect(
    meetingRelatedToSuffix(meetingRecord({ What_Id: { id: "", name: "", module: "Deals" } })),
  ).toBeUndefined();
});
