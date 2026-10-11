#!/usr/bin/env node
/**
 * Generates Contacts fixture metadata and picklists from the local research export.
 * Run manually when the export changes; commit the generated TypeScript output.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const researchRoot =
  process.env.MEPCITY_RESEARCH ?? join(process.env.HOME, "Desktop", "mepcity-research");
const contactsRoot = join(researchRoot, "metadata", "modules", "Contacts");
const outDir = join(repoRoot, "packages/core/src/records/fixture/contacts");

const DEFERRED_PICKLISTS = new Set([
  "Mailing_Country",
  "Mailing_State",
  "Other_Country",
  "Other_State",
]);

const TYPE_MAP = {
  text: "text",
  textarea: "textarea",
  email: "email",
  phone: "phone",
  picklist: "picklist",
  integer: "integer",
  currency: "currency",
  boolean: "boolean",
  date: "date",
  datetime: "datetime",
  double: "double",
  bigint: "bigint",
  lookup: "lookup",
  ownerlookup: "ownerlookup",
  profileimage: "profileimage",
  multi_module_lookup: "multi_module_lookup",
};

function escapeString(value) {
  return JSON.stringify(value);
}

function mapDataType(field) {
  const mapped = TYPE_MAP[field.data_type];
  if (!mapped) throw new Error(`Unsupported data type ${field.data_type} on ${field.api_name}`);
  return mapped;
}

function picklistOptions(field) {
  if (DEFERRED_PICKLISTS.has(field.api_name)) return null;
  const values = field.pick_list_values ?? [];
  if (!values.length) return null;
  return values.map((option, index) => {
    const display = option.display_value ?? option.actual_value ?? option.reference_value;
    const stored = option.actual_value ?? option.display_value ?? option.reference_value;
    if (field.api_name === "Unsubscribed_Mode" && index === 3) {
      return {
        displayValue: "reference CRM campaigns",
        storedValue: "reference CRM campaigns",
      };
    }
    return { displayValue: display, storedValue: stored };
  });
}

function exportUniqueFlag(field) {
  return field.unique?.casesensitive != null;
}

function fieldDefinition(field) {
  const dataType = mapDataType(field);
  const required = Boolean(field.system_mandatory);
  const readOnly =
    field.data_type === "ownerlookup"
      ? Boolean(field.read_only)
      : Boolean(field.read_only || field.field_read_only);
  const views = field.view_type ?? {};
  const lines = [
    "    {",
    `      apiName: ${escapeString(field.api_name)},`,
    `      massUpdate: ${Boolean(field.mass_update)},`,
    "      views: {",
    `        view: ${Boolean(views.view)},`,
    `        create: ${Boolean(views.create)},`,
    `        edit: ${Boolean(views.edit)},`,
    `        quickCreate: ${Boolean(views.quick_create)},`,
    "      },",
    `      label: ${escapeString(field.field_label ?? field.display_label)},`,
    `      dataType: ${escapeString(dataType)},`,
    `      required: ${required},`,
    `      readOnly: ${readOnly},`,
    `      unique: ${exportUniqueFlag(field)},`,
  ];
  if (field.length) lines.push(`      maxLength: ${field.length},`);
  if (dataType === "lookup" && field.lookup?.module?.api_name) {
    lines.push(`      lookup: { module: ${escapeString(field.lookup.module.api_name)} },`);
  }
  lines.push("    },");
  return lines.join("\n");
}

function buildLayout(standard) {
  const sections = standard.sections.map((section) => {
    const columnCount = section.column_count ?? 1;
    const byColumn = Array.from({ length: columnCount }, () => []);
    const ordered = [];
    for (const entry of section.fields ?? []) {
      const apiName = entry.api_name ?? entry;
      ordered.push(apiName);
      const column = Math.max(0, Math.min(columnCount - 1, (entry.sequence_number ?? 1) - 1));
      if (!byColumn[column].includes(apiName)) byColumn[column].push(apiName);
    }
    return {
      label: section.display_label ?? section.name,
      columnCount,
      columns: byColumn,
      fields: ordered,
    };
  });
  return sections;
}

function main() {
  const fieldsJson = JSON.parse(readFileSync(join(contactsRoot, "fields.json"), "utf8")).fields;
  const layoutsJson = JSON.parse(readFileSync(join(contactsRoot, "layouts.json"), "utf8")).layouts;
  const standard = layoutsJson.find((layout) => layout.name === "Standard");
  if (!standard) throw new Error("Standard layout missing from export");

  const picklists = {};
  for (const field of fieldsJson) {
    const options = picklistOptions(field);
    if (options) picklists[field.api_name] = options;
  }

  mkdirSync(outDir, { recursive: true });

  const picklistSource = `import type { PicklistOption } from "../../contract";

export const contactsPicklists: Readonly<Record<string, readonly PicklistOption[]>> = ${JSON.stringify(
    picklists,
    null,
    2,
  )};
`;

  const layout = buildLayout(standard);
  const layoutTs = JSON.stringify(layout, null, 2);
  const metadataSource = `import type { ModuleMetadata } from "../../contract";
import { contactsPicklists } from "./picklists";

export const contactsMetadata: ModuleMetadata = {
  apiName: "Contacts",
  singularLabel: "Contact",
  pluralLabel: "Contacts",
  businessCardFields: ["Owner", "Email", "Phone", "Mobile", "Department"],
  fields: [
${fieldsJson.map(fieldDefinition).join("\n")}
  ],
  layout: ${layoutTs},
};

for (const field of contactsMetadata.fields) {
  const picklist = contactsPicklists[field.apiName];
  if (picklist) field.picklist = picklist;
}
`;

  writeFileSync(join(outDir, "picklists.ts"), picklistSource);
  writeFileSync(join(outDir, "metadata.ts"), metadataSource);
  console.log(`Wrote ${fieldsJson.length} fields to ${outDir}`);
}

main();
