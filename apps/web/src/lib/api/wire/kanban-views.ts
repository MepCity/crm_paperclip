import type { KanbanView, KanbanViewInput } from "@crm/core/records";
import { invalid, object } from "./codec";
import type { Operation, OperationRequest } from "./operations";

export type WireKanbanView = {
  id: string;
  name: string;
  categorize_by: string;
  aggregate_by: string | null;
  header_style: string;
  fields: readonly { api_name: string }[];
};
export type WireKanbanViewsResponse = { kanban_views: readonly WireKanbanView[] };

export function encodeKanbanView(view: KanbanView): WireKanbanView {
  return {
    id: view.id,
    name: view.name,
    categorize_by: view.categorizeBy,
    aggregate_by: view.aggregateBy,
    header_style: view.headerStyle,
    fields: view.fields.map((api_name) => ({ api_name })),
  };
}

export function decodeKanbanView(view: WireKanbanView): KanbanView {
  return {
    id: view.id,
    name: view.name,
    categorizeBy: view.categorize_by,
    aggregateBy: view.aggregate_by,
    headerStyle: view.header_style,
    fields: view.fields.map((field) => field.api_name),
  };
}

export function encodeKanbanViewInput(input: KanbanViewInput): Omit<WireKanbanView, "id"> {
  const { id: _id, ...rest } = encodeKanbanView({ id: "", ...input });
  return rest;
}

/** Strict decode of one write body item; semantic rules stay in the service. */
export function decodeKanbanViewInput(value: unknown): KanbanViewInput {
  const item = object(value, "kanban_views");
  const keys = ["name", "categorize_by", "aggregate_by", "header_style", "fields"];
  if (Object.keys(item).some((key) => !keys.includes(key))) invalid("kanban_views", "Unknown key.");
  if (typeof item.name !== "string") invalid("name");
  if (typeof item.categorize_by !== "string") invalid("categorizeBy");
  if (item.aggregate_by !== null && typeof item.aggregate_by !== "string") invalid("aggregateBy");
  if (typeof item.header_style !== "string") invalid("headerStyle");
  if (!Array.isArray(item.fields)) invalid("fields");
  return {
    name: item.name as string,
    categorizeBy: item.categorize_by as string,
    aggregateBy: item.aggregate_by as string | null,
    headerStyle: item.header_style as string,
    fields: (item.fields as unknown[]).map((field) => {
      const ref = object(field, "fields");
      if (typeof ref.api_name !== "string") invalid("fields");
      return ref.api_name as string;
    }),
  };
}

const moduleOf = (input: OperationRequest) =>
  input.params?.module ?? input.query.module ?? invalid("module", "Choose a module.");
const viewIdOf = (input: OperationRequest) => input.params?.viewId || invalid("viewId");
async function bodyOf(input: OperationRequest): Promise<unknown> {
  if (input.body !== undefined) return input.body;
  const text = await input.request?.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return invalid("data", "Send valid JSON.");
  }
}
async function inputOf(input: OperationRequest): Promise<KanbanViewInput> {
  const body = object(await bodyOf(input), "kanban_views");
  if (!Array.isArray(body.kanban_views) || body.kanban_views.length !== 1)
    invalid("kanban_views", "Send exactly one view.");
  return decodeKanbanViewInput(body.kanban_views[0]);
}

export const kanbanViewOperations = {
  kanbanViews: {
    method: "GET",
    path: "/crm/v9/settings/kanban_views",
    async run({ records }, input) {
      const views = await records.listKanbanViews(moduleOf(input));
      return { status: 200, body: { kanban_views: views.map(encodeKanbanView) } };
    },
  },
  kanbanView: {
    method: "GET",
    path: "/crm/v9/settings/kanban_views/{viewId}",
    async run({ records }, input) {
      const view = await records.getKanbanView(moduleOf(input), viewIdOf(input));
      return { status: 200, body: { kanban_views: [encodeKanbanView(view)] } };
    },
  },
  createKanbanView: {
    method: "POST",
    path: "/crm/v9/settings/kanban_views",
    async run({ records }, input) {
      const module = moduleOf(input);
      await records.getModule(module);
      const view = await records.createKanbanView(module, await inputOf(input));
      return { status: 200, body: { kanban_views: [encodeKanbanView(view)] } };
    },
  },
  updateKanbanView: {
    method: "PUT",
    path: "/crm/v9/settings/kanban_views/{viewId}",
    async run({ records }, input) {
      const module = moduleOf(input);
      await records.getModule(module);
      const view = await records.updateKanbanView(module, viewIdOf(input), await inputOf(input));
      return { status: 200, body: { kanban_views: [encodeKanbanView(view)] } };
    },
  },
} satisfies Record<string, Operation>;
