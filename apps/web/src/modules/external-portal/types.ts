import type { PortalModule, PortalModules, PortalUserTypeSettings } from "@crm/core/portals";

export type { PortalModule, PortalModules, PortalUserTypeSettings };

export interface PortalUser {
  email: string;
  name: string;
  userTypeId: string;
  recordId: string;
}

export interface PortalMeta {
  id: string;
  name: string;
  slug: string;
  status?: string;
  defaultLanguage?: string;
}

export interface PortalUserTypeConfig {
  id: string;
  name: string;
  modules: PortalModules;
  settings?: PortalUserTypeSettings;
}

export interface PortalSessionInfo {
  user: PortalUser;
  portal: PortalMeta | null;
  userType: PortalUserTypeConfig | null;
}

export interface PortalListPageInfo {
  page: number;
  per_page: number;
  more_records: boolean;
  sort_by: string;
  sort_order: "asc" | "desc";
}

export interface PortalListPage {
  data: readonly Record<string, unknown>[];
  info: PortalListPageInfo;
}

export interface PortalRecordDetail {
  data: Record<string, unknown>;
}
