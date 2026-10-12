import type { Criteria, ModuleApiName, RecordData } from "@crm/core/records";

export interface SearchModuleState {
  columns: string[];
  page: number;
}

export interface AdvancedSearchFilterState {
  selectedModules: ModuleApiName[];
  activeFieldIds: string[];
  fieldCriteria?: Criteria;
}

export interface AdvancedSearchCardProps {
  module: ModuleApiName;
  moduleLabel: string;
  total: number;
  records: readonly RecordData[];
  page: number;
  perPage: number;
  columns: string[];
  onPageChange: (newPage: number) => void;
  onOpenManageColumns: () => void;
  orgSlug: string;
}
