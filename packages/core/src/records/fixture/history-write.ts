import { randomUUID } from "node:crypto";
import type { FieldDefinition, FieldValue, RecordData } from "../contract";
import type {
  HistoryChange,
  HistoryEventKind,
  HistorySource,
  RecordHistoryEvent,
} from "../history";
import type { FixtureModuleStore } from "./hooks";
import type { FixtureModuleBundle } from "./registry";

const audit = new Set([
  "id",
  "Created_By",
  "Created_Time",
  "Modified_By",
  "Modified_Time",
  "Last_Activity_Time",
]);
function comparable(value: FieldValue): unknown {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === "object") {
    if ("module" in value && "id" in value) return [value.module, value.id];
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, comparable((value as Record<string, FieldValue>)[key] ?? null)]),
    );
  }
  return value;
}
function display(value: FieldValue, field: FieldDefinition): string | null {
  if (value === null) return null;
  if (typeof value === "object") {
    if ("module" in value && "id" in value) return String(value.name ?? value.id);
    return JSON.stringify(value);
  }
  return (
    field.picklist?.find((option) => option.storedValue === value)?.displayValue ?? String(value)
  );
}
export function historyChanges(
  bundle: FixtureModuleBundle,
  before: RecordData,
  after: RecordData,
  snapshot: (value: FieldValue, previous: boolean) => FieldValue = (value) => value,
): HistoryChange[] {
  return bundle.metadata.fields.flatMap((field) => {
    if (audit.has(field.apiName)) return [];
    const old = before.fields[field.apiName] ?? null;
    const next = after.fields[field.apiName] ?? null;
    if (JSON.stringify(comparable(old)) === JSON.stringify(comparable(next))) return [];
    return [
      {
        apiName: field.apiName,
        label: field.label,
        dataType: field.dataType,
        old: snapshot(old, true),
        new: snapshot(next, false),
        oldDisplay: display(snapshot(old, true), field),
        newDisplay: display(snapshot(next, false), field),
      },
    ];
  });
}

/** Typed operation seam for later child/convert/restore coordinators. */
export interface FixtureHistoryOperation {
  module: string;
  recordId?: string;
  kind?: HistoryEventKind;
  mechanism: string;
}
export function historyBatch(
  before: Map<string, FixtureModuleStore>,
  after: Map<string, FixtureModuleStore>,
  bundles: Readonly<Record<string, FixtureModuleBundle>>,
  operation: FixtureHistoryOperation,
  commit: {
    sequence: number;
    occurredAt: string;
    actor: { id: string; name: string };
    source: HistorySource;
  },
): RecordHistoryEvent[] {
  const operationId = randomUUID();
  const events: RecordHistoryEvent[] = [];
  for (const [module, store] of after) {
    const bundle = bundles[module];
    if (!bundle) throw new Error("Missing module history metadata.");
    // Child history is supplied by later approved lifecycle slices.
    if (bundle.childModule || bundle.readOnly) continue;
    const previous = before.get(module);
    if (!previous) throw new Error("Missing staged module.");
    if (previous === store) continue;
    for (const id of new Set([...previous.records.keys(), ...store.records.keys()])) {
      const old = previous.records.get(id);
      const next = store.records.get(id);
      if (operation.kind === "records_merged" && module === operation.module && !next) continue;
      if (
        old &&
        next &&
        JSON.stringify(old) === JSON.stringify(next) &&
        !(operation.kind && module === operation.module && id === operation.recordId)
      )
        continue;
      const changes =
        old && next
          ? historyChanges(bundle, old, next, (value, previous) => {
              if (
                !value ||
                typeof value !== "object" ||
                !("module" in value) ||
                !("id" in value) ||
                typeof value.module !== "string" ||
                typeof value.id !== "string"
              )
                return value;
              const targetBundle = bundles[value.module];
              const target = (previous ? before : after).get(value.module)?.records.get(value.id);
              const name =
                targetBundle && target ? target.fields[targetBundle.displayNameField] : undefined;
              return {
                module: value.module,
                id: value.id,
                ...(typeof name === "string"
                  ? { name }
                  : typeof value.name === "string"
                    ? { name: value.name }
                    : {}),
              };
            })
          : [];
      const kind =
        module === operation.module && id === operation.recordId && operation.kind
          ? operation.kind
          : !old
            ? "record_created"
            : !next
              ? "record_deleted"
              : "fields_updated";
      if (kind === "fields_updated" && changes.length === 0) continue;
      const ref = { module, recordId: id };
      events.push({
        id: randomUUID(),
        schemaVersion: 1,
        stream: ref,
        subject: ref,
        kind,
        ...commit,
        operationId,
        ordinal: events.length,
        mechanism: operation.mechanism,
        changes,
        payload: null,
      });
    }
  }
  return events;
}
