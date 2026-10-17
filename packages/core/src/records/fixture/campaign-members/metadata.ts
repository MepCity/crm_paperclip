import type { FieldDefinition, ModuleMetadata } from "../../contract";
import { campaignMemberStatuses } from "./picklists";

const definitions: [string, string, FieldDefinition["dataType"], boolean, boolean][] = [
  ["Campaign", "Campaign", "lookup", true, false],
  ["Lead", "Lead", "lookup", false, false],
  ["Contact", "Contact", "lookup", false, false],
  ["Member_Status", "Member Status", "picklist", false, false],
  ["Created_By", "Created By", "ownerlookup", false, true],
  ["Modified_By", "Modified By", "ownerlookup", false, true],
  ["Created_Time", "Created Time", "datetime", false, true],
  ["Modified_Time", "Modified Time", "datetime", false, true],
  ["id", "Record Id", "bigint", false, true],
];

export const campaignMembersMetadata: ModuleMetadata = {
  apiName: "Campaign_Members",
  singularLabel: "Campaign Member",
  pluralLabel: "Campaign Members",
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
    ...(dataType === "picklist"
      ? {
          picklist: campaignMemberStatuses.map((value) => ({
            displayValue: value,
            storedValue: value,
          })),
        }
      : {}),
    ...(apiName === "Campaign" ? { lookup: { module: "Campaigns" } } : {}),
    ...(apiName === "Lead" ? { lookup: { module: "Leads" } } : {}),
    ...(apiName === "Contact" ? { lookup: { module: "Contacts" } } : {}),
  })),
  layout: [
    {
      label: "Campaign Member",
      columnCount: 1,
      columns: [definitions.map(([name]) => name)],
      fields: definitions.map(([name]) => name),
    },
  ],
};
