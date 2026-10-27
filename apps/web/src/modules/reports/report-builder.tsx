"use client";

import type { DefinitionResult, ReportDefinition, ReportInput } from "@crm/core/definitions";
import type { Comparator, Criteria, FieldDefinition } from "@crm/core/records";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { useUiTranslations } from "@/i18n/client-provider";
import { useMetadataDisplayAdapter } from "@/i18n/metadata-adapter";
import type { ReportDetail } from "./port";

export interface ReportBuilderActions {
  fields(module: string): Promise<DefinitionResult<readonly FieldDefinition[]>>;
  save(
    input: ReportInput,
    options: { idempotencyKey: string } | { id: string; expectedRevision: number },
  ): Promise<DefinitionResult<ReportDefinition>>;
  run(input: ReportInput): Promise<DefinitionResult<ReportDetail>>;
}
type Filter = { id: number; field: string; comparator: Comparator; value: string };
const numeric = (f?: FieldDefinition) =>
  !!f && ["integer", "currency", "double"].includes(f.dataType);
const scalar = (f: FieldDefinition) =>
  [
    "text",
    "textarea",
    "email",
    "phone",
    "website",
    "picklist",
    "boolean",
    "integer",
    "currency",
    "double",
    "date",
    "datetime",
    "bigint",
  ].includes(f.dataType);
const operatorKeys = {
  equal: "equal",
  not_equal: "notEqual",
  contains: "contains",
  starts_with: "startsWith",
  ends_with: "endsWith",
  greater_than: "greaterThan",
  less_than: "lessThan",
  is_empty: "isEmpty",
  is_not_empty: "isNotEmpty",
} as const;
const inputClass = "rounded border border-control-border bg-surface px-3 py-2 text-md";

function initialFilters(criteria: Criteria | null): Filter[] {
  if (!criteria) return [];
  const values = "group" in criteria ? criteria.group : [criteria];
  return values.flatMap((item, id) =>
    "field" in item
      ? [
          {
            id,
            field: item.field,
            comparator: item.comparator,
            value: item.value === null ? "" : String(item.value),
          },
        ]
      : [],
  );
}

export function ReportBuilder({
  module,
  actions,
  initial,
  onCancel,
  onSaved,
}: {
  module: string;
  actions: ReportBuilderActions;
  initial?: ReportDefinition;
  onCancel(): void;
  onSaved(report: ReportDefinition): void;
}) {
  const t = useUiTranslations();
  const complexCriteria = !!(
    initial?.criteria &&
    "group" in initial.criteria &&
    initial.criteria.group.some((item) => "group" in item)
  );
  const display = useMetadataDisplayAdapter();
  const [fields, setFields] = useState<readonly FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [columns, setColumns] = useState<readonly string[]>(initial?.columns ?? []);
  const [filters, setFilters] = useState<Filter[]>(initialFilters(initial?.criteria ?? null));
  const [join, setJoin] = useState<"and" | "or">(
    initial?.criteria && "group" in initial.criteria ? initial.criteria.groupOperator : "and",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReportDetail | null>(null);
  const [reload, setReload] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reload explicitly retries the same read.
  useEffect(() => {
    let active = true;
    setLoading(true);
    actions
      .fields(module)
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          setFields(result.value);
          setError(null);
        } else setError(result.error.code);
      })
      .catch(() => {
        if (active) setError("unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [actions, module, reload]);
  function changed() {
    setKey(null);
    setPreview(null);
    setError(null);
  }
  function updateFilter(id: number, patch: Partial<Filter>) {
    changed();
    setFilters((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }
  function input(): ReportInput {
    const criteria = filters.map((filter): Criteria => {
      const field = fields.find((f) => f.apiName === filter.field);
      const empty = filter.comparator === "is_empty" || filter.comparator === "is_not_empty";
      return {
        field: filter.field,
        comparator: filter.comparator,
        value: empty
          ? null
          : numeric(field)
            ? Number(filter.value)
            : field?.dataType === "boolean"
              ? filter.value === "true"
              : filter.value,
      };
    });
    return {
      module,
      name,
      description,
      columns,
      grouping: null,
      criteria: criteria.length ? { groupOperator: join, group: criteria } : null,
    };
  }
  async function submit(save: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (save) {
        const requestKey = key ?? crypto.randomUUID();
        setKey(requestKey);
        const result = await actions.save(
          input(),
          initial
            ? { id: initial.id, expectedRevision: initial.revision }
            : { idempotencyKey: requestKey },
        );
        if (result.ok) onSaved(result.value);
        else setError(result.error.code);
      } else {
        const result = await actions.run({
          ...input(),
          name: name.trim() || t("modules.definitionWrites.builder"),
        });
        if (result.ok) setPreview(result.value);
        else setError(result.error.code);
      }
    } catch {
      setError("unavailable");
    } finally {
      setBusy(false);
    }
  }
  const validFilters = filters.every(
    (f) => f.field && (["is_empty", "is_not_empty"].includes(f.comparator) || f.value.trim()),
  );
  return (
    <section
      className="min-h-full bg-bg text-md"
      aria-label={t("modules.definitionWrites.builder")}
    >
      <header className="flex items-center justify-between gap-4 border-b border-border bg-surface p-5">
        <div>
          <h1 className="text-xl font-semibold">{t("modules.definitionWrites.builder")}</h1>
          <p className="mt-1 text-text-muted">{display.getModulePlural(module)}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" isDisabled={busy} onPress={onCancel}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            variant="secondary"
            isDisabled={busy || loading || complexCriteria || !columns.length || !validFilters}
            onPress={() => void submit(false)}
          >
            {t("modules.definitionWrites.run")}
          </Button>
          <Button
            isDisabled={
              busy || loading || complexCriteria || !columns.length || !name.trim() || !validFilters
            }
            onPress={() => void submit(true)}
          >
            {t("common.actions.save")}
          </Button>
        </div>
      </header>
      {complexCriteria && (
        <p role="alert" className="p-5">
          {t("modules.definitionWrites.complexFilter")}
        </p>
      )}
      {loading && (
        <p role="status" className="p-5">
          {t("modules.reports.loading")}
        </p>
      )}
      {error && (
        <div className="p-5">
          <p role="alert">
            {t(
              error === "conflict"
                ? "modules.definitionWrites.stale"
                : error === "forbidden"
                  ? "modules.definitionWrites.forbidden"
                  : error === "validation"
                    ? "modules.definitionWrites.validation"
                    : "modules.definitionWrites.error",
            )}
          </p>
          {!fields.length && (
            <Button variant="secondary" onPress={() => setReload((n) => n + 1)}>
              {t("modules.assignment.retry")}
            </Button>
          )}
        </div>
      )}
      <fieldset disabled={busy || loading} className="grid gap-6 p-5 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-5 rounded border border-border bg-surface p-5">
          <TextField
            label={t("modules.reports.reportName")}
            value={name}
            isRequired
            maxLength={255}
            onChange={(v) => {
              changed();
              setName(v);
            }}
          />
          <TextField
            label={t("modules.reports.description")}
            value={description}
            maxLength={4000}
            onChange={(v) => {
              changed();
              setDescription(v);
            }}
          />
          <h2 className="font-semibold">{t("modules.definitionWrites.columns")}</h2>
          {fields.map((field) => (
            <Checkbox
              key={field.apiName}
              label={display.getFieldLabel(module, field)}
              isSelected={columns.includes(field.apiName)}
              onChange={(checked) => {
                changed();
                setColumns((old) =>
                  checked ? [...old, field.apiName] : old.filter((c) => c !== field.apiName),
                );
              }}
            />
          ))}
        </aside>
        <div className="space-y-6 rounded border border-border bg-surface p-5">
          <h2 className="font-semibold">{t("modules.definitionWrites.selectedColumns")}</h2>
          <ol className="space-y-2">
            {columns.map((column, index) => (
              <li key={column} className="flex items-center gap-3 border-b border-border py-2">
                <span className="mr-auto">
                  {display.getFieldLabel(
                    module,
                    fields.find((f) => f.apiName === column) ?? { apiName: column, label: column },
                  )}
                </span>
                <Button
                  variant="secondary"
                  size="compact"
                  aria-label={t("modules.definitionWrites.moveUp", { name: column })}
                  isDisabled={index === 0}
                  onPress={() => {
                    changed();
                    const next = [...columns];
                    [next[index - 1], next[index]] = [
                      next[index] as string,
                      next[index - 1] as string,
                    ];
                    setColumns(next);
                  }}
                >
                  ↑
                </Button>
                <Button
                  variant="secondary"
                  size="compact"
                  aria-label={t("modules.definitionWrites.moveDown", { name: column })}
                  isDisabled={index === columns.length - 1}
                  onPress={() => {
                    changed();
                    const next = [...columns];
                    [next[index + 1], next[index]] = [
                      next[index] as string,
                      next[index + 1] as string,
                    ];
                    setColumns(next);
                  }}
                >
                  ↓
                </Button>
              </li>
            ))}
          </ol>
          <h2 className="font-semibold">{t("modules.definitionWrites.filters")}</h2>
          {filters.length > 1 && (
            <select
              className={inputClass}
              aria-label={t("modules.definitionWrites.match")}
              value={join}
              onChange={(e) => {
                changed();
                setJoin(e.target.value as "and" | "or");
              }}
            >
              <option value="and">{t("modules.definitionWrites.all")}</option>
              <option value="or">{t("modules.definitionWrites.any")}</option>
            </select>
          )}
          {filters.map((filter, index) => {
            const field = fields.find((f) => f.apiName === filter.field);
            const operators = [
              "equal",
              "not_equal",
              ...(numeric(field)
                ? ["greater_than", "less_than"]
                : field &&
                    ["text", "textarea", "email", "phone", "website"].includes(field.dataType)
                  ? ["contains", "starts_with", "ends_with"]
                  : []),
              "is_empty",
              "is_not_empty",
            ] as (keyof typeof operatorKeys)[];
            return (
              <div key={filter.id} className="flex flex-wrap items-center gap-3">
                <span>{index + 1}</span>
                <select
                  aria-label={t("modules.definitionWrites.filterField", { count: index + 1 })}
                  className={inputClass}
                  value={filter.field}
                  onChange={(e) =>
                    updateFilter(filter.id, {
                      field: e.target.value,
                      comparator: "equal",
                      value: "",
                    })
                  }
                >
                  <option value="">{t("modules.definitionWrites.selectField")}</option>
                  {fields.filter(scalar).map((f) => (
                    <option key={f.apiName} value={f.apiName}>
                      {display.getFieldLabel(module, f)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t("modules.definitionWrites.operator", { count: index + 1 })}
                  className={inputClass}
                  value={filter.comparator}
                  onChange={(e) =>
                    updateFilter(filter.id, { comparator: e.target.value as Comparator })
                  }
                >
                  {operators.map((op) => (
                    <option key={op} value={op}>
                      {t(`modules.definitionWrites.${operatorKeys[op]}`)}
                    </option>
                  ))}
                </select>
                {!["is_empty", "is_not_empty"].includes(filter.comparator) &&
                  (field?.dataType === "boolean" || field?.dataType === "picklist" ? (
                    <select
                      aria-label={t("modules.definitionWrites.value", { count: index + 1 })}
                      className={inputClass}
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    >
                      <option value="">{t("modules.definitionWrites.selectValue")}</option>
                      {field.dataType === "boolean" ? (
                        <>
                          <option value="true">{t("modules.definitionWrites.yes")}</option>
                          <option value="false">{t("modules.definitionWrites.no")}</option>
                        </>
                      ) : (
                        field.picklist?.map((p) => (
                          <option key={p.storedValue} value={p.storedValue}>
                            {display.getPicklistOptionLabel(module, field.apiName, p)}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <TextField
                      label={t("modules.definitionWrites.value", { count: index + 1 })}
                      value={filter.value}
                      onChange={(value) => updateFilter(filter.id, { value })}
                    />
                  ))}
                <Button
                  variant="ghost"
                  onPress={() => {
                    changed();
                    setFilters((rows) => rows.filter((r) => r.id !== filter.id));
                  }}
                >
                  {t("modules.definitionWrites.remove")}
                </Button>
              </div>
            );
          })}
          <Button
            variant="ghost"
            isDisabled={filters.length >= 100}
            onPress={() => {
              changed();
              setFilters((rows) => [
                ...rows,
                {
                  id: Math.max(-1, ...rows.map((r) => r.id)) + 1,
                  field: "",
                  comparator: "equal",
                  value: "",
                },
              ]);
            }}
          >
            {t("modules.definitionWrites.addFilter")}
          </Button>
          <h2 className="font-semibold">{t("modules.definitionWrites.grouping")}</h2>
          <select
            className={inputClass}
            aria-label={t("modules.definitionWrites.grouping")}
            disabled
          >
            <option>{t("modules.definitionWrites.none")}</option>
          </select>
          <p className="text-text-muted">{t("modules.definitionWrites.groupingUnavailable")}</p>
        </div>
      </fieldset>
      {preview && (
        <section
          className="m-5 overflow-x-auto rounded border border-border bg-surface p-5"
          aria-label={t("modules.definitionWrites.results")}
        >
          <p className="mb-4 font-semibold">
            {t("modules.definitionWrites.total", { count: preview.rows.length })}
          </p>
          <table className="w-full text-left">
            <thead>
              <tr>
                {preview.headings.map((h) => (
                  <th key={h} className="border-b border-border p-3">
                    {display.getNamedLabel(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: immutable result snapshot, no row state.
                <tr key={i}>
                  {row.map((value, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: immutable column order, no cell state.
                    <td key={j} className="border-b border-border p-3">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!preview.rows.length && (
            <p className="py-8 text-center text-text-muted">{t("modules.reports.noDataFound")}</p>
          )}
        </section>
      )}
    </section>
  );
}
