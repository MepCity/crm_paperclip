import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";
import { expect, test } from "vitest";
import { formatFieldValue } from "@/components/records/field-format";
import { DEFAULT_FORMAT } from "@/lib/locale";
import {
  buildTasksBusinessCardFields,
  buildTasksDetailSections,
  TASKS_BUSINESS_CARD_FIELDS,
  taskRelatedToSuffix,
} from "./tasks-detail-sections";

function taskField(apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
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

function taskRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "test-task-1", fields };
}

function taskMetadata(
  fields: readonly FieldDefinition[] = [],
  extra: Partial<ModuleMetadata> = {},
): ModuleMetadata {
  return {
    apiName: "Tasks",
    singularLabel: "Task",
    pluralLabel: "Tasks",
    fields,
    businessCardFields: [],
    layout: [],
    ...extra,
  };
}

test("builds business card in the order: Priority, Due Date, Status, Related To, Task Owner (TD-36 – TD-40)", () => {
  const metadata = taskMetadata([
    taskField("Priority", { label: "Priority", dataType: "picklist" }),
    taskField("Due_Date", { label: "Due Date", dataType: "date" }),
    taskField("Status", { label: "Status", dataType: "picklist" }),
    taskField("What_Id", { label: "Related To", dataType: "lookup", lookup: { module: "Deals" } }),
    taskField("Owner", { label: "Task Owner", dataType: "ownerlookup" }),
  ]);

  const record = taskRecord({
    Priority: "High",
    Due_Date: "2026-12-31",
    Status: "In Progress",
    What_Id: { id: "deal-1", name: "Sample Deal", module: "Deals" },
    Owner: "user-1",
  });

  const fields = buildTasksBusinessCardFields(metadata, record);

  expect(fields.map((f) => f.field.apiName)).toEqual([
    "Priority",
    "Due_Date",
    "Status",
    "What_Id",
    "Owner",
  ]);

  expect(fields.map((f) => f.value)).toEqual([
    "High",
    "2026-12-31",
    "In Progress",
    { id: "deal-1", name: "Sample Deal", module: "Deals" },
    "user-1",
  ]);

  expect(TASKS_BUSINESS_CARD_FIELDS).toEqual([
    "Priority",
    "Due_Date",
    "Status",
    "What_Id",
    "Owner",
  ]);
});

test("business card fields render Priority and Status without colored badge and What_Id as link", () => {
  const priorityField = taskField("Priority", { label: "Priority", dataType: "picklist" });
  const statusField = taskField("Status", { label: "Status", dataType: "picklist" });
  const whatIdField = taskField("What_Id", {
    label: "Related To",
    dataType: "lookup",
    lookup: { module: "Deals" },
  });

  const metadata = taskMetadata([priorityField, statusField, whatIdField]);
  const record = taskRecord({
    Priority: "Normal",
    Status: "In Progress",
    What_Id: { id: "deal-1", name: "Commercial Press", module: "Deals" },
  });

  const fields = buildTasksBusinessCardFields(metadata, record);
  const byApi = new Map(fields.map((f) => [f.field.apiName, f]));

  // Values are plain text / objects (no badge markup or status ribbon)
  expect(byApi.get("Priority")?.value).toBe("Normal");
  expect(byApi.get("Status")?.value).toBe("In Progress");

  // formatFieldValue renders picklists as plain text (kind: text, no badge)
  const formattedPriority = formatFieldValue(priorityField, "Normal", {}, DEFAULT_FORMAT);
  expect(formattedPriority).toEqual({ kind: "text", text: "Normal" });

  const formattedStatus = formatFieldValue(statusField, "In Progress", {}, DEFAULT_FORMAT);
  expect(formattedStatus).toEqual({ kind: "text", text: "In Progress" });

  // What_Id formats as link (kind: link)
  const formattedWhatId = formatFieldValue(
    whatIdField,
    { id: "deal-1", name: "Commercial Press", module: "Deals" },
    {},
    DEFAULT_FORMAT,
  );
  expect(formattedWhatId.kind).toBe("link");
  if (formattedWhatId.kind === "link") {
    expect(formattedWhatId.link.text).toBe("Commercial Press");
  }
});

test("builds detail sections with Task Information and Description Information in single column", () => {
  const metadata: ModuleMetadata = {
    ...taskMetadata([
      taskField("Owner", { label: "Task Owner", dataType: "ownerlookup" }),
      taskField("Subject", { label: "Subject", dataType: "text" }),
      taskField("Due_Date", { label: "Due Date", dataType: "date" }),
      taskField("Who_Id", {
        label: "Contact Name",
        dataType: "lookup",
        lookup: { module: "Contacts" },
      }),
      taskField("What_Id", {
        label: "Related To",
        dataType: "lookup",
        lookup: { module: "Deals" },
      }),
      taskField("Status", { label: "Status", dataType: "picklist" }),
      taskField("Created_By", { label: "Created By", dataType: "ownerlookup" }),
      taskField("Created_Time", { label: "Created Time", dataType: "datetime" }),
      taskField("Description", { label: "Description", dataType: "textarea" }),
    ]),
    layout: [
      {
        label: "Task Image",
        columnCount: 1,
        columns: [[]],
        fields: [],
      },
      {
        label: "Task Information",
        columnCount: 1,
        columns: [["Owner", "Subject", "Due_Date", "Who_Id", "What_Id", "Status", "Created_By"]],
        fields: ["Owner", "Subject", "Due_Date", "Who_Id", "What_Id", "Status", "Created_By"],
      },
      {
        label: "Description Information",
        columnCount: 1,
        columns: [["Description"]],
        fields: ["Description"],
      },
    ],
  };

  const record = taskRecord({
    Owner: "user-1",
    Subject: "Review Agreement",
    Due_Date: "2026-11-15",
    Who_Id: { id: "contact-1", name: "Alice Smith", module: "Contacts" },
    What_Id: { id: "deal-1", name: "Acme Corp Deal", module: "Deals" },
    Status: "In Progress",
    Created_By: "admin",
    Created_Time: "2026-10-10T10:00:00Z",
    Description: "Detailed task description",
  });

  const sections = buildTasksDetailSections(metadata, record);
  expect(sections.map((s) => s.title)).toEqual(["Task Information", "Description Information"]);

  const taskInfoFields = sections[0]?.fields ?? [];
  // First 5 fields must match TD-42 – TD-46: Owner, Subject, Due_Date, Who_Id, What_Id
  expect(taskInfoFields.slice(0, 5).map((f) => f.field.apiName)).toEqual([
    "Owner",
    "Subject",
    "Due_Date",
    "Who_Id",
    "What_Id",
  ]);

  // All single-column fields in Task Information are assigned to column "left"
  for (const field of taskInfoFields) {
    expect(field.column).toBe("left");
  }

  // Audit timestamp mapped for Created_By
  const createdByField = taskInfoFields.find((f) => f.field.apiName === "Created_By");
  expect(createdByField?.auditTimestamp).toBe("2026-10-10T10:00:00Z");

  // Description section has column "full"
  const descFields = sections[1]?.fields ?? [];
  expect(descFields[0]?.column).toBe("full");
  expect(descFields[0]?.value).toBe("Detailed task description");

  // Who_Id and What_Id are lookup link fields (TD-45, TD-46)
  const whoIdEntry = taskInfoFields.find((f) => f.field.apiName === "Who_Id");
  expect(whoIdEntry).toBeDefined();
  expect(whoIdEntry?.field.dataType).toBe("lookup");
  if (whoIdEntry) {
    const formattedWho = formatFieldValue(whoIdEntry.field, whoIdEntry.value, {}, DEFAULT_FORMAT);
    expect(formattedWho.kind).toBe("link");
  }

  const whatIdEntry = taskInfoFields.find((f) => f.field.apiName === "What_Id");
  expect(whatIdEntry).toBeDefined();
  expect(whatIdEntry?.field.dataType).toBe("lookup");
  if (whatIdEntry) {
    const formattedWhat = formatFieldValue(
      whatIdEntry.field,
      whatIdEntry.value,
      {},
      DEFAULT_FORMAT,
    );
    expect(formattedWhat.kind).toBe("link");
  }
});

test("taskRelatedToSuffix generates unlinked module suffix for What_Id", () => {
  // Deals
  expect(
    taskRelatedToSuffix(
      taskRecord({
        What_Id: { id: "deal-1", name: "Sample Deal", module: "Deals" },
      }),
    ),
  ).toBe("- Deals");

  // Accounts
  expect(
    taskRelatedToSuffix(
      taskRecord({
        What_Id: { id: "acc-1", name: "Acme Corp", module: "Accounts" },
      }),
    ),
  ).toBe("- Accounts");

  // Contacts
  expect(
    taskRelatedToSuffix(
      taskRecord({
        What_Id: { id: "con-1", name: "Alice", module: "Contacts" },
      }),
    ),
  ).toBe("- Contacts");

  // Campaigns (from known dictionary)
  expect(
    taskRelatedToSuffix(
      taskRecord({
        What_Id: { id: "camp-1", name: "Autumn Promo", module: "Campaigns" },
      }),
    ),
  ).toBe("- Campaigns");

  // Missing or empty What_Id
  expect(taskRelatedToSuffix(taskRecord({}))).toBeUndefined();
  expect(taskRelatedToSuffix(taskRecord({ What_Id: null }))).toBeUndefined();
  expect(taskRelatedToSuffix(taskRecord({ What_Id: "" }))).toBeUndefined();
  expect(taskRelatedToSuffix(taskRecord({ What_Id: {} }))).toBeUndefined();
  expect(
    taskRelatedToSuffix(taskRecord({ What_Id: { id: "", name: "", module: "Deals" } })),
  ).toBeUndefined();
});
