"use client";

import { formatDate, formatDateTime } from "@crm/core/format";
import type { FieldValue, ModuleApiName, RecordData } from "@crm/core/records";
import { activityState } from "@crm/core/records/activities";
import { useMemo } from "react";
import { useRecordList, useUsers, useViews } from "@/lib/api/client/hooks";
import { DEFAULT_FORMAT } from "@/lib/locale";
import {
  type ActivityKind,
  type ActivityVariant,
  buildParentActivityCategories,
  type ParentActivityCategory,
  parentActivityCriteria,
} from "./parent-activities";

const PAGE_SIZE = 100;

/**
 * Calls has no records service until MEP-468 lands; while false the Calls column is zero rows
 * and no request is made. Flip to true when the Calls service is on main.
 */
export const CALLS_SERVICE_AVAILABLE = false;

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

function useActivityList(
  module: ModuleApiName,
  parentModule: string,
  parentId: string,
  available = true,
) {
  const views = useViews(module, { enabled: available });
  const viewId = useMemo(
    () => views.data?.find((view) => view.isDefault)?.id ?? views.data?.[0]?.id ?? null,
    [views.data],
  );
  const filters = useMemo(
    () => parentActivityCriteria(parentModule, parentId),
    [parentModule, parentId],
  );
  const query = useMemo(
    () => ({
      viewId: viewId ?? "pending",
      page: 1,
      perPage: PAGE_SIZE,
      filters: filters ?? undefined,
    }),
    [viewId, filters],
  );
  const list = useRecordList(module, query, {
    enabled: available && viewId !== null && filters !== null,
  });
  // A module without a service (Calls before it lands) is treated as zero rows, not an error.
  const missing = views.isError;
  return {
    records: (list.data?.records ?? []) as readonly RecordData[],
    isLoading: available && !missing && (views.isLoading || (viewId !== null && list.isLoading)),
    isError: !missing && list.isError,
  };
}

export function useParentActivities(
  parentModule: string,
  parentId: string,
  recordPath: (module: ModuleApiName, id: string) => string,
): ParentActivitiesResult {
  const tasks = useActivityList("Tasks", parentModule, parentId);
  const meetings = useActivityList("Events", parentModule, parentId);
  const calls = useActivityList("Calls", parentModule, parentId, CALLS_SERVICE_AVAILABLE);
  const users = useUsers();
  const parts = [tasks, meetings, calls];
  const isLoading = parts.some((part) => part.isLoading) || users.isLoading;
  const isError = parts.some((part) => part.isError);

  return useMemo(() => {
    const ownerById = new Map((users.data ?? []).map((member) => [member.userId, member.name]));
    const records = { task: tasks.records, meeting: meetings.records, call: calls.records };
    const build = (variant: ActivityVariant) =>
      buildParentActivityCategories({
        records,
        variant,
        now: new Date(),
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
  }, [tasks.records, meetings.records, calls.records, users.data, isLoading, isError, recordPath]);
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
