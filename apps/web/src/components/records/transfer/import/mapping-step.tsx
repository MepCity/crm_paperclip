"use client";

import { suggestMapping } from "@crm/core/transfer/mapping";
import { type JSX, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { useUiTranslations } from "@/i18n/client-provider";

export interface MappingField {
  apiName: string;
  label: string;
  required: boolean;
  type?: string;
  aliases?: string[];
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
  /** Header names that mean "record id" (the id column of an export). */
  recordIdLabels?: string[];
}

const noneKey = "";

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
  recordIdLabels,
}: ImportMappingStepProps): JSX.Element {
  const t = useUiTranslations();
  const noneField: MappingField = {
    apiName: noneKey,
    label: t("records.transfer.none"),
    required: false,
  };
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
  const availableDefaults = fields.filter(
    (field) => field.apiName !== "id" && !counts.has(field.apiName),
  );

  return (
    <div className="space-y-6 text-sm text-text">
      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabList aria-label={t("records.transfer.mapFilters")}>
            <Tab id="all">{t("records.transfer.mapAll")}</Tab>
            <Tab id="mapped">{t("records.transfer.mapMapped", { count: mapped.length })}</Tab>
            <Tab id="unmapped">
              {t("records.transfer.mapUnmapped", { count: headers.length - mapped.length })}
            </Tab>
          </TabList>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onPress={() =>
                onMappingChange(
                  suggestMapping(
                    headers,
                    fields.map((field) => ({ ...field, type: field.type ?? "text" })),
                    recordIdLabels,
                  ),
                )
              }
            >
              {t("records.transfer.autoMapping")}
            </Button>
            <Button
              variant="secondary"
              onPress={() => onMappingChange(headers.map((_, column) => ({ column, field: null })))}
            >
              {t("records.transfer.reset")}
            </Button>
          </div>
        </div>
        <TabPanel id={tab}>
          {missing.length > 0 && (
            <div role="alert" className="mb-4 rounded-md border border-danger p-3 text-danger">
              {t("records.transfer.mapRequired", {
                fields: missing.map((field) => field.label).join(", "),
              })}
            </div>
          )}
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">{t("records.transfer.mapCaption")}</caption>
              <thead className="bg-surface-hover">
                <tr>
                  {(["colFile", "colSample", "colField", "colReplace"] as const).map((key) => (
                    <th key={key} scope="col" className="p-3 font-semibold">
                      {t(`records.transfer.${key}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(({ header, column, entry }) => {
                  const sample = sampleRows.find((row) => row[column]?.trim())?.[column] ?? "";
                  const duplicate = !!entry.field && (counts.get(entry.field) ?? 0) > 1;
                  const rowLabel = t("records.transfer.columnRow", { header, n: column + 1 });
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
                          label={t("records.transfer.fieldFor", { row: rowLabel })}
                          hideLabel
                          selectedKey={entry.field ?? noneKey}
                          onSelectionChange={(key) =>
                            updateColumn(column, { field: key ? String(key) : null })
                          }
                          isInvalid={duplicate}
                          errorMessage={duplicate ? t("records.transfer.alreadyMapped") : undefined}
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
                          label={t("records.transfer.replaceFor", { row: rowLabel })}
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
      <section aria-label={t("records.transfer.defaultValues")} className="space-y-3">
        <h3 className="font-semibold">{t("records.transfer.defaultValues")}</h3>
        {defaults.map((entry, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Controlled rows have no identity in the public contract.
          <div key={index} className="flex items-end gap-3">
            <Select
              items={[noneField, ...availableDefaults]}
              label={t("records.transfer.defaultField", { n: index + 1 })}
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
              label={t("records.transfer.defaultValue", { n: index + 1 })}
              value={entry.value}
              onChange={(value) =>
                onDefaultsChange(
                  defaults.map((item, i) => (i === index ? { ...item, value } : item)),
                )
              }
            />
            <Button
              variant="secondary"
              aria-label={t("records.transfer.removeDefault", { n: index + 1 })}
              onPress={() => onDefaultsChange(defaults.filter((_, i) => i !== index))}
            >
              {t("records.transfer.remove")}
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          onPress={() => onDefaultsChange([...defaults, { field: "", value: "" }])}
        >
          {t("records.transfer.addDefault")}
        </Button>
      </section>
      <Button variant="secondary" laterModule="M11">
        {t("records.transfer.createFields")}
      </Button>
    </div>
  );
}
