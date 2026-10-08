import { NotFoundError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type { FieldValue, ListQuery, RecordData, RecordInput, RecordService } from "../contract";
import { leadsMetadata } from "./metadata";
import { DEFAULT_LIST_SORT, matches, matchesSearch, sortRecords, validateCriteria } from "./query";
import { fullName, generateFixtureLeads } from "./seed";
import { validateInput } from "./validation";
import { leadsViews } from "./views";

interface FixtureStore {
  records: Map<string, RecordData>;
  nextId: bigint;
  memberIds: Set<string>;
}
const storeKey = Symbol.for("mepcity.records.fixture.stores");
const runtime = globalThis as typeof globalThis & {
  [storeKey]?: Map<string, FixtureStore>;
};
runtime[storeKey] ??= new Map<string, FixtureStore>();
const stores = runtime[storeKey];
const copy = <T>(value: T): T => structuredClone(value);
const stringFields = new Set(
  leadsMetadata.fields
    .filter(
      (field) =>
        !["integer", "currency", "double", "boolean", "multi_module_lookup"].includes(
          field.dataType,
        ),
    )
    .map((field) => field.apiName),
);
const normalizeInput = (input: RecordInput): RecordInput =>
  copy(
    Object.fromEntries(
      Object.entries(input).map(([name, value]) => [
        name,
        value === "" && stringFields.has(name) ? null : value,
      ]),
    ),
  );

export interface FixtureRecordServiceOptions {
  /** Clock for seed times, write timestamps and date tokens. Defaults to the system clock. */
  now?: () => Date;
  /** Live membership source; defaults to authorized contexts opened in this fixture org. */
  listMemberIds?: () => Promise<readonly string[]>;
}

export function createFixtureRecordService(
  context: OrgContext,
  options?: FixtureRecordServiceOptions,
): RecordService {
  const ctx = { ...context };
  const clock = () => options?.now?.() ?? new Date();
  let store = stores.get(ctx.orgId);
  if (!store) {
    store = {
      records: new Map(
        generateFixtureLeads(68, clock()).map((record) => [
          record.id,
          {
            ...record,
            fields: {
              ...record.fields,
              Owner: ctx.userId,
              Created_By: ctx.userId,
              Modified_By: ctx.userId,
            },
          },
        ]),
      ),
      nextId: 200000000000000000n,
      memberIds: new Set(),
    };
    stores.set(ctx.orgId, store);
  }
  const state = store;
  state.memberIds.add(ctx.userId);
  const validateOwner = async (input: RecordInput) => {
    if (!Object.hasOwn(input, "Owner")) return;
    const members = options?.listMemberIds ? await options.listMemberIds() : [...state.memberIds];
    if (typeof input.Owner !== "string" || !members.includes(input.Owner))
      throw new ValidationError({ Owner: ["Choose a member of this organization."] });
  };
  const moduleExists = (module: string) => {
    if (module !== "Leads") throw new NotFoundError("Module not found.");
  };
  const viewFor = (module: string, id: string) => {
    moduleExists(module);
    const view = leadsViews.find((view) => view.id === id);
    if (!view) throw new NotFoundError("View not found.");
    return view;
  };
  const recordFor = (module: string, id: string) => {
    moduleExists(module);
    const record = state.records.get(id);
    if (!record) throw new NotFoundError("Record not found.");
    return record;
  };
  const matching = (module: string, query: Pick<ListQuery, "viewId" | "filters" | "search">) => {
    const view = viewFor(module, query.viewId);
    if (query.filters) validateCriteria(query.filters);
    const runtime = { userId: ctx.userId, now: clock() };
    return [...state.records.values()].filter(
      (record) =>
        (!view.criteria || matches(record, view.criteria, runtime)) &&
        (!query.filters || matches(record, query.filters, runtime)) &&
        matchesSearch(record, query.search),
    );
  };
  return {
    async getModule(module) {
      moduleExists(module);
      return copy(leadsMetadata);
    },
    async listViews(module) {
      moduleExists(module);
      return copy(leadsViews);
    },
    async getView(module, id) {
      return copy(viewFor(module, id));
    },
    async list(module, query) {
      const view = viewFor(module, query.viewId);
      const errors: Record<string, string[]> = {};
      if (!Number.isSafeInteger(query.page) || query.page < 1)
        errors.page = ["Choose a positive integer page."];
      if (![10, 20, 30, 40, 50, 100].includes(query.perPage))
        errors.perPage = ["Choose a supported page size."];
      if (
        query.fields?.some((name) => !leadsMetadata.fields.some((field) => field.apiName === name))
      )
        errors.fields = ["Choose known field API names."];
      if (Object.keys(errors).length) throw new ValidationError(errors);
      const applied = query.sort ?? view.sort ?? DEFAULT_LIST_SORT;
      const rows = sortRecords(matching(module, query), applied);
      const start = (query.page - 1) * query.perPage;
      return copy({
        records: rows.slice(start, start + query.perPage).map((record) =>
          query.fields === undefined
            ? record
            : {
                id: record.id,
                fields: Object.fromEntries(
                  ["id", ...query.fields].map((name) => [
                    name,
                    name === "id" ? record.id : (record.fields[name] ?? null),
                  ]),
                ),
              },
        ),
        page: query.page,
        perPage: query.perPage,
        moreRecords: start + query.perPage < rows.length,
        sort: applied,
      });
    },
    async count(module, query) {
      return matching(module, query).length;
    },
    async get(module, id) {
      return copy(recordFor(module, id));
    },
    async create(module, input) {
      moduleExists(module);
      const normalized = normalizeInput(input);
      validateInput(normalized, false);
      await validateOwner(normalized);
      const id = String(state.nextId++);
      const fields: Record<string, FieldValue> = Object.fromEntries(
        leadsMetadata.fields.map((field) => [field.apiName, null]),
      );
      const stamp = clock().toISOString();
      Object.assign(fields, normalized, {
        id,
        Owner: normalized.Owner ?? ctx.userId,
        Created_By: ctx.userId,
        Modified_By: ctx.userId,
        Created_Time: stamp,
        Modified_Time: stamp,
        Converted__s: false,
        Locked__s: false,
      });
      fields.Full_Name = fullName(fields);
      const record = { id, fields };
      state.records.set(id, record);
      return copy(record);
    },
    async update(module, id, input) {
      recordFor(module, id);
      const normalized = normalizeInput(input);
      validateInput(normalized, true);
      await validateOwner(normalized);
      // Membership resolution may yield; preserve intervening partial writes/deletes.
      const record = recordFor(module, id);
      const fields: Record<string, FieldValue> = {
        ...record.fields,
        ...normalized,
        Modified_By: ctx.userId,
        Modified_Time: clock().toISOString(),
      };
      fields.Full_Name = fullName(fields);
      const updated = { id, fields };
      state.records.set(id, updated);
      return copy(updated);
    },
    async delete(module, ids) {
      moduleExists(module);
      for (const id of ids) recordFor(module, id);
      for (const id of ids) state.records.delete(id);
    },
  };
}
