import type { FieldDefinition, ModuleMetadata } from "../../contract";

export const attachmentParentModules = [
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
  "Cases",
  "Solutions",
  "Notes",
] as const;
const field = (
  apiName: string,
  dataType: FieldDefinition["dataType"],
  required = false,
  maxLength = 120,
): FieldDefinition => ({
  apiName,
  label: apiName.replaceAll("_", " "),
  dataType,
  required,
  maxLength,
  readOnly: apiName === "id",
  unique: false,
  massUpdate: false,
  views: { view: true, create: true, edit: true, quickCreate: false },
});
export const attachmentsMetadata: ModuleMetadata = {
  apiName: "Attachments",
  singularLabel: "Attachment",
  pluralLabel: "Attachments",
  businessCardFields: [],
  layout: [],
  fields: [
    field("File_Name", "text", true, 100),
    field("Size", "bigint", true, 100),
    {
      ...field("Parent_Id", "lookup", true),
      lookup: { module: "Leads", modules: attachmentParentModules },
    },
    field("Owner", "ownerlookup"),
    ...["Created_By", "Modified_By"].map((name) => ({
      ...field(name, "ownerlookup"),
      views: { view: true, create: false, edit: false, quickCreate: false },
    })),
    ...["Created_Time", "Modified_Time"].map((name) => ({
      ...field(name, "datetime"),
      views: { view: true, create: false, edit: false, quickCreate: false },
    })),
    field("id", "bigint", false, 18),
    field("$type", "text"),
    field("$link_url", "text", false, 100),
  ],
};
