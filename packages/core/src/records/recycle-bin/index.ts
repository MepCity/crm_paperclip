import type { OrgContext } from "../../tenancy/types";
import type { ModuleApiName, RecordId } from "../contract";

export interface RecycleBinEntry {
  id: string;
  module: ModuleApiName;
  recordId: RecordId;
  name: string;
  deletedBy: string;
  deletedAt: string;
  expiresAt: string;
}
export interface RecycleBinQuery {
  module?: ModuleApiName;
  name?: string;
  deletedBy?: string;
  page?: number;
  perPage?: number;
}
export interface RecycleBinService {
  list(query?: RecycleBinQuery): Promise<{ entries: readonly RecycleBinEntry[]; total: number }>;
  restore(entryIds: readonly string[]): Promise<void>;
  purge(entryIds: readonly string[]): Promise<void>;
  empty(): Promise<void>;
}
export type RecycleBinServiceFactory = (context: OrgContext) => RecycleBinService;
