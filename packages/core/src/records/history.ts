import type { FieldDataType, FieldValue, JsonObject } from "./contract";

export type HistorySource = "manual" | "api" | "import";
export type HistoryEventKind =
  | "record_created"
  | "fields_updated"
  | "record_deleted"
  | "related_record_added"
  | "related_record_removed"
  | "note_added"
  | "attachment_added"
  | "attachment_deleted"
  | "records_merged"
  | "record_converted"
  | "record_restored";
export interface HistoryRef {
  module: string;
  recordId: string;
  name?: string | null;
}
export interface HistoryChange {
  apiName: string;
  label: string;
  dataType: FieldDataType;
  old: FieldValue;
  new: FieldValue;
  oldDisplay: string | null;
  newDisplay: string | null;
}
export interface RecordHistoryEvent {
  id: string;
  schemaVersion: 1;
  stream: HistoryRef;
  subject: HistoryRef;
  kind: HistoryEventKind;
  actor: { id: string; name: string };
  occurredAt: string;
  sequence: number;
  operationId: string;
  ordinal: number;
  source: HistorySource;
  mechanism: string | null;
  changes: readonly HistoryChange[];
  payload: JsonObject | null;
}
export interface RecordHistoryQuery {
  perPage: number;
  pageToken?: string | null;
  modules?: readonly string[];
  actorId?: string | null;
  from?: string | null;
  to?: string | null;
  sources?: readonly HistorySource[];
}
export interface RecordHistoryPage {
  events: readonly RecordHistoryEvent[];
  nextPageToken: string | null;
  moreRecords: boolean;
}
export interface RecordHistoryService {
  list(module: string, recordId: string, query: RecordHistoryQuery): Promise<RecordHistoryPage>;
}
