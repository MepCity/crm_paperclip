import type { ModuleApiName, OrgContext } from "@crm/core/records";

// ADR 0013 list contract only. No detail, mutation or execution capability.
export type RuleSummary = Readonly<{
  id: string;
  revision: string;
  module: ModuleApiName;
  name: string;
  description: string;
  enabled: boolean;
  position: number;
  kind: "workflow" | "assignment";
}>;
export type ReadFailure = Readonly<{
  code: "forbidden" | "not_found" | "unavailable" | "invalid_query";
}>;
export type ReadResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: ReadFailure }>;
export type RulePage = Readonly<{
  items: readonly RuleSummary[];
  nextCursor: string | null;
}>;
export interface AssignmentRulesPort {
  list(
    ctx: OrgContext,
    query: Readonly<{
      kind: "assignment";
      module?: ModuleApiName;
      cursor?: string;
      limit: number;
    }>,
  ): Promise<ReadResult<RulePage>>;
}
