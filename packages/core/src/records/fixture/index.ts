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
  FieldDefinition,
  FieldValue,
  ListQuery,
  MergeInput,
  RecordData,
  RecordInput,
  RecordService,
} from "../contract";
import { isJsonArray, isJsonObject } from "../json";
import { roundMoneyTwoDecimals } from "../rounding";
import { calendarDays, historyRow } from "./deals/history";
import { applyDealRules } from "./deals/rules";
import {
  automaticMaster,
  duplicateGroups,
  fieldValueKey,
  isDeferredMergeRejection,
  matchesGlobalSearch,
  pointsAtGroupMember,
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
          !field.acceptsJsonArray &&
          ![
            "ALARM",
            "RRULE",
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

const normalizeInput = (
  input: RecordInput,
  stringFields: Set<string>,
  fields: readonly FieldDefinition[],
): RecordInput => {
  for (const field of fields) {
    const value = input[field.apiName];
    if (
      (field.acceptsJsonArray || field.dataType === "ALARM" || field.dataType === "RRULE") &&
      value !== undefined &&
      value !== null &&
      !(field.acceptsJsonArray ? isJsonArray(value) : isJsonObject(value))
    )
      throw new ValidationError({ [field.apiName]: ["Invalid field type."] });
  }
  return copy(
    Object.fromEntries(
      Object.entries(input).map(([name, value]) => [
        name,
        value === "" && stringFields.has(name) ? null : value,
      ]),
    ),
  );
};

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
    const histories = store.modules.get("DealHistory") as ModuleStore;
    let seedIndex = 0;
    for (const deal of store.modules.get("Deals")?.records.values() ?? []) {
      if (seedIndex++ % 10 === 0 && deal.fields.Stage !== "Qualification") {
        const stamp = new Date(
          Date.parse(String(deal.fields.Created_Time)) - 2 * 86_400_000,
        ).toISOString();
        const fields = { ...deal.fields, Stage: "Qualification", Modified_Time: stamp };
        applyDealRules(fields, {});
        const first = historyRow({ id: deal.id, fields }, String(histories.nextId++));
        first.fields = {
          ...first.fields,
          Moved_To__s: deal.fields.Stage ?? null,
          Stage_Duration_Calendar_Days: 2,
        };
        histories.records.set(first.id, first);
        deal.fields = { ...deal.fields, Created_Time: stamp };
      }
      const row = historyRow(deal, String(histories.nextId++));
      histories.records.set(row.id, row);
    }
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
  const assertModuleWritable = (module: string) => {
    if (bundleFor(module).readOnly) throw new ForbiddenError("This module is read-only.");
  };
  const appendHistory = (module: string, record: RecordData, previous?: RecordData) => {
    if (module !== "Deals" || previous?.fields.Stage === record.fields.Stage) return;
    const history = moduleStore("DealHistory");
    const prior = [...history.records.values()]
      .filter((row) => {
        const reference = row.fields.Potential_Name;
        return (
          typeof reference === "object" &&
          reference !== null &&
          "id" in reference &&
          reference.id === record.id
        );
      })
      .at(-1);
    if (prior)
      prior.fields = {
        ...prior.fields,
        Moved_To__s: record.fields.Stage ?? null,
        Stage_Duration_Calendar_Days: calendarDays(
          String(prior.fields.Modified_Time),
          String(record.fields.Modified_Time),
        ),
      };
    const row = historyRow(record, String(history.nextId++));
    history.records.set(row.id, row);
  };
  const removeHistory = (ids: readonly string[]) => {
    const history = moduleStore("DealHistory");
    for (const row of history.records.values()) {
      const reference = row.fields.Potential_Name;
      if (
        typeof reference === "object" &&
        reference &&
        "id" in reference &&
        typeof reference.id === "string" &&
        ids.includes(reference.id)
      )
        history.records.delete(row.id);
    }
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
    const storedRows = [...moduleStore(module).records.values()];
    if (module === "DealHistory") storedRows.reverse();
    return storedRows
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
    const records = [...new Set(ids)].map((id) => recordFor(module, id));
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
      if (module === "Deals") applyDealRules(fields, input, record.fields);
      fields[bundle.displayNameField] = bundle.fullName(fields);
      overrides.set(record.id, fields);
      return { id: record.id, fields };
    });
    assertUniqueFieldValues(
      bundle.metadata.fields,
      projectRecordsWithOverrides(moduleState.records, overrides),
    );
    for (const record of updates) {
      appendHistory(module, record, moduleState.records.get(record.id));
      moduleState.records.set(record.id, record);
    }
  };

  const merge = async (module: string, input: MergeInput): Promise<RecordData> => {
    assertModuleWritable(module);
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
    const normalized = normalizeInput(
      input.values,
      stringFieldNames(bundle),
      bundle.metadata.fields,
    );
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
    if (module === "Deals") applyDealRules(fields, normalized, master.fields);
    fields[bundle.displayNameField] = bundle.fullName(fields);
    const removed = new Set(ids);
    const updated = { id: master.id, fields };
    const projected = new Map<string, Map<string, RecordData>>();
    for (const [name, moduleState] of state.modules) {
      const next = new Map<string, RecordData>();
      for (const record of moduleState.records.values()) {
        if (name === module && removed.has(record.id)) continue;
        if (
          module === "Deals" &&
          name === "DealHistory" &&
          pointsAtGroupMember(record.fields.Potential_Name, module, removed)
        )
          continue;
        const source = name === module && record.id === master.id ? updated : record;
        const nextFields = { ...source.fields };
        for (const field of bundleFor(name).metadata.fields) {
          const value = nextFields[field.apiName];
          if (
            (field.dataType === "lookup" || field.dataType === "multi_module_lookup") &&
            typeof value === "object" &&
            value !== null &&
            "module" in value &&
            "id" in value &&
            value.module === module &&
            typeof value.id === "string" &&
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
    if (module === "Deals") {
      appendHistory(module, updated, master);
    }
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
      assertModuleWritable(module);
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
          const memberIds = new Set(group.records.map((record) => record.id));
          const values: Record<string, FieldValue> = {};
          for (const field of bundleFor(module).metadata.fields) {
            if (field.readOnly || bundleFor(module).managedFields.has(field.apiName)) continue;
            const current = master.fields[field.apiName];
            const value =
              fieldValueKey(current, field) !== null
                ? current
                : group.records
                    .map((record) => record.fields[field.apiName])
                    .find(
                      (candidate) =>
                        fieldValueKey(candidate, field) !== null &&
                        !pointsAtGroupMember(candidate, module, memberIds),
                    );
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
      for (const module of new Set(
        query.modules ?? Object.keys(fixtureModules).filter((name) => !bundleFor(name).readOnly),
      )) {
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
    async summarize(module, query) {
      const metadata = bundleFor(module).metadata;
      const groupField = metadata.fields.find((field) => field.apiName === query.groupBy);
      if (groupField?.dataType !== "picklist")
        throw new ValidationError({ groupBy: ["Choose a known picklist field."] });
      const sumField = metadata.fields.find((field) => field.apiName === query.sum);
      if (
        query.sum !== undefined &&
        (!sumField || !["currency", "integer", "double"].includes(sumField.dataType))
      )
        throw new ValidationError({ sum: ["Choose a known numeric field."] });
      const rows = matching(module, query);
      const values: (string | null)[] = (groupField.picklist ?? []).map(
        (option) => option.storedValue,
      );
      if (rows.some((row) => row.fields[query.groupBy] == null)) values.push(null);
      return values.map((value) => {
        const members = rows.filter((row) => (row.fields[query.groupBy] ?? null) === value);
        return {
          value,
          count: members.length,
          sum:
            query.sum === undefined
              ? null
              : roundMoneyTwoDecimals(
                  members.reduce(
                    (total, row) => total + Number(row.fields[query.sum as string] ?? 0),
                    0,
                  ),
                ),
        };
      });
    },
    async get(module, id) {
      return copy(resolveRead(module, recordFor(module, id)));
    },
    async create(module, input) {
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      const stringFields = stringFieldNames(bundle);
      const normalized = normalizeInput(input, stringFields, bundle.metadata.fields);
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
      if (module === "Deals") applyDealRules(fields, normalized);
      fields[bundle.displayNameField] = bundle.fullName(fields);
      const record = { id, fields };
      assertUniqueFieldValues(
        bundle.metadata.fields,
        projectRecordsWithOverrides(moduleState.records, new Map([[id, fields]])),
      );
      moduleState.records.set(id, record);
      appendHistory(module, record);
      return copy(resolveRead(module, record));
    },
    async update(module, id, input) {
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      recordFor(module, id);
      const stringFields = stringFieldNames(bundle);
      const normalized = normalizeInput(input, stringFields, bundle.metadata.fields);
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
      if (module === "Deals") applyDealRules(fields, normalized, record.fields);
      fields[bundle.displayNameField] = bundle.fullName(fields);
      const updated = { id, fields };
      const moduleState = moduleStore(module);
      assertUniqueFieldValues(
        bundle.metadata.fields,
        projectRecordsWithOverrides(moduleState.records, new Map([[id, fields]])),
      );
      appendHistory(module, updated, record);
      moduleState.records.set(id, updated);
      return copy(resolveRead(module, updated));
    },
    async massUpdate(module, ids, input) {
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      const targets = [...ids];
      validateIds(targets);
      const stringFields = stringFieldNames(bundle);
      const normalized = normalizeInput(input, stringFields, bundle.metadata.fields);
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
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      const targets = [...ids];
      validateIds(targets);
      const input = { Owner: ownerId };
      validateInput(input, true, bundle.metadata.fields, bundle.managedFields);
      await validateOwner(input);
      writeBatch(module, targets, input);
    },
    async delete(module, ids) {
      assertModuleWritable(module);
      moduleExists(module);
      validateIds(ids);
      const records = [...new Set(ids)].map((id) => recordFor(module, id));
      for (const record of records) assertWritable(record, "delete");
      const moduleState = moduleStore(module);
      for (const id of ids) moduleState.records.delete(id);
      if (module === "Deals") removeHistory(ids);
    },
  };
}
