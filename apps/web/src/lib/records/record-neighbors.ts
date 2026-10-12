import type { RecordId } from "@crm/core/records";

export type RecordNeighborIds = {
  previousId: RecordId | null;
  nextId: RecordId | null;
};

/** Neighbors on one loaded list page; edges return null ids (arrows disabled). */
export function recordNeighborsOnPage(
  orderedIds: readonly RecordId[],
  currentId: RecordId,
): RecordNeighborIds {
  const index = orderedIds.indexOf(currentId);
  if (index === -1) return { previousId: null, nextId: null };
  return {
    previousId: index > 0 ? (orderedIds[index - 1] ?? null) : null,
    nextId: index < orderedIds.length - 1 ? (orderedIds[index + 1] ?? null) : null,
  };
}
