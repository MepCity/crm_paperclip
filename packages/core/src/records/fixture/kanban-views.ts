import { NotFoundError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type { ModuleMetadata } from "../contract";
import {
  KANBAN_HEADER_STYLES,
  KANBAN_SHARE_TARGETS,
  type KanbanSharedTo,
  type KanbanView,
  type KanbanViewInput,
  type KanbanViewUser,
} from "../kanban-views";

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

const seeds: Readonly<Record<string, KanbanViewInput & { sharedTo: KanbanSharedTo }>> = {
  Deals: {
    name: "STAGEVIEW",
    categorizeBy: "Stage",
    aggregateBy: "Amount",
    headerStyle: "mono_color",
    sharedTo: "everyone",
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

function stateFor(orgId: string, module: string, user: KanbanViewUser): ModuleKanbanState {
  let org = stores.get(orgId);
  if (!org) {
    org = new Map();
    stores.set(orgId, org);
  }
  let state = org.get(module);
  if (!state) {
    state = { views: [], nextId: FIRST_ID };
    const seed = seeds[module];
    if (seed)
      state.views.push({
        id: String(state.nextId++),
        ...copy(seed),
        sharedTo: "everyone",
        createdBy: { ...user },
        modifiedBy: { ...user },
      });
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
): KanbanViewInput & { sharedTo: KanbanSharedTo } {
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
  const sharedTo = input.sharedTo ?? "only_me";
  if (!(KANBAN_SHARE_TARGETS as readonly string[]).includes(sharedTo))
    errors.sharedTo = ["Choose who can see this view."];
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return {
    sharedTo,
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
  const user: KanbanViewUser = { id: ctx.userId, name: ctx.userId };
  const state = (module: string) => {
    metadataOf(module);
    return stateFor(ctx.orgId, module, user);
  };
  /** "Only me" views are visible to their creator alone. */
  const visible = (view: KanbanView) =>
    view.sharedTo === "everyone" || view.createdBy.id === user.id;
  const find = (module: string, id: string) => {
    const view = state(module).views.find((candidate) => candidate.id === id && visible(candidate));
    if (!view) throw new NotFoundError("View not found.");
    return view;
  };
  return {
    list: (module) => copy(state(module).views.filter(visible)),
    get: (module, id) => copy(find(module, id)),
    create(module, input) {
      const moduleState = state(module);
      const { metadata, displayNameField } = metadataOf(module);
      const valid = validate(metadata, displayNameField, input, moduleState.views);
      const view: KanbanView = {
        id: String(moduleState.nextId++),
        ...valid,
        createdBy: { ...user },
        modifiedBy: { ...user },
      };
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
      const { sharedTo: _sharedTo, ...rest } = valid;
      Object.assign(current, rest, { modifiedBy: { ...user } });
      return copy(current);
    },
  };
}
