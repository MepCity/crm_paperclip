"use client";

import { type JSX, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";

export interface MappingField {
  apiName: string;
  label: string;
  required: boolean;
}

export interface FieldMapping {
  column: number;
  field: string | null;
  replaceEmptyWith?: string;
}

export interface ImportMappingStepProps {
  headers: string[];
  sampleRows: string[][];
  fields: MappingField[];
  mapping: FieldMapping[];
  onMappingChange(next: FieldMapping[]): void;
  defaults: { field: string; value: string }[];
  onDefaultsChange(next: { field: string; value: string }[]): void;
  requireAllRequired: boolean;
  onValidityChange(valid: boolean): void;
}

const normalize = (value: string) => value.replace(/\s/g, "").toLowerCase();
const noneKey = "";
const noneField: MappingField = { apiName: noneKey, label: "None", required: false };

export function ImportMappingStep({
  headers,
  sampleRows,
  fields,
  mapping,
  onMappingChange,
  defaults,
  onDefaultsChange,
  requireAllRequired,
  onValidityChange,
}: ImportMappingStepProps): JSX.Element {
  const [tab, setTab] = useState("all");
  const columns = headers.map((header, column) => ({
    header,
    column,
    entry: mapping.find((entry) => entry.column === column) ?? { column, field: null },
  }));
  const mapped = columns.filter(({ entry }) => entry.field !== null);
  const counts = new Map<string, number>();
  for (const { entry } of mapped) {
    if (entry.field) counts.set(entry.field, (counts.get(entry.field) ?? 0) + 1);
  }
  const missing = requireAllRequired
    ? fields.filter(
        (field) =>
          field.required &&
          !counts.has(field.apiName) &&
          !defaults.some((entry) => entry.field === field.apiName && entry.value.trim() !== ""),
      )
    : [];
  const valid = ![...counts.values()].some((count) => count > 1) && missing.length === 0;
  useEffect(() => onValidityChange(valid), [onValidityChange, valid]);

  function updateColumn(column: number, patch: Partial<FieldMapping>) {
    onMappingChange(
      columns.map(({ entry, column: index }) =>
        index === column ? { ...entry, ...patch } : entry,
      ),
    );
  }

  const visible = columns.filter(
    ({ entry }) => tab === "all" || (tab === "mapped") === (entry.field !== null),
  );
  const availableDefaults = fields.filter((field) => !counts.has(field.apiName));

  return (
    <div className="space-y-6 text-sm text-text">
      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabList aria-label="Field mapping filters">
            <Tab id="all">All</Tab>
            <Tab id="mapped">Mapped ({mapped.length})</Tab>
            <Tab id="unmapped">Unmapped ({headers.length - mapped.length})</Tab>
          </TabList>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onPress={() =>
                onMappingChange(
                  headers.map((header, column) => ({
                    column,
                    field:
                      fields.find(
                        (field) =>
                          normalize(field.label) === normalize(header) ||
                          normalize(field.apiName) === normalize(header),
                      )?.apiName ?? null,
                  })),
                )
              }
            >
              Auto Mapping
            </Button>
            <Button
              variant="secondary"
              onPress={() => onMappingChange(headers.map((_, column) => ({ column, field: null })))}
            >
              Reset
            </Button>
          </div>
        </div>
        <TabPanel id={tab}>
          {missing.length > 0 && (
            <div role="alert" className="mb-4 rounded-md border border-danger p-3 text-danger">
              Map the required fields: {missing.map((field) => field.label).join(", ")}
            </div>
          )}
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Import field mapping</caption>
              <thead className="bg-surface-hover">
                <tr>
                  {["Column in file", "Sample value", "CRM field", "Replace empty values with"].map(
                    (label) => (
                      <th key={label} scope="col" className="p-3 font-semibold">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map(({ header, column, entry }) => {
                  const sample = sampleRows.find((row) => row[column]?.trim())?.[column] ?? "";
                  const duplicate = !!entry.field && (counts.get(entry.field) ?? 0) > 1;
                  const rowLabel = `${header} (column ${column + 1})`;
                  return (
                    <tr key={column} className="border-t border-border">
                      <th scope="row" className="p-3 font-normal">
                        {header}
                      </th>
                      <td className="p-3">
                        <div className="max-w-48 truncate" title={sample}>
                          {sample}
                        </div>
                      </td>
                      <td className="min-w-56 p-3 align-top">
                        <Select
                          items={[noneField, ...fields]}
                          label={`CRM field for ${rowLabel}`}
                          hideLabel
                          selectedKey={entry.field ?? noneKey}
                          onSelectionChange={(key) =>
                            updateColumn(column, { field: key ? String(key) : null })
                          }
                          isInvalid={duplicate}
                          errorMessage={duplicate ? "This field is already mapped." : undefined}
                        >
                          {(field) => (
                            <SelectItem key={field.apiName} id={field.apiName}>
                              {field.label}
                              {field.required ? " *" : ""}
                            </SelectItem>
                          )}
                        </Select>
                      </td>
                      <td className="min-w-56 p-3 align-top">
                        <TextField
                          label={`Replace empty values with for ${rowLabel}`}
                          hideLabel
                          isDisabled={!entry.field}
                          value={entry.replaceEmptyWith ?? ""}
                          onChange={(replaceEmptyWith) =>
                            updateColumn(column, { replaceEmptyWith })
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabPanel>
      </Tabs>
      <section aria-label="Default values" className="space-y-3">
        <h3 className="font-semibold">Default values</h3>
        {defaults.map((entry, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Controlled rows have no identity in the public contract.
          <div key={index} className="flex items-end gap-3">
            <Select
              items={[noneField, ...availableDefaults]}
              label={`Default field ${index + 1}`}
              selectedKey={entry.field}
              onSelectionChange={(key) =>
                onDefaultsChange(
                  defaults.map((item, i) =>
                    i === index ? { ...item, field: String(key ?? "") } : item,
                  ),
                )
              }
            >
              {(field) => (
                <SelectItem key={field.apiName} id={field.apiName}>
                  {field.label}
                  {field.required ? " *" : ""}
                </SelectItem>
              )}
            </Select>
            <TextField
              label={`Default value ${index + 1}`}
              value={entry.value}
              onChange={(value) =>
                onDefaultsChange(
                  defaults.map((item, i) => (i === index ? { ...item, value } : item)),
                )
              }
            />
            <Button
              variant="secondary"
              aria-label={`Remove default value ${index + 1}`}
              onPress={() => onDefaultsChange(defaults.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          onPress={() => onDefaultsChange([...defaults, { field: "", value: "" }])}
        >
          + Add default value
        </Button>
      </section>
      <Button variant="secondary" laterModule="M11">
        Create New Fields
      </Button>
    </div>
  );
}
