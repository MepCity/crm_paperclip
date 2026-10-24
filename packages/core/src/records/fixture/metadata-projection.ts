import { InMemoryCustomizationAdapter } from "../../customization/memory";
import { viewWithApiNames } from "../../customization/resolver";
import type { CustomizationPort, ModuleBaseline } from "../../customization/types";
import { NotFoundError } from "../../errors";
import type { Criteria, ModuleReadProjection } from "../contract";
import { baselineFieldId, baselineLayoutId } from "../metadata";
import { fixtureModules } from "./registry";

export function fixtureMetadataBaselines(): ModuleBaseline[] {
  return Object.entries(fixtureModules).map(([module, bundle]): ModuleBaseline => {
    const { metadata } = bundle;
    const ids = new Map(
      metadata.fields.map((field) => [field.apiName, baselineFieldId(field.apiName)]),
    );
    // This explicitly declared legacy criterion is not a field or a column.
    const externalCriteriaFields = [
      "Leads",
      "Contacts",
      "Accounts",
      "Deals",
      "Campaigns",
      "Cases",
      "Solutions",
    ].includes(module)
      ? ["Common_Status"]
      : module === "Events"
        ? ["Host_or_Participant"]
        : [];
    const fieldId = (name: string) => {
      const id = ids.get(name);
      if (!id) throw new Error(`Unknown baseline field reference: ${module}.${name}`);
      return id;
    };
    const criteria = (value: Criteria): Criteria =>
      "group" in value
        ? { ...value, group: value.group.map(criteria) }
        : {
            ...value,
            field: externalCriteriaFields.includes(value.field)
              ? value.field
              : fieldId(value.field),
          };
    const placed = new Set<string>();
    return {
      apiName: module,
      version: "v1",
      singularLabel: metadata.singularLabel,
      pluralLabel: metadata.pluralLabel,
      fields: metadata.fields.map((field) => ({
        ...field,
        id: fieldId(field.apiName),
        lifecycle: "active" as const,
        customizable: ["label", "required", "readOnly", "maxLength", "picklist", "views"] as const,
        systemRequired: field.required,
        serverValue:
          (module === "Attachments" &&
            ["File_Name", "Size", "Parent_Id"].includes(field.apiName)) ||
          bundle.managedFields.has(field.apiName) ||
          field.readOnly ||
          field.dataType === "ownerlookup",
      })),
      layouts: [
        {
          id: baselineLayoutId(module),
          label: "Default",
          isDefault: true,
          sections: metadata.layout.map((section, index) => ({
            id: `${module}:section:${index}`,
            label: section.label,
            columnCount: section.columnCount,
            fields: section.fields.map(fieldId),
            columns: section.columns.map((column) =>
              column
                .filter((name) => {
                  // Calls has repeated legacy placement; membership remains unchanged.
                  if (module === "Calls" && name === "Description" && placed.has(name))
                    return false;
                  placed.add(name);
                  return true;
                })
                .map(fieldId),
            ),
          })),
        },
      ],
      views: bundle.views.map((view) => ({
        ...view,
        columns: view.columns.map(fieldId),
        criteria: view.criteria ? criteria(view.criteria) : null,
        sort: view.sort ? { ...view.sort, field: fieldId(view.sort.field) } : null,
      })),
      externalCriteriaFields,
      reservedApiNames: [],
      customFieldTypes: [
        "text",
        "textarea",
        "email",
        "phone",
        "website",
        "picklist",
        "integer",
        "currency",
        "boolean",
        "date",
        "datetime",
        "double",
        "bigint",
      ],
      supportedColumnCounts: [
        ...new Set([1, 2, ...metadata.layout.map((section) => section.columnCount)]),
      ],
      capabilities: module === "Attachments" ? { layouts: false } : {},
      engineCapabilities: {},
    };
  });
}

let adapter: InMemoryCustomizationAdapter | undefined;
/** Shared ephemeral publication port; no HTTP mutation is exposed by slice B. */
export function fixtureCustomizationPort(): InMemoryCustomizationAdapter {
  adapter ??= new InMemoryCustomizationAdapter(fixtureMetadataBaselines());
  return adapter;
}

export async function readFixtureModuleProjection(
  orgId: string,
  module: string,
  port?: CustomizationPort,
): Promise<ModuleReadProjection> {
  const bundle = Object.hasOwn(fixtureModules, module) ? fixtureModules[module] : undefined;
  if (!bundle) throw new NotFoundError("Module not found.");
  try {
    const effective = await (port ?? fixtureCustomizationPort()).readEffective(orgId, module);
    const baselineIds = new Set(
      bundle.metadata.fields.map((field) => baselineFieldId(field.apiName)),
    );
    const fields = effective.fields
      .filter((field) => field.lifecycle === "active")
      .map(({ lifecycle: _, ...field }) => ({
        ...field,
        custom: !baselineIds.has(field.id),
      }));
    const apiNames = new Map(fields.map((field) => [field.id, field.apiName]));
    const apiName = (id: string) => {
      const name = apiNames.get(id);
      if (!name) throw new Error("Unresolved effective field reference.");
      return name;
    };
    const layout = effective.layouts[0];
    if (!layout || effective.layouts.length !== 1 || !layout.isDefault)
      throw new Error("Missing default layout.");
    return {
      apiName: effective.apiName,
      singularLabel: effective.singularLabel,
      pluralLabel: effective.pluralLabel,
      businessCardFields: bundle.metadata.businessCardFields.filter((name) =>
        fields.some((field) => field.apiName === name),
      ),
      fields,
      layoutId: layout.id,
      revision: `${effective.baselineVersion}:${effective.revision}`,
      // Preserve legacy wire placement only when the snapshot inherits layout.
      layout: effective.inheritsBaselineLayouts
        ? structuredClone(bundle.metadata.layout)
        : layout.sections.map((section) => ({
            label: section.label,
            columnCount: section.columnCount,
            columns: section.columns.map((column) => column.map(apiName)),
            fields: section.fields.map(apiName),
          })),
      views: effective.views.map((view) => viewWithApiNames(effective, view)),
    };
  } catch (cause) {
    // Invalid stored customization is a server failure, never client validation.
    throw new Error("Effective metadata resolution failed.", { cause });
  }
}
