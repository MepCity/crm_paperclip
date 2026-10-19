"use client";

import type { Criteria, FieldValue, ModuleApiName, RecordData } from "@crm/core/records";
import { useMemo } from "react";
import type { TimelineEvent } from "@/components/records/detail/timeline";
import { useRecordList, useUsers, useViews } from "@/lib/api/client/hooks";
import { NoteContent } from "./note-content";

// Record modules whose Timeline History shows notes (same parents as the Notes card).
export const NOTE_TIMELINE_PARENTS: readonly string[] = ["Leads", "Contacts", "Accounts", "Deals"];

// Same page size and filter as the Notes card so both share one cached list.
const PAGE_SIZE = 100;

function text(value: FieldValue | undefined): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

export function noteToTimelineEvent(
  record: RecordData,
  userNames: ReadonlyMap<string, string>,
): TimelineEvent {
  const by = record.fields.Created_By ?? record.fields.Owner;
  const actorId = by && typeof by === "object" && "id" in by ? String(by.id) : text(by);
  const actorName =
    by && typeof by === "object" && "name" in by && typeof by.name === "string"
      ? by.name
      : ((actorId && userNames.get(actorId)) ?? "");
  const title = text(record.fields.Note_Title);
  return {
    id: `note-${record.id}`,
    at: text(record.fields.Created_Time) ?? new Date(0).toISOString(),
    kind: "note",
    moduleId: "notes",
    title: title ? `Note added: ${title}` : "Note added",
    actorName,
    actorId: actorId ?? undefined,
    body: <NoteContent html={text(record.fields.Note_Content) ?? ""} />,
  };
}

/** Notes of one record as Timeline History events (inventory 80, 81, 108). */
export function useRecordNoteEvents(
  parentModule: ModuleApiName,
  parentId: string,
): readonly TimelineEvent[] {
  const views = useViews("Notes");
  const users = useUsers();
  const viewId = useMemo(
    () => views.data?.find((view) => view.isDefault)?.id ?? views.data?.[0]?.id ?? null,
    [views.data],
  );
  const filters = useMemo(
    () =>
      ({
        field: "Parent_Id",
        comparator: "equal",
        value: { module: parentModule, id: parentId },
      }) as Criteria,
    [parentModule, parentId],
  );
  const query = useMemo(
    () => ({ viewId: viewId ?? "pending", page: 1, perPage: PAGE_SIZE, filters }),
    [viewId, filters],
  );
  // Notes only hang off Leads, Contacts, Accounts and Deals; asking for Activities (Tasks,
  // Meetings, Calls) or later modules returns 400 and breaks those record pages.
  const enabled = viewId !== null && NOTE_TIMELINE_PARENTS.includes(parentModule);
  const list = useRecordList("Notes", query, { enabled });
  return useMemo(() => {
    if (!enabled) return [];
    const names = new Map((users.data ?? []).map((member) => [member.userId, member.name]));
    return ((list.data?.records ?? []) as readonly RecordData[]).map((record) =>
      noteToTimelineEvent(record, names),
    );
  }, [enabled, list.data, users.data]);
}
