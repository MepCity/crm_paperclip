import { NotFoundError, RecordLockedError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type { FieldValue, ListQuery, RecordData, RecordInput, RecordService } from "../contract";
import { DEFAULT_LIST_SORT, matches, matchesSearch, sortRecords, validateCriteria } from "./query";
import { type FixtureReferenceModule, resolveRecordReferences } from "./references";
import { type FixtureModuleBundle, fixtureModules } from "./registry";
import { validateInput } from "./validation";

interface ModuleStore {
  records: Map<string, RecordData>;
  nextId: bigint;
}

interface FixtureStore {
  modules: Map<string, ModuleStore>;
  memberIds: Set<string>;
}

const storeKey = Symbol.for("mepcity.records.fixture.stores");
const runtime = globalThis as typeof globalThis & {
  [storeKey]?: Map<string, FixtureStore>;
};
runtime[storeKey] ??= new Map<string, FixtureStore>();
const stores = runtime[storeKey];
const copy = <T>(value: T): T => structuredClone(value);

const stringFieldNames = (bundle: FixtureModuleBundle) =>
  new Set(
    bundle.metadata.fields
      .filter(
        (field) =>
          ![
            "integer",
            "currency",
            "double",
            "boolean",
            "lookup",
            "multi_module_lookup",
            "date",
          ].includes(field.dataType),
      )
      .map((field) => field.apiName),
  );

const normalizeInput = (input: RecordInput, stringFields: Set<string>): RecordInput =>
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

function moduleBundle(module: string): FixtureModuleBundle {
  const bundle = fixtureModules[module];
  if (!bundle) throw new NotFoundError("Module not found.");
  return bundle;
}

export function createFixtureRecordService(
  context: OrgContext,
  options?: FixtureRecordServiceOptions,
): RecordService {
  const ctx = { ...context };
  const clock = () => options?.now?.() ?? new Date();
  let store = stores.get(ctx.orgId);
  if (!store) {
    const now = clock();
    store = {
      modules: new Map(
        Object.entries(fixtureModules).map(([name, bundle]) => [
          name,
          {
            records: new Map(
              bundle.generateSeed(now).map((record) => [
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
            nextId: bundle.initialNextId,
          },
        ]),
      ),
      memberIds: new Set(),
    };
    stores.set(ctx.orgId, store);
  }
  const state = store;
  state.memberIds.add(ctx.userId);

  const referenceModules = (): Map<string, FixtureReferenceModule> => {
    const contactsStore = state.modules.get("Contacts");
    const leadsStore = state.modules.get("Leads");
    return new Map([
      [
        "Leads",
        {
          displayNameField: "Full_Name",
          getRecord: (id: string) => leadsStore?.records.get(id),
        },
      ],
      [
        "Contacts",
        {
          displayNameField: "Full_Name",
          getRecord: (id: string) => contactsStore?.records.get(id),
        },
      ],
    ]);
  };

  const moduleExists = (module: string) => {
    moduleBundle(module);
  };
  const bundleFor = (module: string) => moduleBundle(module);
  const moduleStore = (module: string) => {
    moduleExists(module);
    const moduleState = state.modules.get(module);
    if (!moduleState) throw new NotFoundError("Module not found.");
    return moduleState;
  };
  const viewFor = (module: string, id: string) => {
    const bundle = bundleFor(module);
    const view = bundle.views.find((candidate) => candidate.id === id);
    if (!view) throw new NotFoundError("View not found.");
    return view;
  };
  const recordFor = (module: string, id: string) => {
    const record = moduleStore(module).records.get(id);
    if (!record) throw new NotFoundError("Record not found.");
    return record;
  };
  const resolveRead = (module: string, record: RecordData) => {
    const bundle = bundleFor(module);
    return resolveRecordReferences(record, bundle.metadata.fields, referenceModules());
  };
  const validateReferences = (module: string, input: RecordInput) => {
    const bundle = bundleFor(module);
    resolveRecordReferences({ id: "", fields: input }, bundle.metadata.fields, referenceModules(), {
      requireRegisteredTargets: true,
    });
  };
  const validateOwner = async (input: RecordInput) => {
    if (!Object.hasOwn(input, "Owner")) return;
    const members = options?.listMemberIds ? await options.listMemberIds() : [...state.memberIds];
    if (typeof input.Owner !== "string" || !members.includes(input.Owner))
      throw new ValidationError({ Owner: ["Choose a member of this organization."] });
  };
  const assertWritable = (record: RecordData, operation: "update" | "delete" = "update") => {
    if (record.fields.Locked__s === true)
      throw new RecordLockedError(
        operation === "delete"
          ? "cannot delete record that is not approved yet"
          : "Cannot update record that is not approved yet",
      );
  };
  const matching = (module: string, query: Pick<ListQuery, "viewId" | "filters" | "search">) => {
    const bundle = bundleFor(module);
    const view = viewFor(module, query.viewId);
    const fieldMap = new Map(bundle.metadata.fields.map((field) => [field.apiName, field]));
    if (query.filters) validateCriteria(query.filters, fieldMap);
    const runtimeCtx = { userId: ctx.userId, now: clock() };
    return [...moduleStore(module).records.values()]
      .map((record) => resolveRead(module, record))
      .filter(
        (record) =>
          (!view.criteria || matches(record, view.criteria, runtimeCtx, fieldMap)) &&
          (!query.filters || matches(record, query.filters, runtimeCtx, fieldMap)) &&
          matchesSearch(record, query.search, bundle.searchFields),
      );
  };
  const validateIds = (ids: readonly string[]) => {
    if (ids.length < 1 || ids.length > 500)
      throw new ValidationError({ ids: ["Choose between 1 and 500 records."] }, undefined, "limit");
  };
  const writeBatch = (module: string, ids: readonly string[], input: RecordInput) => {
    const bundle = bundleFor(module);
    const records = ids.map((id) => recordFor(module, id));
    for (const record of records) assertWritable(record);
    const stamp = clock().toISOString();
    const moduleState = moduleStore(module);
    const updates = records.map((record) => {
      const fields: Record<string, FieldValue> = {
        ...record.fields,
        ...input,
        Modified_By: ctx.userId,
        Modified_Time: stamp,
      };
      fields.Full_Name = bundle.fullName(fields);
      return { id: record.id, fields };
    });
    for (const record of updates) moduleState.records.set(record.id, record);
  };

  return {
    async getHomeCurrency() {
      return { isoCode: "TRY", symbol: "TL", name: "Turkish Lira - TRY", prefixSymbol: true };
    },
    async getModule(module) {
      return copy(bundleFor(module).metadata);
    },
    async listViews(module) {
      return copy(bundleFor(module).views);
    },
    async getView(module, id) {
      return copy(viewFor(module, id));
    },
    async list(module, query) {
      const bundle = bundleFor(module);
      const view = viewFor(module, query.viewId);
      const errors: Record<string, string[]> = {};
      if (!Number.isSafeInteger(query.page) || query.page < 1)
        errors.page = ["Choose a positive integer page."];
      if (![10, 20, 30, 40, 50, 100].includes(query.perPage))
        errors.perPage = ["Choose a supported page size."];
      if (
        query.fields?.some(
          (name) => !bundle.metadata.fields.some((field) => field.apiName === name),
        )
      )
        errors.fields = ["Choose known field API names."];
      if (Object.keys(errors).length) throw new ValidationError(errors);
      const fieldMap = new Map(bundle.metadata.fields.map((field) => [field.apiName, field]));
      const applied = query.sort ?? view.sort ?? DEFAULT_LIST_SORT;
      const rows = sortRecords(matching(module, query), applied, fieldMap);
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
      return copy(resolveRead(module, recordFor(module, id)));
    },
    async create(module, input) {
      const bundle = bundleFor(module);
      const stringFields = stringFieldNames(bundle);
      const normalized = normalizeInput(input, stringFields);
      validateInput(normalized, false, bundle.metadata.fields, bundle.managedFields);
      validateReferences(module, normalized);
      await validateOwner(normalized);
      const moduleState = moduleStore(module);
      const id = String(moduleState.nextId++);
      const fields: Record<string, FieldValue> = Object.fromEntries(
        bundle.metadata.fields.map((field) => [field.apiName, null]),
      );
      const stamp = clock().toISOString();
      Object.assign(fields, normalized, bundle.createDefaults(stamp), {
        id,
        Owner: normalized.Owner ?? ctx.userId,
        Created_By: ctx.userId,
        Modified_By: ctx.userId,
      });
      fields.Full_Name = bundle.fullName(fields);
      const record = { id, fields };
      moduleState.records.set(id, record);
      return copy(resolveRead(module, record));
    },
    async update(module, id, input) {
      const bundle = bundleFor(module);
      recordFor(module, id);
      const stringFields = stringFieldNames(bundle);
      const normalized = normalizeInput(input, stringFields);
      validateInput(normalized, true, bundle.metadata.fields, bundle.managedFields);
      validateReferences(module, normalized);
      await validateOwner(normalized);
      const record = recordFor(module, id);
      assertWritable(record);
      const fields: Record<string, FieldValue> = {
        ...record.fields,
        ...normalized,
        Modified_By: ctx.userId,
        Modified_Time: clock().toISOString(),
      };
      fields.Full_Name = bundle.fullName(fields);
      const updated = { id, fields };
      moduleStore(module).records.set(id, updated);
      return copy(resolveRead(module, updated));
    },
    async massUpdate(module, ids, input) {
      const bundle = bundleFor(module);
      const targets = [...ids];
      validateIds(targets);
      const stringFields = stringFieldNames(bundle);
      const normalized = normalizeInput(input, stringFields);
      const names = Object.keys(normalized);
      if (names.length !== 1) throw new ValidationError({ data: ["Choose exactly one field."] });
      const name = names[0] as string;
      const field = bundle.metadata.fields.find((candidate) => candidate.apiName === name);
      if (!field?.massUpdate)
        throw new ValidationError({ [name]: ["This field cannot be mass updated."] });
      validateInput(normalized, true, bundle.metadata.fields, bundle.managedFields);
      validateReferences(module, normalized);
      await validateOwner(normalized);
      writeBatch(module, targets, normalized);
    },
    async changeOwner(module, ids, ownerId) {
      moduleExists(module);
      const targets = [...ids];
      validateIds(targets);
      await validateOwner({ Owner: ownerId });
      writeBatch(module, targets, { Owner: ownerId });
    },
    async delete(module, ids) {
      moduleExists(module);
      validateIds(ids);
      const records = ids.map((id) => recordFor(module, id));
      for (const record of records) assertWritable(record, "delete");
      const moduleState = moduleStore(module);
      for (const id of ids) moduleState.records.delete(id);
    },
  };
}
