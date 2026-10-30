import { AppError, isAppError, ValidationError } from "../errors";
import type {
  FieldDefinition,
  FieldValue,
  ModuleMetadata,
  RecordService,
} from "../records/contract";
import { serializeCsv } from "./csv";
import { allView, nameFieldOf } from "./import";
import { isReferenceType } from "./mapping";
import {
  type Actor,
  type ExportRequest,
  englishLocale,
  type TransferLimits,
  type TransferLocale,
} from "./types";

export function exportFields(
  fields: readonly FieldDefinition[],
  request: ExportRequest,
): FieldDefinition[] {
  // The identifier is always emitted once as the first column.
  const allowed = fields.filter((field) => field.apiName !== "id" && field.views.view);
  const selected =
    request.fields === "all"
      ? []
      : "include" in request.fields
        ? request.fields.include
        : request.fields.exclude;
  if (selected.some((name) => name !== "id" && !allowed.some((field) => field.apiName === name)))
    throw new AppError("field_not_allowed", "Choose visible fields.");
  return allowed.filter(
    (field) =>
      request.fields === "all" ||
      ("include" in request.fields
        ? request.fields.include.includes(field.apiName)
        : !request.fields.exclude.includes(field.apiName)),
  );
}
function text(value: FieldValue | undefined): string {
  if (value == null) return "";
  if (typeof value === "object") return "id" in value ? String(value.id) : JSON.stringify(value);
  return String(value);
}
export interface ExportContext {
  locale?: TransferLocale;
  /** Members of the organization; owner ids are written as names. */
  actors?: readonly Actor[];
}
export async function exportRecords(
  records: RecordService,
  request: ExportRequest,
  fields: FieldDefinition[],
  limits: TransferLimits,
  context: ExportContext = {},
): Promise<{ body: string; rowCount: number; scope: string }> {
  const locale = context.locale ?? englishLocale;
  const actorNames = new Map((context.actors ?? []).map((actor) => [actor.id, actor.name]));
  const modules = new Map<string, ModuleMetadata>();
  const names = new Map<string, string>();
  const displayName = async (module: string, id: string): Promise<string> => {
    const key = `${module}:${id}`;
    const known = names.get(key);
    if (known !== undefined) return known;
    let name = "";
    try {
      let metadata = modules.get(module);
      if (!metadata) {
        metadata = await records.getModule(module);
        modules.set(module, metadata);
      }
      const nameField = nameFieldOf(metadata);
      const value = nameField ? (await records.get(module, id)).fields[nameField.apiName] : null;
      name = typeof value === "string" ? value : "";
    } catch (error) {
      if (!isAppError(error)) throw error;
    }
    names.set(key, name);
    return name;
  };
  /** Name column first; reference fields also get an id column beside it. */
  const cells = async (field: FieldDefinition, value: FieldValue | undefined) => {
    if (field.picklist && typeof value === "string") {
      // Stage keys preserve the source stage even when its UI label is expanded.
      if (request.module === "Deals" && field.apiName === "Stage") return [value];
      // Picklists are written with the option's display label; import accepts either form.
      const option = field.picklist.find((item) => item.storedValue === value);
      return [option?.displayValue ?? value];
    }
    if (!isReferenceType(field.dataType)) return [text(value)];
    if (value == null || value === "") return ["", ""];
    if (typeof value === "string")
      return [field.dataType === "ownerlookup" ? (actorNames.get(value) ?? value) : value, value];
    if (typeof value === "object" && "id" in value) {
      const id = String(value.id);
      const own = "name" in value && typeof value.name === "string" ? value.name : "";
      const module = "module" in value ? String(value.module) : (field.lookup?.module ?? "");
      return [own || (module ? await displayName(module, id) : "") || id, id];
    }
    return [text(value), ""];
  };
  if (request.ids && request.viewId)
    throw new ValidationError({ scope: ["Choose a view or selected records."] });
  if (request.ids && request.ids.length > limits.selectedIds)
    throw new AppError("export_too_large", "Too many selected records.");
  const view = request.ids
    ? undefined
    : request.viewId
      ? await records.getView(request.module, request.viewId)
      : await allView(records, request.module);
  const headers = [
    locale.recordIdLabel,
    ...fields.flatMap((field) => {
      const label = locale.fieldLabel(request.module, field);
      return isReferenceType(field.dataType) ? [label, locale.idColumnLabel(label)] : [label];
    }),
  ];
  const lines = [serializeCsv(headers, [])];
  let bytes = new TextEncoder().encode(lines[0]).byteLength;
  let rowCount = 0;
  if (bytes > limits.exportBytes)
    throw new AppError("export_too_large", "Export exceeds the byte budget.");
  const append = async (record: Awaited<ReturnType<RecordService["get"]>>) => {
    rowCount++;
    if (rowCount > limits.exportRows)
      throw new AppError("export_too_large", "Export exceeds the row budget.");
    const row = [
      record.id,
      ...(
        await Promise.all(fields.map((field) => cells(field, record.fields[field.apiName])))
      ).flat(),
    ];
    // Serialize each complete row, preserving the serializer's newline and quoting rules.
    const line = serializeCsv(headers, [row]).slice(lines[0]?.length ?? 0);
    bytes += new TextEncoder().encode(line).byteLength;
    if (bytes > limits.exportBytes)
      throw new AppError("export_too_large", "Export exceeds the byte budget.");
    lines.push(line);
  };
  if (request.ids) {
    for (const id of new Set(request.ids)) await append(await records.get(request.module, id));
  } else if (view) {
    let page = 1;
    while (true) {
      const result = await records.list(request.module, {
        viewId: view.id,
        page,
        perPage: 100,
        fields: fields.map((field) => field.apiName),
      });
      for (const record of result.records) await append(record);
      if (!result.moreRecords) break;
      if (!result.records.length)
        throw new AppError("export_too_large", "Export pagination did not advance.");
      page++;
    }
  }
  return { body: lines.join(""), rowCount, scope: view?.name ?? "Selected records" };
}
