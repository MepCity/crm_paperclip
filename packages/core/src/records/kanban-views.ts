/** Header colouring styles of a Kanban column; research adds further values later. */
export const KANBAN_HEADER_STYLES = ["mono_color"] as const;
/** The value must be one of `KANBAN_HEADER_STYLES`. */
export type KanbanHeaderStyle = string;

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
}

export type KanbanViewInput = Omit<KanbanView, "id">;
