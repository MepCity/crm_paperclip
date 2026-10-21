import type { DocumentsRepository, DocumentsSnapshot } from "./types";

/** Synthetic, process-local repository. A provider allows revocations/owner changes per read. */
export function createFixtureDocumentsRepository(
  source: DocumentsSnapshot | (() => DocumentsSnapshot),
): DocumentsRepository {
  return {
    async read(organizationId) {
      const snapshot = typeof source === "function" ? source() : source;
      return structuredClone({
        spaces: snapshot.spaces.filter((row) => row.organizationId === organizationId),
        nodes: snapshot.nodes.filter((row) => row.organizationId === organizationId),
        memberships: snapshot.memberships.filter((row) => row.organizationId === organizationId),
        grants: snapshot.grants.filter((row) => row.organizationId === organizationId),
      });
    },
  };
}
