export type NoteSortOrder = "recentLast" | "recentFirst";

/** Sorts by creation time without touching the input; equal times keep their incoming order. */
export function sortNotes<T extends { createdAt: string }>(
  items: readonly T[],
  order: NoteSortOrder,
): T[] {
  const direction = order === "recentLast" ? 1 : -1;
  return items
    .map((item, index) => ({ item, index, time: Date.parse(item.createdAt) }))
    .sort((a, b) => (a.time - b.time) * direction || a.index - b.index)
    .map(({ item }) => item);
}
