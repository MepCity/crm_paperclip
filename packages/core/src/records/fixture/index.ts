import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RecordLockedError,
  ValidationError,
} from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type {
  DuplicateGroup,
  FieldValue,
  ListQuery,
  MergeInput,
  RecordData,
  RecordInput,
  RecordService,
} from "../contract";
import {
  automaticMaster,
  duplicateGroups,
  duplicateKey,
  isDeferredMergeRejection,
  matchesGlobalSearch,
} from "./discovery";
import { DEFAULT_LIST_SORT, matches, matchesSearch, sortRecords, validateCriteria } from "./query";
import { type FixtureReferenceModule, resolveRecordReferences } from "./references";
import { type FixtureModuleBundle, fixtureModules } from "./registry";
import { assertUniqueFieldValues, projectRecordsWithOverrides } from "./unique";
import { validateInput } from "./validation";

interface ModuleStore {
  records: Map<string, RecordData>;
  nextId: bigint;
}

interface FixtureStore {
  modules: Map<string, ModuleStore>;
  memberIds: Set<string>;
  deduplicating: Set<string>;
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
  const bundle = Object.hasOwn(fixtureModules, module) ? fixtureModules[module] : undefined;
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
      deduplicating: new Set(),
    };
    stores.set(ctx.orgId, store);
  }
  const state = store;
  // A development hot reload may retain a store from before discovery was added.
  state.deduplicating ??= new Set();
  state.memberIds.add(ctx.userId);

  const referenceModules = (): Map<string, FixtureReferenceModule> => {
    const entries: [string, FixtureReferenceModule][] = [];
    for (const [name, bundle] of Object.entries(fixtureModules)) {
      const moduleState = state.modules.get(name);
      entries.push([
        name,
        {
          displayNameField: bundle.displayNameField,
          getRecord: (id: string) => moduleState?.records.get(id),
        },
      ]);
    }
    return new Map(entries);
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
  const matching = (
    module: string,
    query: Pick<ListQuery, "viewId" | "filters" | "search">,
    applyView = true,
  ) => {
    const bundle = bundleFor(module);
    const view = applyView ? viewFor(module, query.viewId) : undefined;
    const fieldMap = new Map(bundle.metadata.fields.map((field) => [field.apiName, field]));
    if (query.filters) validateCriteria(query.filters, fieldMap);
    const runtimeCtx = { userId: ctx.userId, now: clock() };
    return [...moduleStore(module).records.values()]
      .map((record) => resolveRead(module, record))
      .filter(
        (record) =>
          (!view?.criteria || matches(record, view.criteria, runtimeCtx, fieldMap)) &&
          (!query.filters || matches(record, query.filters, runtimeCtx, fieldMap)) &&
          matchesSearch(record, query.search, bundle.searchFields),
      );
  };
  const validateIds = (ids: readonly string[]) => {
    if (ids.length < 1 || ids.length > 500)
      throw new ValidationError({ ids: ["Choose between 1 and 500 records."] }, undefined, "limit");
  };
  const writeBatch = (module: string, ids: readonly string[], input: RecordInput) => {
    // Resolve every target after asynchronous membership checks, before any write.
    const bundle = bundleFor(module);
    const records = ids.map((id) => recordFor(module, id));
    for (const record of records) assertWritable(record);
    const stamp = clock().toISOString();
    const moduleState = moduleStore(module);
    const overrides = new Map<string, Record<string, FieldValue>>();
    const updates = records.map((record) => {
      const fields: Record<string, FieldValue> = {
        ...record.fields,
        ...input,
        Modified_By: ctx.userId,
        Modified_Time: stamp,
      };
      fields[bundle.displayNameField] = bundle.fullName(fields);
      overrides.set(record.id, fields);
      return { id: record.id, fields };
    });
    assertUniqueFieldValues(
      bundle.metadata.fields,
      projectRecordsWithOverrides(moduleState.records, overrides),
    );
    for (const record of updates) moduleState.records.set(record.id, record);
  };

  const merge = async (module: string, input: MergeInput): Promise<RecordData> => {
    const bundle = bundleFor(module);
    const ids = [...input.duplicateIds];
    if (
      ids.length < 1 ||
      ids.length > 2 ||
      new Set(ids).size !== ids.length ||
      ids.includes(input.masterId)
    )
      throw new ValidationError({
        duplicateIds: ["Choose one or two distinct duplicates, excluding the master."],
      });
    const normalized = normalizeInput(input.values, stringFieldNames(bundle));
    validateInput(normalized, true, bundle.metadata.fields, bundle.managedFields);
    validateReferences(module, normalized);
    await validateOwner(normalized);
    // Resolve again after the asynchronous membership check, then commit without yielding.
    const master = recordFor(module, input.masterId);
    const group = [master, ...ids.map((id) => recordFor(module, id))];
    for (const record of group) {
      assertWritable(record, "update");
      assertWritable(record, "delete");
    }
    const oldest = [...group].sort((a, b) =>
      String(a.fields.Created_Time).localeCompare(String(b.fields.Created_Time)),
    )[0] as RecordData;
    const fields: Record<string, FieldValue> = {
      ...master.fields,
      ...normalized,
      Created_By: oldest.fields.Created_By ?? null,
      Created_Time: oldest.fields.Created_Time ?? null,
      Modified_By: ctx.userId,
      Modified_Time: clock().toISOString(),
    };
    fields[bundle.displayNameField] = bundle.fullName(fields);
    const removed = new Set(ids);
    const updated = { id: master.id, fields };
    const projected = new Map<string, Map<string, RecordData>>();
    for (const [name, moduleState] of state.modules) {
      const next = new Map<string, RecordData>();
      for (const record of moduleState.records.values()) {
        if (name === module && removed.has(record.id)) continue;
        const source = name === module && record.id === master.id ? updated : record;
        const nextFields = { ...source.fields };
        for (const field of bundleFor(name).metadata.fields) {
          const value = nextFields[field.apiName];
          if (
            (field.dataType === "lookup" || field.dataType === "multi_module_lookup") &&
            typeof value === "object" &&
            value !== null &&
            value.module === module &&
            removed.has(value.id)
          )
            nextFields[field.apiName] =
              name === module && record.id === master.id
                ? null
                : {
                    module,
                    id: master.id,
                    name: String(fields[bundle.displayNameField]),
                  };
        }
        next.set(source.id, { id: source.id, fields: nextFields });
      }
      assertUniqueFieldValues(bundleFor(name).metadata.fields, next.values());
      projected.set(name, next);
    }
    for (const [name, records] of projected) moduleStore(name).records = records;
    return copy(resolveRead(module, recordFor(module, master.id)));
  };
  const findDuplicateGroups = async (
    module: string,
    fields: readonly string[],
  ): Promise<readonly DuplicateGroup[]> => {
    const bundle = bundleFor(module);
    return copy(
      duplicateGroups(
        matching(module, { viewId: "" }, false),
        fields,
        bundle.metadata.fields,
        bundle.managedFields,
      ),
    );
  };

  return {
    merge,
    findDuplicateGroups,
    async deduplicate(module, fields) {
      moduleExists(module);
      if (ctx.role !== "admin") throw new ForbiddenError();
      if (state.deduplicating.has(module))
        throw new ConflictError("Deduplication is already running for this module.");
      state.deduplicating.add(module);
      try {
        const groups = await findDuplicateGroups(module, [...fields]);
        const conflicts: DuplicateGroup[] = [];
        let mergedGroups = 0;
        let removedRecords = 0;
        for (const group of groups) {
          if (group.conflictFields.length || group.records.length > 3) {
            conflicts.push(group);
            continue;
          }
          const master = automaticMaster(group.records);
          const values: Record<string, FieldValue> = {};
          for (const field of bundleFor(module).metadata.fields) {
            if (field.readOnly || bundleFor(module).managedFields.has(field.apiName)) continue;
            const current = master.fields[field.apiName];
            const value =
              duplicateKey(current) !== null
                ? current
                : group.records
                    .map((record) => record.fields[field.apiName])
                    .find((value) => duplicateKey(value) !== null);
            if (value !== undefined) values[field.apiName] = value;
          }
          try {
            await merge(module, {
              masterId: master.id,
              duplicateIds: group.records
                .filter((record) => record.id !== master.id)
                .map((record) => record.id),
              values,
            });
          } catch (error) {
            if (!isDeferredMergeRejection(error)) throw error;
            conflicts.push(group);
            continue;
          }
          mergedGroups++;
          removedRecords += group.records.length - 1;
        }
        return { mergedGroups, removedRecords, conflicts };
      } finally {
        state.deduplicating.delete(module);
      }
    },
    async search(query) {
      if (typeof query.text !== "string" || query.text.trim().length < 3)
        throw new ValidationError({ text: ["Enter at least three characters."] });
      if (query.scope !== undefined && query.scope !== "all" && query.scope !== "nameOrTags")
        throw new ValidationError({ scope: ["Choose a search scope."] });
      const page = query.page ?? 1;
      const perPage = query.perPage ?? 30;
      if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(perPage) || perPage < 1)
        throw new ValidationError({ page: ["Choose positive integer paging values."] });
      const groups = [];
      for (const module of new Set(query.modules ?? Object.keys(fixtureModules))) {
        const bundle = bundleFor(module);
        if (
          query.fields?.some(
            (name) => !bundle.metadata.fields.some((field) => field.apiName === name),
          )
        )
          throw new ValidationError({ fields: ["Choose known field API names."] });
        const fieldMap = new Map(bundle.metadata.fields.map((field) => [field.apiName, field]));
        const rows = sortRecords(
          matching(module, { viewId: "", filters: query.filters }, false).filter((record) =>
            matchesGlobalSearch(
              record,
              bundle.metadata.fields,
              query.text.trim().toLowerCase(),
              query.scope === "nameOrTags" ? bundle.displayNameField : undefined,
            ),
          ),
          query.sort ?? DEFAULT_LIST_SORT,
          fieldMap,
        );
        if (!rows.length) continue;
        const start = (page - 1) * perPage;
        groups.push({
          module,
          total: rows.length,
          records: rows.slice(start, start + perPage).map((record) =>
            query.fields === undefined
              ? record
              : {
                  id: record.id,
                  fields: Object.fromEntries(
                    query.fields.map((name) => [name, record.fields[name] ?? null]),
                  ),
                },
          ),
        });
      }
      return copy(groups);
    },
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
      fields[bundle.displayNameField] = bundle.fullName(fields);
      const record = { id, fields };
      assertUniqueFieldValues(
        bundle.metadata.fields,
        projectRecordsWithOverrides(moduleState.records, new Map([[id, fields]])),
      );
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
      // Membership resolution may yield; preserve intervening partial writes/deletes.
      const record = recordFor(module, id);
      assertWritable(record);
      const fields: Record<string, FieldValue> = {
        ...record.fields,
        ...normalized,
        Modified_By: ctx.userId,
        Modified_Time: clock().toISOString(),
      };
      fields[bundle.displayNameField] = bundle.fullName(fields);
      const updated = { id, fields };
      const moduleState = moduleStore(module);
      assertUniqueFieldValues(
        bundle.metadata.fields,
        projectRecordsWithOverrides(moduleState.records, new Map([[id, fields]])),
      );
      moduleState.records.set(id, updated);
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
      const bundle = bundleFor(module);
      const targets = [...ids];
      validateIds(targets);
      const input = { Owner: ownerId };
      validateInput(input, true, bundle.metadata.fields, bundle.managedFields);
      await validateOwner(input);
      writeBatch(module, targets, input);
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
