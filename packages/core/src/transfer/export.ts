import { AppError, ValidationError } from "../errors";
import type { FieldDefinition, FieldValue, RecordService } from "../records/contract";
import { neutralizeCell, serializeCsv } from "./csv";
import { allView } from "./import";
import type { ExportRequest, TransferLimits } from "./types";

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
export async function exportRecords(
  records: RecordService,
  request: ExportRequest,
  fields: FieldDefinition[],
  limits: TransferLimits,
): Promise<{ body: string; rowCount: number; scope: string }> {
  if (request.ids && request.viewId)
    throw new ValidationError({ scope: ["Choose a view or selected records."] });
  if (request.ids && request.ids.length > limits.selectedIds)
    throw new AppError("export_too_large", "Too many selected records.");
  const view = request.ids
    ? undefined
    : request.viewId
      ? await records.getView(request.module, request.viewId)
      : await allView(records, request.module);
  const headers = ["Record Id", ...fields.map((field) => neutralizeCell(field.label))];
  const lines = [serializeCsv(headers, [])];
  let bytes = new TextEncoder().encode(lines[0]).byteLength;
  let rowCount = 0;
  if (bytes > limits.exportBytes)
    throw new AppError("export_too_large", "Export exceeds the byte budget.");
  const append = (record: Awaited<ReturnType<RecordService["get"]>>) => {
    rowCount++;
    if (rowCount > limits.exportRows)
      throw new AppError("export_too_large", "Export exceeds the row budget.");
    const row = [
      neutralizeCell(record.id),
      ...fields.map((field) => neutralizeCell(text(record.fields[field.apiName]))),
    ];
    // Serialize each complete row, preserving the serializer's newline and quoting rules.
    const line = serializeCsv(headers, [row]).slice(lines[0]?.length ?? 0);
    bytes += new TextEncoder().encode(line).byteLength;
    if (bytes > limits.exportBytes)
      throw new AppError("export_too_large", "Export exceeds the byte budget.");
    lines.push(line);
  };
  if (request.ids) {
    for (const id of new Set(request.ids)) append(await records.get(request.module, id));
  } else if (view) {
    let page = 1;
    while (true) {
      const result = await records.list(request.module, {
        viewId: view.id,
        page,
        perPage: 100,
        fields: fields.map((field) => field.apiName),
      });
      for (const record of result.records) append(record);
      if (!result.moreRecords) break;
      if (!result.records.length)
        throw new AppError("export_too_large", "Export pagination did not advance.");
      page++;
    }
  }
  return { body: lines.join(""), rowCount, scope: view?.name ?? "Selected records" };
}
