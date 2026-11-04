import type {
  FieldDefinition,
  LayoutSection,
  ListView,
  ModuleMetadata,
  PicklistOption,
} from "../contract";
import { organisationTaxes, taxLabel } from "../tax";
import { accountsPicklists } from "./accounts/picklists";

export interface ExportTable {
  fields: readonly Omit<FieldDefinition, "picklist">[];
  layout: readonly LayoutSection[];
  picklists: Readonly<Record<string, readonly PicklistOption[]>>;
  views: readonly ListView[];
}

const taxOptions: readonly PicklistOption[] = organisationTaxes.map((tax) => ({
  displayValue: taxLabel(tax),
  storedValue: tax.name,
}));

/** Builds the published metadata of a module from its sanitized export table. */
export function buildExportModule(
  table: ExportTable,
  names: { apiName: string; singularLabel: string; pluralLabel: string },
  businessCardFields: readonly string[] = [],
) {
  const picklists: Record<string, readonly PicklistOption[]> = {
    ...table.picklists,
    Billing_Country: accountsPicklists.Billing_Country ?? [],
    Billing_State: accountsPicklists.Billing_State ?? [],
    Shipping_Country: accountsPicklists.Billing_Country ?? [],
    Shipping_State: accountsPicklists.Billing_State ?? [],
    Tax: taxOptions,
    Header_Tax: taxOptions,
  };
  const metadata: ModuleMetadata = {
    ...names,
    businessCardFields,
    fields: table.fields.map((field) => {
      const picklist = picklists[field.apiName];
      const wants = field.dataType === "picklist" || field.dataType === "multiselectpicklist";
      return {
        ...field,
        ...(field.apiName === "Tag" ||
        field.dataType === "multiselectpicklist" ||
        field.dataType === "subform"
          ? { acceptsJsonArray: true }
          : {}),
        ...(wants && picklist ? { picklist } : {}),
      } as FieldDefinition;
    }),
    layout: table.layout,
  };
  return { metadata, picklists, views: table.views };
}
