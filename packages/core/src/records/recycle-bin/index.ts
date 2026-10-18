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
  /** Case-insensitive substring of the deletion actor; combines with exact deletedBy. */
  deletedByContains?: string;
  /** UTC calendar day or minute until OrgContext provides a timezone. */
  deletedOn?: { date: string; time?: string };
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
