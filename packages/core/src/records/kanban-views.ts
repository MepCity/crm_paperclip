/** Header colouring styles of a Kanban column; research adds further values later. */
export const KANBAN_HEADER_STYLES = ["mono_color"] as const;
/** The value must be one of `KANBAN_HEADER_STYLES`. */
export type KanbanHeaderStyle = string;

/** Who can see a view; a "selected users" choice is not available yet. */
export const KANBAN_SHARE_TARGETS = ["only_me", "everyone"] as const;
export type KanbanSharedTo = (typeof KANBAN_SHARE_TARGETS)[number];

/** A user reference: id plus display name. */
export interface KanbanViewUser {
  id: string;
  name: string;
}

/** A saved Kanban configuration of one module. */
export interface KanbanView {
  id: string;
  name: string;
  /** API name of the single-select picklist field that forms the columns. */
  categorizeBy: string;
  /** API name of the currency/number field summed per column, or null. */
  aggregateBy: string | null;
  headerStyle: KanbanHeaderStyle;
  /** Card field API names in display order. */
  fields: readonly string[];
  sharedTo: KanbanSharedTo;
  createdBy: KanbanViewUser;
  modifiedBy: KanbanViewUser;
}

/** `sharedTo` defaults to "only_me" on create and is ignored on update. */
export type KanbanViewInput = Omit<KanbanView, "id" | "sharedTo" | "createdBy" | "modifiedBy"> & {
  sharedTo?: KanbanSharedTo;
};
