export type TimelineEventKind = string;

export interface TimelineEvent {
  id: string;
  at: string;
  kind: TimelineEventKind;
  title: string;
  actorName: string;
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
