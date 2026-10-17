import type { ReactNode } from "react";

export type TimelineEventKind = string;

export interface TimelineEvent {
  id: string;
  at: string;
  kind: TimelineEventKind;
  title: string;
  actorName: string;
  /** Filter-module id this event belongs to (e.g. "notes"); matched by the Modules filter. */
  moduleId?: string;
  actorId?: string;
  /** Rich body under the title; clamped with a Show More toggle when it overflows. */
  body?: ReactNode;
}

export type TimelineTimePreset = "any" | "today" | "yesterday" | "last7" | "last30";

export interface TimelineHistoryFilterValue {
  moduleIds: readonly string[];
  userId: string | null;
  time: TimelineTimePreset;
  sourceIds: readonly string[];
}

export interface TimelineFilterOption {
  id: string;
  label: string;
}

export interface TimelineSubtab {
  id: string;
  label: string;
}
