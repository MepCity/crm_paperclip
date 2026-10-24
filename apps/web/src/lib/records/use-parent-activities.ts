"use client";

import { formatDate, formatDateTime } from "@crm/core/format";
import type { FieldValue, ModuleApiName, RecordData } from "@crm/core/records";
import { activityState } from "@crm/core/records/activities";
import { useEffect, useMemo, useState } from "react";
import { useAllRecordPages, useUsers, useViews } from "@/lib/api/client/hooks";
import { DEFAULT_FORMAT } from "@/lib/locale";
import {
  type ActivityKind,
  type ActivityVariant,
  buildParentActivityCategories,
  type ParentActivityCategory,
  parentActivityCriteria,
} from "./parent-activities";

const PAGE_SIZE = 100;

const MODULE_BY_KIND: Record<ActivityKind, ModuleApiName> = {
  task: "Tasks",
  meeting: "Events",
  call: "Calls",
};

export interface ParentActivitiesResult {
  isLoading: boolean;
  isError: boolean;
  open: ParentActivityCategory[];
  closed: ParentActivityCategory[];
  openCount: number;
  closedCount: number;
}

function useActivityList(module: ModuleApiName, parentModule: string, parentId: string) {
  const views = useViews(module);
  const viewId = useMemo(
    () => views.data?.find((view) => view.isDefault)?.id ?? views.data?.[0]?.id ?? null,
    [views.data],
  );
  const filters = useMemo(
    () => parentActivityCriteria(parentModule, parentId),
    [parentModule, parentId],
  );
  const query = useMemo(
    () => ({ viewId: viewId ?? "pending", perPage: PAGE_SIZE, filters: filters ?? undefined }),
    [viewId, filters],
  );
  const list = useAllRecordPages(module, query, { enabled: viewId !== null && filters !== null });
  const records = useMemo(() => (list.data ?? []) as readonly RecordData[], [list.data]);
  return {
    records,
    isLoading: views.isLoading || (viewId !== null && filters !== null && list.isLoading),
    isError: views.isError || list.isError,
  };
}

export function useParentActivities(
  parentModule: string,
  parentId: string,
  recordPath: (module: ModuleApiName, id: string) => string,
): ParentActivitiesResult {
  const tasks = useActivityList("Tasks", parentModule, parentId);
  const meetings = useActivityList("Events", parentModule, parentId);
  const calls = useActivityList("Calls", parentModule, parentId);
  const users = useUsers();
  const parts = [tasks, meetings, calls];
  const isLoading = parts.some((part) => part.isLoading) || users.isLoading;
  const isError = parts.some((part) => part.isError);

  const [now, setNow] = useState(() => new Date());
  const nextBoundary = useMemo(() => {
    let next = Number.POSITIVE_INFINITY;
    for (const record of meetings.records) {
      const end = record.fields.End_DateTime;
      const time = typeof end === "string" ? Date.parse(end) : Number.NaN;
      if (time > now.getTime() && time < next) next = time;
    }
    return next;
  }, [meetings.records, now]);
  useEffect(() => {
    if (!Number.isFinite(nextBoundary)) return;
    const delay = Math.min(Math.max(nextBoundary - Date.now(), 0) + 50, 2 ** 31 - 1);
    const timer = setTimeout(() => setNow(new Date()), delay);
    return () => clearTimeout(timer);
  }, [nextBoundary]);

  return useMemo(() => {
    const ownerById = new Map((users.data ?? []).map((member) => [member.userId, member.name]));
    const records = { task: tasks.records, meeting: meetings.records, call: calls.records };
    const build = (variant: ActivityVariant) =>
      buildParentActivityCategories({
        records,
        variant,
        now,
        classify: (kind, record, now) => activityState(MODULE_BY_KIND[kind], record, now),
        recordPath: (kind, id) => recordPath(MODULE_BY_KIND[kind], id),
        formatDate: (iso) => formatDate(iso, DEFAULT_FORMAT),
        formatDateTime: (iso) => formatDateTime(iso, DEFAULT_FORMAT),
        ownerName: (owner: FieldValue | undefined) => {
          if (owner && typeof owner === "object" && "name" in owner) {
            return typeof owner.name === "string" && owner.name !== "" ? owner.name : null;
          }
          if (owner && typeof owner === "object" && "id" in owner) {
            return ownerById.get(String(owner.id)) ?? null;
          }
          return typeof owner === "string" ? (ownerById.get(owner) ?? owner) : null;
        },
      });
    const open = build("open");
    const closed = build("closed");
    const sum = (cats: ParentActivityCategory[]) => cats.reduce((n, c) => n + c.count, 0);
    return {
      isLoading,
      isError,
      open,
      closed,
      openCount: sum(open),
      closedCount: sum(closed),
    };
  }, [
    tasks.records,
    meetings.records,
    calls.records,
    users.data,
    isLoading,
    isError,
    recordPath,
    now,
  ]);
}

const noPath = () => "#";

/** Rail badge counts for a parent record's Open / Closed Activities cards. */
export function useParentActivityBadges(parentModule: string, parentId: string) {
  const { openCount, closedCount } = useParentActivities(parentModule, parentId, noPath);
  return useMemo(
    () => ({ openActivities: openCount, closedActivities: closedCount }),
    [openCount, closedCount],
  );
}
