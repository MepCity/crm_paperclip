import type { Comparator, FieldDataType, FieldValue } from "@crm/core/records";

/** Structural subset of listMembers: no core runtime or database dependency. */
export type WireMember = { userId: string; name: string; email: string };
export type WireOwner = { id: string; name?: string; email?: string };
export type WireValue = FieldValue | WireOwner;
export type WireRecord = { id: string } & Record<string, WireValue>;
export type WireCriteriaValue = FieldValue | readonly FieldValue[] | { name: "${CURRENTUSER}" };
export type WireCriteria =
  | { field: { api_name: string }; comparator: Comparator; value: WireCriteriaValue }
  | { group_operator: "AND" | "OR"; group: readonly WireCriteria[] };
export type WireField = {
  api_name: string;
  field_label: string;
  data_type: FieldDataType;
  system_mandatory: boolean;
  read_only: boolean;
  unique: { enforced?: boolean };
  length?: number;
  pick_list_values?: readonly { display_value: string; actual_value: string }[];
  lookup?: { module: { api_name: string } };
};
export type WireModule = { api_name: string; singular_label: string; plural_label: string };
export type WireLayout = {
  sections: readonly {
    display_label: string;
    column_count: number;
    fields: readonly WireField[];
  }[];
};
export type WireView = {
  id: string;
  name: string;
  system_defined: boolean;
  default: boolean;
  fields: readonly { api_name: string }[];
  criteria: WireCriteria | null;
  sort_by: string | null;
  sort_order: "asc" | "desc" | null;
};
export type WireInfo = {
  per_page: number;
  count: number;
  page: number;
  sort_by: string;
  sort_order: "asc" | "desc";
  more_records: boolean;
};
export type WireUser = { id: string; full_name: string; email: string };
export type WireWriteBody = { data: readonly Record<string, WireValue>[] };
export type WireWriteResult = { data: readonly { id: string }[] };

export type WireViewSummary = Pick<WireView, "id" | "name" | "system_defined" | "default">;
export type WirePageInfo = Pick<WireInfo, "per_page" | "count" | "page" | "more_records">;
export type WireModuleResponse = { modules: readonly WireModule[] };
export type WireFieldsResponse = { fields: readonly WireField[] };
export type WireLayoutsResponse = { layouts: readonly WireLayout[] };
export type WireViewsResponse = {
  custom_views: readonly WireViewSummary[];
  info: WirePageInfo & { default?: string };
};
export type WireViewResponse = { custom_views: readonly WireView[] };
export type WireBulkResponse = { data: readonly WireRecord[]; info: WireInfo };
export type WireCountResponse = { count: number };
export type WireRecordResponse = { data: readonly WireRecord[] };
export type WireUsersResponse = { users: readonly WireUser[]; info: WirePageInfo };
export type WireRestrictions = { filters?: WireCriteria; search?: string };
