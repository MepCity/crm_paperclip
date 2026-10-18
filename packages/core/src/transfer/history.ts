import { NotFoundError } from "../errors";
import type { Charset, ExportJob, ImportJob, TransferModule } from "./types";

export const UPLOAD_TTL = 30 * 60 * 1000;
export const HISTORY_TTL = 7 * 24 * 60 * 60 * 1000;
export interface Upload {
  id: string;
  userId: string;
  module: TransferModule;
  fileName: string;
  charset: Charset;
  headers: string[];
  rows: string[][];
  at: number;
}
export interface StoredImport {
  job: ImportJob;
  createdIds: string[];
}
export interface StoredExport {
  job: ExportJob;
  body?: string;
  fields: string[];
}
interface History {
  uploads: Map<string, Upload>;
  imports: Map<string, StoredImport>;
  exports: Map<string, StoredExport>;
}
/** One store per service instance. The HTTP composition root must reuse its instance. */
export function createHistory() {
  const orgs = new Map<string, History>();
  return (orgId: string, now: number): History => {
    let history = orgs.get(orgId);
    if (!history) {
      history = { uploads: new Map(), imports: new Map(), exports: new Map() };
      orgs.set(orgId, history);
    }
    for (const [id, upload] of history.uploads)
      if (now - upload.at >= UPLOAD_TTL) history.uploads.delete(id);
    for (const entries of [history.imports, history.exports])
      for (const [id, entry] of entries)
        if (now - Date.parse(entry.job.createdAt) >= HISTORY_TTL) entries.delete(id);
    return history;
  };
}
export function stored<T>(entries: Map<string, T>, id: string): T {
  const entry = entries.get(id);
  if (!entry) throw new NotFoundError();
  return entry;
}
export function newest<T extends { createdAt: string }>(jobs: T[]): T[] {
  return structuredClone(
    [...jobs].reverse().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}
