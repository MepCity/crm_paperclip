"use client";

import type { KanbanView } from "@crm/core/records";
import { useSyncExternalStore } from "react";
import { useKanbanViews } from "@/lib/api/client/hooks";

let selectedId: string | null = null;
const listeners = new Set<() => void>();

export function setSelectedDealsKanbanViewId(id: string | null): void {
  selectedId = id;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The saved Kanban view that drives the Deals board; the first view until another is chosen. */
export function useSelectedDealsKanbanView(): {
  views: readonly KanbanView[];
  view: KanbanView | undefined;
} {
  const query = useKanbanViews("Deals");
  const id = useSyncExternalStore(
    subscribe,
    () => selectedId,
    () => null,
  );
  const views = query.data ?? [];
  const view = views.find((v) => v.id === id) ?? views[0];
  return { views, view };
}
