"use client";

import type { RecordHistoryEvent, RecordHistoryQuery } from "@crm/core/records";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { NoteContent } from "@/components/records/notes/note-content";
import { createHttpRecordService } from "@/lib/api/client/http-record-service";
import { useClientRecordService, useOrgSlug } from "@/lib/api/client/provider";
import { apiKeys } from "@/lib/api/client/query-keys";
import { decodeTimelineQuery, encodeTimelineFilters } from "@/lib/api/wire/timelines";
import { TimelineHistory, type TimelineHistoryProps } from "./timeline-history";
import type { TimelineEvent, TimelineHistoryFilterValue } from "./types";

const MODULE_NAMES: Record<string, string> = {
  notes: "Notes",
  attachments: "Attachments",
  tasks: "Tasks",
  calls: "Calls",
  meetings: "Events",
  emails: "Emails",
};
const RECORD_LABELS: Record<string, string> = {
  Leads: "Lead",
  Contacts: "Contact",
  Accounts: "Account",
  Deals: "Deal",
  Tasks: "Task",
  Events: "Meeting",
  Calls: "Call",
  Campaigns: "Campaign",
};

export function historyEventToTimeline(event: RecordHistoryEvent): TimelineEvent {
  const label = RECORD_LABELS[event.subject.module] ?? event.subject.module;
  const detail = (key: string) =>
    typeof event.payload?.[key] === "string" ? (event.payload[key] as string) : "";
  const name = event.subject.name ?? "";
  const changeLines = event.changes.map((change) => ({
    key: change.apiName,
    text: `${change.label} changed from ${change.oldDisplay ?? "—"} to ${change.newDisplay ?? "—"}`,
  }));
  const titles: Record<RecordHistoryEvent["kind"], string> = {
    record_created: `${label} created`,
    fields_updated: changeLines[0]?.text ?? `${label} updated`,
    record_deleted: `${label} deleted`,
    record_restored: `${label} restored`,
    record_converted: `${label} converted`,
    records_merged: `${label} merged`,
    related_record_added: `${label} added`,
    related_record_removed: `${label} removed`,
    note_added: name ? `Note added: ${name}` : "Note added",
    attachment_added: `Attachment added${name ? `: ${name}` : ""}`,
    attachment_deleted: `Attachment deleted${name ? `: ${name}` : ""}`,
  };
  return {
    id: event.id,
    at: event.occurredAt,
    kind: event.kind,
    title: titles[event.kind],
    actorName: event.actor.name,
    actorId: event.actor.id,
    moduleId: Object.keys(MODULE_NAMES).find((key) => MODULE_NAMES[key] === event.subject.module),
    body:
      event.kind === "note_added" ? (
        <NoteContent html={detail("body")} />
      ) : changeLines.length > (event.kind === "fields_updated" ? 1 : 0) ? (
        changeLines
          .slice(event.kind === "fields_updated" ? 1 : 0)
          .map((line) => <p key={line.key}>{line.text}</p>)
      ) : undefined,
  };
}

/** Reconcile temporary child projections by subject ID, never by title or timestamp. */
export function reconcileHistory(
  server: readonly RecordHistoryEvent[],
  transitional: readonly TimelineEvent[],
  query: RecordHistoryQuery,
): TimelineEvent[] {
  const ids = new Set(
    server.map((event) => `${event.subject.module}:${event.subject.recordId}:${event.kind}`),
  );
  const fallback = transitional.filter((event) => {
    const module = MODULE_NAMES[event.moduleId ?? ""];
    const kind =
      event.moduleId === "attachments"
        ? event.id.startsWith("attachment-deleted-")
          ? "attachment_deleted"
          : "attachment_added"
        : event.kind === "note"
          ? "note_added"
          : event.kind;
    const recordId = event.id
      .replace(/^note-/, "")
      .replace(/^attachment-(?:(?:added|deleted)-)?/, "");
    return (
      !ids.has(`${module}:${recordId}:${kind}`) &&
      (!query.modules?.length || query.modules.includes(module ?? "")) &&
      (!query.actorId || query.actorId === event.actorId) &&
      (!query.sources?.length || query.sources.includes("manual")) &&
      (!query.from || Date.parse(event.at) >= Date.parse(query.from)) &&
      (!query.to || Date.parse(event.at) < Date.parse(query.to))
    );
  });
  const result = server.map(historyEventToTimeline);
  // Insert transitional rows chronologically without reordering the server's commit sequence.
  for (const event of [...fallback].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))) {
    const index = result.findIndex((row) => Date.parse(row.at) < Date.parse(event.at));
    result.splice(index < 0 ? result.length : index, 0, event);
  }
  return result;
}

export function RecordTimelineHistory({
  module,
  recordId,
  events,
  ...props
}: TimelineHistoryProps & { module: string; recordId: string }) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  const http = useMemo(() => createHttpRecordService({ orgSlug }), [orgSlug]);
  const listHistory = service.listHistory ?? http.listHistory;
  const [emptySource, setEmptySource] = useState(false);
  const [query, setQuery] = useState<RecordHistoryQuery>({ perPage: 25 });
  const history = useInfiniteQuery({
    queryKey: [...apiKeys.timelines(orgSlug), module, recordId, query],
    enabled: !emptySource,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => listHistory(module, recordId, { ...query, pageToken: pageParam }),
    getNextPageParam: (page) => (page.moreRecords ? (page.nextPageToken ?? undefined) : undefined),
  });
  const server = [
    ...new Map(
      (history.data?.pages.flatMap((page) => page.events) ?? []).map((event) => [event.id, event]),
    ).values(),
  ];
  function apply(value: TimelineHistoryFilterValue) {
    const filters = encodeTimelineFilters(
      {
        modules: value.moduleIds.map((id) => MODULE_NAMES[id] ?? id),
        userId: value.userId,
        time: value.time,
        sources: value.sourceIds.filter((id): id is "manual" | "api" | "import" =>
          ["manual", "api", "import"].includes(id),
        ),
      },
      new Date(),
      props.format.timeZone,
    );
    // Automation sources have no server events yet; an automation-only selection is empty.
    setEmptySource(
      value.sourceIds.length > 0 &&
        !value.sourceIds.some((id) => ["manual", "api", "import"].includes(id)),
    );
    const params = new URLSearchParams({ per_page: "25" });
    if (filters) params.set("filters", filters);
    setQuery(decodeTimelineQuery(params));
  }
  return (
    <TimelineHistory
      {...props}
      events={emptySource ? [] : reconcileHistory(server, events, query)}
      serverFiltered
      onApply={apply}
      loading={!emptySource && history.isPending}
      error={!emptySource && history.isError}
      onRetry={() => void history.refetch()}
      hasMore={!emptySource && history.hasNextPage}
      loadingMore={history.isFetchingNextPage}
      onShowMore={() => void history.fetchNextPage()}
    />
  );
}
