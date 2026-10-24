import type { FieldDefinition, ModuleMetadata } from "../../contract";
import { contactRolesPicklists } from "./picklists";

const definitions: [string, string, FieldDefinition["dataType"], boolean, boolean][] = [
  ["Deal", "Deal", "lookup", true, false],
  ["Contact", "Contact", "lookup", true, false],
  ["Contact_Role", "Role Name", "picklist", false, false],
  ["Created_By", "Created By", "ownerlookup", false, true],
  ["Modified_By", "Modified By", "ownerlookup", false, true],
  ["Created_Time", "Created Time", "datetime", false, true],
  ["Modified_Time", "Modified Time", "datetime", false, true],
  ["id", "Record Id", "bigint", false, true],
];

export const contactRolesMetadata: ModuleMetadata = {
  apiName: "Contact_Roles",
  singularLabel: "Contact Role",
  pluralLabel: "Contact Roles",
  businessCardFields: [],
  fields: definitions.map(([apiName, label, dataType, required, readOnly]) => ({
    apiName,
    label,
    dataType,
    required,
    readOnly,
    unique: false,
    massUpdate: false,
    views: { view: true, create: !readOnly, edit: !readOnly, quickCreate: false },
    ...(dataType === "picklist" ? { picklist: contactRolesPicklists.Contact_Role } : {}),
    ...(apiName === "Deal" ? { lookup: { module: "Deals" } } : {}),
    ...(apiName === "Contact" ? { lookup: { module: "Contacts" } } : {}),
  })),
  layout: [
    {
      label: "Contact Role",
      columnCount: 1,
      columns: [definitions.map(([name]) => name)],
      fields: definitions.map(([name]) => name),
    },
  ],
};
