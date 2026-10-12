import type { ModuleApiName, RecordService } from "@crm/core/records";
import type { ClientRecordService, OrgMember, ViewSummary } from "./http-record-service";

/** Wraps a port `RecordService` with browser-only helpers for tests and fixtures. */
export function createClientRecordService(
  records: RecordService,
  extensions: { listUsers: () => Promise<readonly OrgMember[]> },
): ClientRecordService {
  return {
    ...records,
    search: (query) => records.search(query),
    findDuplicateGroups: (module, fields) => records.findDuplicateGroups(module, fields),
    merge: (module, input) => records.merge(module, input),
    deduplicate: (module, fields) => records.deduplicate(module, fields),
    getHomeCurrency: () => records.getHomeCurrency(),
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
