import { AppError, isAppError, NotFoundError, ValidationError } from "../errors";
import type {
  FieldDefinition,
  FieldValue,
  ModuleMetadata,
  PicklistOption,
  RecordData,
  RecordService,
} from "../records/contract";
import { OPEN_PICKLIST_FIELDS } from "../records/picklist-policy";
import type { OrgContext } from "../tenancy/types";
import type { Upload } from "./history";
import { matchPicklistOption, normalizeKey } from "./mapping";
import {
  type Actor,
  englishLocale,
  type ImportJob,
  type ImportSettings,
  type TransferDependencies,
  type TransferLocale,
  type TransferModule,
} from "./types";

export const defaultMatch: Record<TransferModule, string> = {
  Leads: "Email",
  Contacts: "Email",
  Accounts: "Account_Name",
  Deals: "Deal_Name",
  Campaigns: "Campaign_Name",
  Tasks: "id",
  Events: "id",
  Calls: "id",
  Solutions: "id",
  Cases: "id",
};
const managed = new Set([
  "id",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "Locked__s",
]);
export const writable = (field: FieldDefinition) =>
  !field.readOnly && !managed.has(field.apiName) && (field.views.create || field.views.edit);
const TIME_FIELDS = new Set(["Created_Time", "Modified_Time"]);
/** Writable fields plus the two system timestamps, which an import may carry over. */
export const importable = (field: FieldDefinition) =>
  writable(field) || (TIME_FIELDS.has(field.apiName) && field.dataType === "datetime");
const activityModule = (module: TransferModule) => ["Tasks", "Events", "Calls"].includes(module);

/** The CSV discriminator narrows What_Id; it is never stored as a record field. */
export function importMetadata(metadata: ModuleMetadata, module: TransferModule): ModuleMetadata {
  const parent = metadata.fields.find((field) => field.apiName === "What_Id" && writable(field));
  if (!activityModule(module) || !parent) return metadata;
  return {
    ...metadata,
    fields: [
      ...metadata.fields,
      {
        ...parent,
        apiName: "$se_module",
        label: "Related Module",
        dataType: "text",
        required: false,
        unique: false,
        lookup: undefined,
      },
    ],
  };
}
export const normalizeHeader = normalizeKey;

/**
 * Reads a source timestamp as a UTC instant: ISO 8601 (space or T, optional zone) or
 * day.month.year / day/month/year with an optional time. Returns null when it is not a date.
 */
export function parseSourceTime(raw: string): string | null {
  const text = raw.trim();
  const iso =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(
      text,
    );
  const local = /^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(
    text,
  );
  const parts = iso
    ? { y: iso[1], mo: iso[2], d: iso[3], h: iso[4], mi: iso[5], s: iso[6], zone: iso[7] }
    : local
      ? {
          y: local[3],
          mo: local[2],
          d: local[1],
          h: local[4],
          mi: local[5],
          s: local[6],
          zone: undefined,
        }
      : null;
  if (!parts) return null;
  const [y, mo, d, h, mi, sec] = [parts.y, parts.mo, parts.d, parts.h, parts.mi, parts.s].map(
    (v) => (v === undefined ? 0 : Number(v)),
  ) as [number, number, number, number, number, number];
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi, sec));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d ||
    h > 23 ||
    mi > 59 ||
    sec > 59
  )
    return null;
  const zone =
    parts.zone && parts.zone.toUpperCase() !== "Z"
      ? /([+-])(\d{2}):?(\d{2})/.exec(parts.zone)
      : null;
  if (zone) {
    const minutes = Number(zone[2]) * 60 + Number(zone[3]);
    date.setTime(date.getTime() - (zone[1] === "-" ? -minutes : minutes) * 60_000);
  }
  return date.toISOString();
}

const SALUTATIONS = new Set(["bay", "bayan", "mr", "mrs", "ms", "miss", "dr", "prof", "sayin"]);
/** Drops leading salutations (Bay, Bayan, Mr., Ms. ...) from a person's name. */
export function stripSalutation(name: string): string {
  const tokens = name.trim().split(/\s+/);
  while (tokens.length > 1 && SALUTATIONS.has(normalizeKey(tokens[0] ?? ""))) tokens.shift();
  return tokens.join(" ");
}
export function matchFields(
  metadata: ModuleMetadata,
  module: TransferModule,
  locale: TransferLocale = englishLocale,
) {
  return [
    { field: "id", label: locale.recordIdLabel },
    ...metadata.fields
      .filter(
        (field) =>
          field.apiName !== "id" && (field.unique || field.apiName === defaultMatch[module]),
      )
      .map((field) => ({ field: field.apiName, label: locale.fieldLabel(module, field) })),
  ];
}
/** The field that names a record, used to show and to look up related records. */
export function nameFieldOf(metadata: ModuleMetadata) {
  return (
    metadata.fields.find(
      (item) => item.apiName === `${metadata.singularLabel.replace(/\s/g, "")}_Name`,
    ) ??
    metadata.fields.find((item) => item.apiName === "Full_Name") ??
    metadata.fields.find((item) => item.apiName === "Last_Name")
  );
}
const isReference = (field: FieldDefinition) =>
  ["lookup", "ownerlookup", "multi_module_lookup"].includes(field.dataType);
export async function allView(records: RecordService, module: string) {
  const metadata = await records.getModule(module);
  const views = await records.listViews(module);
  const view =
    views.find(
      (candidate) => candidate.systemDefined && candidate.name === `All ${metadata.pluralLabel}`,
    ) ?? views.find((candidate) => candidate.isDefault);
  if (!view) throw new NotFoundError("View not found.");
  return view;
}
async function matching(
  records: RecordService,
  module: string,
  field: string,
  value: string,
  comparator: "equal" | "contains" = "equal",
): Promise<readonly RecordData[]> {
  if (field === "id") {
    try {
      return [await records.get(module, value)];
    } catch (error) {
      if (isAppError(error) && error.code === "not_found") return [];
      throw error;
    }
  }
  const view = await allView(records, module);
  return (
    await records.list(module, {
      viewId: view.id,
      page: 1,
      perPage: 100,
      filters: { field, comparator, value },
    })
  ).records;
}
class RowError extends Error {
  constructor(
    readonly code: string,
    readonly field?: string,
  ) {
    super(code);
  }
}
export function validateMapping(
  metadata: ModuleMetadata,
  module: TransferModule,
  upload: Upload,
  settings: ImportSettings,
): string {
  if (!["add", "update", "both"].includes(settings.mode))
    throw new ValidationError({ mode: ["Invalid import mode."] });
  const seen = new Set<string>();
  const columns = new Set<number>();
  for (const mapping of settings.mapping) {
    if (
      !Number.isInteger(mapping.column) ||
      mapping.column < 0 ||
      mapping.column >= upload.headers.length ||
      columns.has(mapping.column)
    )
      throw new ValidationError({ mapping: ["Choose distinct source columns."] });
    columns.add(mapping.column);
    if (mapping.field === null) continue;
    if (seen.has(mapping.field))
      throw new AppError("mapping_duplicate_field", "Map each field once.");
    seen.add(mapping.field);
    if (
      mapping.field !== "id" &&
      !metadata.fields.some((field) => field.apiName === mapping.field && importable(field))
    )
      throw new AppError("mapping_system_field", "Choose writable fields.");
  }
  const defaults = new Set<string>();
  for (const item of settings.defaults) {
    if (defaults.has(item.field))
      throw new AppError("mapping_duplicate_field", "Set each default once.");
    defaults.add(item.field);
    if (!metadata.fields.some((field) => field.apiName === item.field && writable(field)))
      throw new AppError("mapping_system_field", "Choose writable fields.");
  }
  if (
    settings.mode !== "update" &&
    metadata.fields.some(
      (field) =>
        writable(field) &&
        field.required &&
        !seen.has(field.apiName) &&
        !defaults.has(field.apiName),
    )
  )
    throw new AppError("mapping_missing_required", "Map required fields or provide defaults.");
  const matchField = settings.matchField ?? defaultMatch[module];
  if (!matchFields(metadata, module).some((item) => item.field === matchField))
    throw new AppError("invalid_match_field", "Choose an allowed matching field.");
  if (settings.mode !== "add" && !seen.has(matchField))
    throw new AppError("match_field_required", "Map the matching field.");
  return matchField;
}
async function convert(
  field: FieldDefinition,
  raw: string,
  records: RecordService,
  actors: readonly Actor[],
  idOnly = false,
  moduleHint?: string,
  optionLabels: (option: PicklistOption) => readonly string[] = () => [],
): Promise<FieldValue> {
  if (raw === "") return null;
  if (["integer", "double", "currency"].includes(field.dataType)) {
    const value = Number(raw);
    if (!raw.trim() || !Number.isFinite(value)) throw new RowError("invalid_value", field.apiName);
    return value;
  }
  if (field.dataType === "boolean") {
    const word = normalizeKey(raw);
    if (["true", "yes", "evet", "1"].includes(word)) return true;
    if (["false", "no", "hayir", "0"].includes(word)) return false;
    throw new RowError("invalid_value", field.apiName);
  }
  if (field.dataType === "picklist" && field.picklist?.length) {
    const option = matchPicklistOption(field.picklist, raw.trim(), optionLabels);
    if (option) return option.storedValue;
    // Address state fields are free text: the options only suggest values.
    if (OPEN_PICKLIST_FIELDS.has(field.apiName)) return raw.trim();
    throw new RowError("invalid_value", field.apiName);
  }
  if (field.dataType === "ownerlookup") {
    const byId = actors.filter((actor) => actor.id === raw);
    const key = normalizeKey(raw);
    const candidates = byId.length
      ? byId
      : actors.filter((actor) => normalizeKey(actor.name) === key);
    if (candidates.length !== 1)
      throw new RowError(candidates.length ? "multiple_matches" : "not_found", field.apiName);
    return candidates[0]?.id ?? null;
  }
  if (field.dataType === "lookup" || field.dataType === "multi_module_lookup") {
    const modules = field.lookup?.modules ?? (field.lookup ? [field.lookup.module] : []);
    if (moduleHint && !modules.includes(moduleHint))
      throw new RowError("invalid_value", "$se_module");
    const candidates: { module: string; id: string }[] = [];
    let unreadable = false;
    for (const module of modules) {
      if (moduleHint && module !== moduleHint) continue;
      let ids: readonly RecordData[];
      try {
        ids = await matching(records, module, "id", raw);
      } catch (error) {
        if (!isAppError(error)) throw error;
        if (error.code === "forbidden") {
          if (!idOnly) throw error;
          unreadable = true;
          continue;
        }
        // A name is not a valid id: fall through to the name lookup below.
        if (idOnly) throw error;
        ids = [];
      }
      if (ids.length) {
        candidates.push(...ids.map((record) => ({ module, id: record.id })));
        continue;
      }
      if (idOnly) continue;
      const metadata = await records.getModule(module);
      const name = nameFieldOf(metadata);
      if (name) {
        let found = await matching(records, module, name.apiName, raw);
        if (!found.length) found = await fuzzyByName(records, module, name.apiName, raw);
        candidates.push(...found.map((record) => ({ module, id: record.id })));
      }
    }
    if (candidates.length !== 1)
      throw new RowError(
        candidates.length ? "multiple_matches" : unreadable ? "permission_denied" : "not_found",
        field.apiName,
      );
    return candidates[0] ?? null;
  }
  return raw;
}
const nameIndexes = new WeakMap<RecordService, Map<string, Map<string, RecordData[]>>>();
const NAME_INDEX_PAGES = 60;
/** Name match ignoring case, diacritics, spacing and a leading salutation (Bay, Mr., ...). */
async function fuzzyByName(
  records: RecordService,
  module: string,
  nameField: string,
  raw: string,
): Promise<readonly RecordData[]> {
  const wanted = normalizeKey(stripSalutation(raw));
  if (!wanted) return [];
  // One bounded read of the module per import run; names are compared locally.
  const perService = nameIndexes.get(records) ?? new Map<string, Map<string, RecordData[]>>();
  nameIndexes.set(records, perService);
  const key = `${module}:${nameField}`;
  let index = perService.get(key);
  if (!index) {
    index = new Map();
    const view = await allView(records, module);
    for (let page = 1; page <= NAME_INDEX_PAGES; page++) {
      const result = await records.list(module, {
        viewId: view.id,
        page,
        perPage: 100,
        fields: [nameField],
      });
      for (const record of result.records) {
        const value = record.fields[nameField];
        if (typeof value !== "string") continue;
        const name = normalizeKey(stripSalutation(value));
        index.set(name, [...(index.get(name) ?? []), record]);
      }
      if (!result.moreRecords || !result.records.length) break;
    }
    perService.set(key, index);
  }
  return index.get(wanted) ?? [];
}
export async function importRows(
  ctx: OrgContext,
  records: RecordService,
  deps: TransferDependencies,
  upload: Upload,
  settings: ImportSettings,
  metadata: ModuleMetadata,
  matchField: string,
  job: ImportJob,
  locale: TransferLocale = englishLocale,
): Promise<string[]> {
  const actors = await deps.listActors(ctx);
  const byName = new Map(metadata.fields.map((field) => [field.apiName, field]));
  /** A value that does not fit may be dropped when its field is optional and not the match key. */
  const droppable = (name: string) => {
    const field = byName.get(name);
    return !!field && !field.required && name !== matchField;
  };
  const createdIds: string[] = [];
  const used = new Set<string>();
  for (const [index, row] of upload.rows.entries()) {
    try {
      const raw: Record<string, string> = Object.create(null);
      for (const mapping of settings.mapping) {
        if (mapping.field === null) continue;
        raw[mapping.field] = row[mapping.column] || mapping.replaceEmptyWith || "";
      }
      for (const item of settings.defaults) if (!raw[item.field]) raw[item.field] = item.value;
      const key = raw[matchField] ?? "";
      const canonical = matchField === "id" ? key : key.toLowerCase();
      if (key && used.has(canonical)) {
        job.counts.skipped++;
        job.rows.push({
          row: index + 2,
          outcome: "skipped",
          code: "duplicate_in_file",
          field: matchField,
        });
        continue;
      }
      if (!key && settings.mode !== "add") throw new RowError("required_missing", matchField);
      const matches = key ? await matching(records, upload.module, matchField, key) : [];
      if (matches.length > 1) throw new RowError("multiple_matches", matchField);
      if (matches.length && settings.mode === "add") {
        job.counts.skipped++;
        job.rows.push({
          row: index + 2,
          outcome: "skipped",
          code: "already_exists",
          field: matchField,
        });
        if (key) used.add(canonical);
        continue;
      }
      if (!matches.length && settings.mode === "update")
        throw new RowError("not_found", matchField);
      const target = matches[0];
      const action = target ? "update" : "create";
      await deps.authorize(ctx, upload.module, action);
      const values: Record<string, FieldValue> = Object.create(null);
      const warnings: { field: string; code: string }[] = [];
      const sourceTimes: { createdTime?: string; modifiedTime?: string } = {};
      for (const field of metadata.fields) {
        // The identifier is a matching key, never a writable record field.
        if (field.apiName === "id" || field.apiName === "$se_module") continue;
        const value = raw[field.apiName];
        if (value === undefined || (target && settings.ignoreEmptyOnUpdate && value === ""))
          continue;
        if (TIME_FIELDS.has(field.apiName)) {
          // Source timestamps are carried over as given; Created Time only applies to new records.
          if (value === "" || (target && field.apiName === "Created_Time")) continue;
          const instant = parseSourceTime(value);
          if (!instant) warnings.push({ field: field.apiName, code: "value_cleared" });
          else if (field.apiName === "Created_Time") sourceTimes.createdTime = instant;
          else sourceTimes.modifiedTime = instant;
          continue;
        }
        if (!field.views[target ? "edit" : "create"])
          throw new RowError("permission_denied", field.apiName);
        try {
          values[field.apiName] = await convert(
            field,
            value,
            records,
            actors,
            activityModule(upload.module) && ["What_Id", "Who_Id"].includes(field.apiName),
            activityModule(upload.module) && field.apiName === "What_Id"
              ? raw.$se_module
              : undefined,
            (option) => locale.optionLabels(upload.module, field, option),
          );
        } catch (error) {
          if (!(error instanceof RowError) || !droppable(field.apiName)) throw error;
          if (field.dataType === "ownerlookup" && error.code !== "invalid_value") {
            // An owner that cannot be resolved becomes the importing user on new records.
            if (!target) values[field.apiName] = ctx.userId;
            warnings.push({ field: field.apiName, code: "owner_defaulted" });
          } else if (isReference(field) && error.code !== "invalid_value") {
            warnings.push({ field: field.apiName, code: error.code });
          } else if (error.code === "invalid_value") {
            warnings.push({ field: field.apiName, code: "value_cleared" });
          } else throw error;
        }
      }
      const options =
        settings.expectedRevision === undefined &&
        sourceTimes.createdTime === undefined &&
        sourceTimes.modifiedTime === undefined
          ? undefined
          : {
              ...(settings.expectedRevision === undefined
                ? {}
                : { expectedRevision: settings.expectedRevision }),
              ...(sourceTimes.createdTime || sourceTimes.modifiedTime ? { sourceTimes } : {}),
            };
      let result: Awaited<ReturnType<RecordService["create"]>>;
      for (let attempt = 0; ; attempt++) {
        try {
          result = target
            ? await records.update(upload.module, target.id, values, options)
            : await records.create(upload.module, values, options);
          break;
        } catch (error) {
          // The record layer rejected some optional values: import without them.
          if (!(error instanceof ValidationError) || error.reason === "mandatory" || attempt >= 5)
            throw error;
          const bad = Object.keys(error.fieldErrors);
          if (!bad.length || !bad.every((name) => name in values && droppable(name))) throw error;
          for (const name of bad) {
            delete values[name];
            warnings.push({ field: name, code: "value_cleared" });
          }
        }
      }
      for (const warning of warnings) {
        job.counts.warnings = (job.counts.warnings ?? 0) + 1;
        job.rows.push({
          row: index + 2,
          outcome: "warning",
          code: warning.code,
          field: warning.field,
        });
      }
      if (target) job.counts.updated++;
      else {
        job.counts.created++;
        createdIds.push(result.id);
      }
      if (key) used.add(canonical);
    } catch (error) {
      if (!(error instanceof RowError) && !isAppError(error)) throw error;
      const field =
        error instanceof RowError
          ? error.field
          : error instanceof ValidationError
            ? Object.keys(error.fieldErrors)[0]
            : undefined;
      const code =
        error instanceof RowError
          ? error.code
          : error instanceof ValidationError
            ? error.reason === "mandatory"
              ? "required_missing"
              : "invalid_value"
            : error.code === "forbidden"
              ? "permission_denied"
              : error.code === "not_found"
                ? "not_found"
                : error.code === "conflict"
                  ? "already_exists"
                  : error.code === "schema_stale"
                    ? "schema_stale"
                    : "invalid_value";
      job.counts.errors++;
      job.rows.push({ row: index + 2, outcome: "error", code, ...(field ? { field } : {}) });
    }
  }
  const successes = job.counts.created + job.counts.updated;
  job.status = !successes
    ? "failed"
    : job.counts.errors || job.counts.skipped || job.counts.warnings
      ? "completed_with_errors"
      : "completed";
  job.undoable = createdIds.length > 0;
  return createdIds;
}
