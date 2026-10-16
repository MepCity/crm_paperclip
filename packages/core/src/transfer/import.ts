import { AppError, isAppError, NotFoundError, ValidationError } from "../errors";
import type {
  FieldDefinition,
  FieldValue,
  ModuleMetadata,
  RecordData,
  RecordService,
} from "../records/contract";
import type { OrgContext } from "../tenancy/types";
import type { Upload } from "./history";
import type {
  Actor,
  ImportJob,
  ImportSettings,
  TransferDependencies,
  TransferModule,
} from "./types";

export const defaultMatch: Record<TransferModule, string> = {
  Leads: "Email",
  Contacts: "Email",
  Accounts: "Account_Name",
  Deals: "Deal_Name",
  Tasks: "id",
  Events: "id",
  Calls: "id",
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
export const normalizeHeader = (value: string) => value.toLowerCase().replace(/[\s_]/g, "");
export function matchFields(metadata: ModuleMetadata, module: TransferModule) {
  return [
    { field: "id", label: "Record Id" },
    ...metadata.fields
      .filter(
        (field) =>
          field.apiName !== "id" && (field.unique || field.apiName === defaultMatch[module]),
      )
      .map((field) => ({ field: field.apiName, label: field.label })),
  ];
}
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
      filters: { field, comparator: "equal", value },
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
      !metadata.fields.some((field) => field.apiName === mapping.field && writable(field))
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
): Promise<FieldValue> {
  if (raw === "") return null;
  if (["integer", "double", "currency"].includes(field.dataType)) {
    const value = Number(raw);
    if (!raw.trim() || !Number.isFinite(value)) throw new RowError("invalid_value", field.apiName);
    return value;
  }
  if (field.dataType === "boolean") {
    if (/^(true|false)$/i.test(raw)) return raw.toLowerCase() === "true";
    throw new RowError("invalid_value", field.apiName);
  }
  if (field.dataType === "ownerlookup") {
    const byId = actors.filter((actor) => actor.id === raw);
    const candidates = byId.length
      ? byId
      : actors.filter((actor) => actor.name.toLowerCase() === raw.toLowerCase());
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
        if (!idOnly || !isAppError(error) || error.code !== "forbidden") throw error;
        unreadable = true;
        continue;
      }
      if (ids.length) {
        candidates.push(...ids.map((record) => ({ module, id: record.id })));
        continue;
      }
      if (idOnly) continue;
      const metadata = await records.getModule(module);
      const name =
        metadata.fields.find(
          (item) => item.apiName === `${metadata.singularLabel.replace(/\s/g, "")}_Name`,
        ) ??
        metadata.fields.find((item) => item.apiName === "Full_Name") ??
        metadata.fields.find((item) => item.apiName === "Last_Name");
      if (name)
        candidates.push(
          ...(await matching(records, module, name.apiName, raw)).map((record) => ({
            module,
            id: record.id,
          })),
        );
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
export async function importRows(
  ctx: OrgContext,
  records: RecordService,
  deps: TransferDependencies,
  upload: Upload,
  settings: ImportSettings,
  metadata: ModuleMetadata,
  matchField: string,
  job: ImportJob,
): Promise<string[]> {
  const actors = await deps.listActors(ctx);
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
      for (const field of metadata.fields) {
        // The identifier is a matching key, never a writable record field.
        if (field.apiName === "id" || field.apiName === "$se_module") continue;
        const value = raw[field.apiName];
        if (value === undefined || (target && settings.ignoreEmptyOnUpdate && value === ""))
          continue;
        if (!field.views[target ? "edit" : "create"])
          throw new RowError("permission_denied", field.apiName);
        values[field.apiName] = await convert(
          field,
          value,
          records,
          actors,
          activityModule(upload.module) && ["What_Id", "Who_Id"].includes(field.apiName),
          activityModule(upload.module) && field.apiName === "What_Id" ? raw.$se_module : undefined,
        );
      }
      const result = target
        ? await records.update(upload.module, target.id, values)
        : await records.create(upload.module, values);
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
                  : "invalid_value";
      job.counts.errors++;
      job.rows.push({ row: index + 2, outcome: "error", code, ...(field ? { field } : {}) });
    }
  }
  const successes = job.counts.created + job.counts.updated;
  job.status = !successes
    ? "failed"
    : job.counts.errors || job.counts.skipped
      ? "completed_with_errors"
      : "completed";
  job.undoable = createdIds.length > 0;
  return createdIds;
}
