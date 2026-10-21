import { randomUUID } from "node:crypto";
import { activityParentIds, activityParentModules, activityRules } from "../activities";
import type { RecordData } from "../contract";
import type { HistoryEventKind, HistoryRef, RecordHistoryEvent } from "../history";
import { attachmentParent } from "./attachments/hooks";
import type { FixtureModuleStore } from "./hooks";

/** Stage related events in the same commit as records, without copying note bodies. */
export function relatedFilterHistory(
  before: Map<string, FixtureModuleStore>,
  after: Map<string, FixtureModuleStore>,
  direct: readonly RecordHistoryEvent[],
  commit: Pick<RecordHistoryEvent, "actor" | "occurredAt" | "sequence" | "source">,
  operationId: string,
): RecordHistoryEvent[] {
  const events: RecordHistoryEvent[] = [];
  const append = (
    stream: HistoryRef,
    module: string,
    id: string,
    kind: HistoryEventKind,
    original?: RecordHistoryEvent,
    name?: string,
    payload: RecordHistoryEvent["payload"] = null,
  ) => {
    events.push({
      id: randomUUID(),
      schemaVersion: 1,
      stream,
      subject: { module, recordId: id, ...(name ? { name } : {}) },
      kind,
      ...commit,
      operationId,
      ordinal: direct.length + events.length,
      mechanism: original?.mechanism ?? null,
      changes: original?.changes ?? [],
      payload,
    });
  };
  const parentOf = (record: RecordData | undefined, stores: Map<string, FixtureModuleStore>) => {
    let ref = attachmentParent(record?.fields.Parent_Id);
    if (ref?.module === "Notes")
      ref = attachmentParent(stores.get("Notes")?.records.get(ref.id)?.fields.Parent_Id);
    return ref ? { module: ref.module, recordId: ref.id } : undefined;
  };
  for (const module of ["Notes", "Attachments"]) {
    const oldStore = before.get(module);
    const nextStore = after.get(module);
    if (oldStore === nextStore) continue;
    for (const id of new Set([
      ...(oldStore?.records.keys() ?? []),
      ...(nextStore?.records.keys() ?? []),
    ])) {
      const old = oldStore?.records.get(id);
      const next = nextStore?.records.get(id);
      if (old === next) continue;
      if (module === "Notes") {
        if (!old && next) {
          const parent = parentOf(next, after);
          if (parent) append(parent, module, id, "note_added");
        }
      } else {
        const wasReady = old?.fields.$state === "ready";
        const ready = next?.fields.$state === "ready";
        const parent = parentOf(next ?? old, next ? after : before);
        const name = String((next ?? old)?.fields.File_Name ?? "");
        const direct = attachmentParent((next ?? old)?.fields.Parent_Id);
        const payload = direct?.module === "Notes" ? { noteId: direct.id } : null;
        if (parent && ready && !wasReady)
          append(parent, module, id, "attachment_added", undefined, name, payload);
        if (parent && wasReady && !next)
          append(parent, module, id, "attachment_deleted", undefined, name, payload);
      }
    }
  }
  for (const event of direct) {
    if (!activityRules[event.subject.module]) continue;
    const old = before.get(event.subject.module)?.records.get(event.subject.recordId);
    const next = after.get(event.subject.module)?.records.get(event.subject.recordId);
    for (const parentModule of activityParentModules) {
      const oldIds = new Set(old ? activityParentIds(parentModule, old) : []);
      const nextIds = new Set(next ? activityParentIds(parentModule, next) : []);
      for (const id of new Set([...oldIds, ...nextIds])) {
        const kind =
          old && next && oldIds.has(id) !== nextIds.has(id)
            ? nextIds.has(id)
              ? "related_record_added"
              : "related_record_removed"
            : event.kind;
        append(
          { module: parentModule, recordId: id },
          event.subject.module,
          event.subject.recordId,
          kind,
          event,
        );
      }
    }
  }
  return events;
}
