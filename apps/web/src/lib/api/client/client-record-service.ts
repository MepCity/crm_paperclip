import type { ModuleApiName, RecordService } from "@crm/core/records";
import type { ClientRecordService, OrgMember, ViewSummary } from "./http-record-service";

/** Wraps a port `RecordService` with browser-only helpers for tests and fixtures. */
export function createClientRecordService(
  records: RecordService,
  extensions: { listUsers: () => Promise<readonly OrgMember[]> },
): ClientRecordService {
  return {
    ...records,
    listUsers: extensions.listUsers,
    async listViewSummaries(module: ModuleApiName): Promise<readonly ViewSummary[]> {
      const views = await records.listViews(module);
      return views.map(({ id, name, systemDefined, isDefault }) => ({
        id,
        name,
        systemDefined,
        isDefault,
      }));
    },
  };
}
