import { NotFoundError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type { ModuleMetadata } from "../contract";
import { KANBAN_HEADER_STYLES, type KanbanView, type KanbanViewInput } from "../kanban-views";

interface ModuleKanbanState {
  views: KanbanView[];
  nextId: bigint;
}

const storeKey = Symbol.for("mepcity.records.fixture.kanban-views");
const runtime = globalThis as typeof globalThis & {
  [storeKey]?: Map<string, Map<string, ModuleKanbanState>>;
};
runtime[storeKey] ??= new Map();
const stores = runtime[storeKey];

const FIRST_ID = 6000000000000000001n;
const NUMERIC_TYPES = new Set(["currency", "integer", "double", "bigint"]);

const seeds: Readonly<Record<string, KanbanViewInput & { name: string }>> = {
  Deals: {
    name: "STAGEVIEW",
    categorizeBy: "Stage",
    aggregateBy: "Amount",
    headerStyle: "mono_color",
    fields: [
      "Deal_Name",
      "Stage",
      "Account_Name",
      "Owner",
      "Contact_Name",
      "Amount",
      "Closing_Date",
    ],
  },
};

const copy = <T>(value: T): T => structuredClone(value);

function stateFor(orgId: string, module: string): ModuleKanbanState {
  let org = stores.get(orgId);
  if (!org) {
    org = new Map();
    stores.set(orgId, org);
  }
  let state = org.get(module);
  if (!state) {
    state = { views: [], nextId: FIRST_ID };
    const seed = seeds[module];
    if (seed) state.views.push({ id: String(state.nextId++), ...copy(seed) });
    org.set(module, state);
  }
  return state;
}

/** Interim rules; validation errors use the same field-code shape as record forms. */
function validate(
  metadata: ModuleMetadata,
  displayNameField: string,
  input: KanbanViewInput,
  siblings: readonly KanbanView[],
): KanbanViewInput {
  const errors: Record<string, string[]> = {};
  const fieldOf = (name: string) => metadata.fields.find((field) => field.apiName === name);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) errors.name = ["Enter a name."];
  else if (siblings.some((view) => view.name.toLowerCase() === name.toLowerCase()))
    errors.name = ["A view with this name already exists."];
  const categorize = fieldOf(input.categorizeBy);
  if (categorize?.dataType !== "picklist")
    errors.categorizeBy = ["Choose a single-select picklist field."];
  if (input.aggregateBy !== null) {
    const aggregate = fieldOf(input.aggregateBy);
    if (!aggregate || !NUMERIC_TYPES.has(aggregate.dataType))
      errors.aggregateBy = ["Choose a currency or number field."];
  }
  if (!(KANBAN_HEADER_STYLES as readonly string[]).includes(input.headerStyle))
    errors.headerStyle = ["Choose a supported header style."];
  const fields = Array.isArray(input.fields) ? input.fields : [];
  if (!fields.length) errors.fields = ["Choose at least one field."];
  else if (fields.some((field) => !fieldOf(field)))
    errors.fields = ["Choose known field API names."];
  else if (new Set(fields).size !== fields.length) errors.fields = ["Choose each field once."];
  else if (!fields.includes(displayNameField))
    errors.fields = ["The record name field must be on the card."];
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return {
    name,
    categorizeBy: input.categorizeBy,
    aggregateBy: input.aggregateBy,
    headerStyle: input.headerStyle,
    fields: [...fields],
  };
}

export interface FixtureKanbanViews {
  list(module: string): readonly KanbanView[];
  get(module: string, id: string): KanbanView;
  create(module: string, input: KanbanViewInput): KanbanView;
  update(module: string, id: string, input: KanbanViewInput): KanbanView;
}

/** Org-scoped Kanban view store with the same lifetime as the fixture records. */
export function createFixtureKanbanViews(
  ctx: OrgContext,
  metadataOf: (module: string) => { metadata: ModuleMetadata; displayNameField: string },
): FixtureKanbanViews {
  const state = (module: string) => {
    metadataOf(module);
    return stateFor(ctx.orgId, module);
  };
  const find = (module: string, id: string) => {
    const view = state(module).views.find((candidate) => candidate.id === id);
    if (!view) throw new NotFoundError("View not found.");
    return view;
  };
  return {
    list: (module) => copy(state(module).views),
    get: (module, id) => copy(find(module, id)),
    create(module, input) {
      const moduleState = state(module);
      const { metadata, displayNameField } = metadataOf(module);
      const valid = validate(metadata, displayNameField, input, moduleState.views);
      const view: KanbanView = { id: String(moduleState.nextId++), ...valid };
      moduleState.views.push(view);
      return copy(view);
    },
    update(module, id, input) {
      const moduleState = state(module);
      const current = find(module, id);
      const { metadata, displayNameField } = metadataOf(module);
      const valid = validate(
        metadata,
        displayNameField,
        input,
        moduleState.views.filter((view) => view.id !== id),
      );
      Object.assign(current, valid);
      return copy(current);
    },
  };
}
