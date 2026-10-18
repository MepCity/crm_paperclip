import { randomUUID } from "node:crypto";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RecordLockedError,
  ValidationError,
} from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import {
  activityDate,
  activityParentIds,
  activityParentModules,
  activityRules,
  activityState,
  type LinkedActivity,
  matchesActivityFilter,
  selectActivitySummary,
  validateActivityFilter,
} from "../activities";
import { validateCampaignFilter } from "../campaigns";
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
import type { HistorySource, RecordHistoryEvent, RecordHistoryService } from "../history";
import { isJsonArray, isJsonObject } from "../json";
import type { RecycleBinService } from "../recycle-bin";
import { roundMoneyTwoDecimals } from "../rounding";
import type { TagService } from "../tags";
import {
  attachmentUltimateParent,
  fixtureAttachmentLifecycle,
  removeAttachmentIds,
} from "./attachments/hooks";
import {
  automaticMaster,
  duplicateGroups,
  fieldValueKey,
  isDeferredMergeRejection,
  matchesGlobalSearch,
  pointsAtGroupMember,
} from "./discovery";
import { type FixtureHistoryPermissions, fixtureHistoryReader } from "./history-read";
import { fixtureHistoryStore } from "./history-store";
import { type FixtureHistoryOperation, historyBatch } from "./history-write";
import type { FixtureHookContext, FixtureModuleStore } from "./hooks";
import { createFixtureKanbanViews } from "./kanban-views";
import { DEFAULT_LIST_SORT, matches, matchesSearch, sortRecords, validateCriteria } from "./query";
import { type DeletionManifest, fixtureRecycleBinService, retainDeletion } from "./recycle-bin";
import { type FixtureReferenceModule, resolveRecordReferences } from "./references";
import { type FixtureModuleBundle, fixtureModules } from "./registry";
import { fixtureTagService, projectTags } from "./tags";
import { assertUniqueFieldValues, projectRecordsWithOverrides } from "./unique";
import { validateInput } from "./validation";

interface FixtureStore {
  modules: Map<string, FixtureModuleStore>;
  memberIds: Set<string>;
  deduplicating: Set<string>;
  history: Map<string, RecordHistoryEvent>;
  sequence: number;
  deletions: Map<string, DeletionManifest>;
  cursors: Parameters<typeof fixtureHistoryReader>[6];
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

export interface FixtureRecordServiceOptions extends FixtureHistoryPermissions {
  actorName?: string;
  source?: HistorySource;
  /** Internal synchronous failure seam; runs before staged history publication. */
  beforeHistoryAppend?: (events: readonly RecordHistoryEvent[]) => void;
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
): RecordService & {
  readonly history: RecordHistoryService;
  readonly tags: TagService;
  readonly recycleBin: RecycleBinService;
} {
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
                    ...(bundle.metadata.fields.some((field) => field.apiName === "Owner")
                      ? { Owner: ctx.userId }
                      : {}),
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
      history: new Map(),
      sequence: 0,
      deletions: new Map(),
      cursors: new Map(),
    };
    const seededModules = store.modules;
    const seedContext: FixtureHookContext = {
      registeredModules: Object.keys(fixtureModules),
      moduleStore: (module) => {
        const moduleState = seededModules.get(module);
        if (!moduleState) throw new NotFoundError("Module not found.");
        return moduleState;
      },
    };
    for (const bundle of Object.values(fixtureModules)) bundle.afterSeed?.(seedContext);
    stores.set(ctx.orgId, store);
  }
  const state = store;
  // A development hot reload may retain a store from before discovery was added.
  state.deduplicating ??= new Set();
  state.history ??= new Map();
  state.sequence ??= 0;
  state.cursors ??= new Map();
  state.deletions ??= new Map();
  state.memberIds.add(ctx.userId);

  const referenceModules = (): Map<string, FixtureReferenceModule> => {
    const entries: [string, FixtureReferenceModule][] = [];
    for (const [name, bundle] of Object.entries(fixtureModules)) {
      entries.push([
        name,
        {
          displayNameField: bundle.displayNameField,
          getRecord: (id: string) => state.modules.get(name)?.records.get(id),
        },
      ]);
    }
    return new Map(entries);
  };

  const moduleExists = (module: string) => {
    moduleBundle(module);
  };
  const bundleFor = (module: string) => moduleBundle(module);
  const kanbanViews = createFixtureKanbanViews(ctx, bundleFor);
  let transactionOriginal: Map<string, FixtureModuleStore> | undefined;
  let hookCopies = new Set<string>();
  const moduleStore = (module: string) => {
    moduleExists(module);
    const moduleState = state.modules.get(module);
    if (!moduleState) throw new NotFoundError("Module not found.");
    // Generic writes replace rows; copy the map without duplicating untouched rows.
    if (transactionOriginal?.get(module) === moduleState) {
      const staged = { ...moduleState, records: new Map(moduleState.records) };
      state.modules.set(module, staged);
      return staged;
    }
    return moduleState;
  };
  const hookModuleStore = (module: string) => {
    const staged = moduleStore(module);
    // Hooks may mutate rows in place, including cross-module records. Give them
    // owned rows once per module, before any mutable access is returned.
    if (transactionOriginal && !hookCopies.has(module)) {
      const original = transactionOriginal.get(module);
      staged.records = new Map(
        [...staged.records].map(([id, record]) => [
          id,
          original?.records.get(id) === record ? copy(record) : record,
        ]),
      );
      hookCopies.add(module);
    }
    return staged;
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
  const resolveRead = (module: string, record: RecordData, now = clock()) => {
    const bundle = bundleFor(module);
    if (module === "Attachments") attachmentUltimateParent(record.fields, hookContext);
    return resolveRecordReferences(
      bundle.metadata.fields.some((field) => field.apiName === "Tag")
        ? projectTags(moduleStore(module), bundle.readRecord?.(record, now) ?? record)
        : (bundle.readRecord?.(record, now) ?? record),
      bundle.metadata.fields,
      referenceModules(),
    );
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
  const hookContext: FixtureHookContext = {
    moduleStore: hookModuleStore,
    registeredModules: Object.keys(fixtureModules),
  };
  const assertWritable = (record: RecordData, operation: "update" | "delete" = "update") => {
    if (record.fields.Locked__s === true)
      throw new RecordLockedError(
        operation === "delete"
          ? "cannot delete record that is not approved yet"
          : "Cannot update record that is not approved yet",
      );
  };
  const linkedActivities = (module: string, now: Date) => {
    const result = new Map<string, LinkedActivity[]>();
    if (!activityParentModules.has(module)) return result;
    for (const [activityModule, rule] of Object.entries(activityRules)) {
      if (!Object.hasOwn(fixtureModules, activityModule)) continue;
      for (const record of moduleStore(activityModule).records.values()) {
        for (const id of activityParentIds(module, record)) {
          const items = result.get(id) ?? [];
          items.push({
            kind: rule.kind,
            activityId: record.id,
            date: activityDate(activityModule, record),
            state: activityState(activityModule, record, now),
          });
          result.set(id, items);
        }
      }
    }
    return result;
  };
  const matching = (
    module: string,
    query: Pick<ListQuery, "viewId" | "filters" | "search" | "activityFilter" | "campaignFilter">,
    applyView = true,
    now = clock(),
  ) => {
    const bundle = bundleFor(module);
    const view = applyView ? viewFor(module, query.viewId) : undefined;
    const fieldMap = new Map(bundle.metadata.fields.map((field) => [field.apiName, field]));
    if (query.filters) validateCriteria(query.filters, fieldMap);
    if (query.activityFilter !== undefined) {
      validateActivityFilter(query.activityFilter);
      if (!activityParentModules.has(module))
        throw new ValidationError({ activityFilter: ["Choose a parent record module."] });
    }
    let campaignMembers: Set<string> | undefined;
    if (query.campaignFilter !== undefined) {
      validateCampaignFilter(query.campaignFilter);
      if (module !== "Leads" && module !== "Contacts")
        throw new ValidationError({ campaignFilter: ["Choose Leads or Contacts."] });
      campaignMembers = new Set<string>();
      const filter = query.campaignFilter;
      // Both stores belong to the caller's organization, like ordinary record reads.
      const campaigns = moduleStore("Campaigns").records;
      for (const membership of moduleStore("Campaign_Members").records.values()) {
        const campaign = membership.fields.Campaign;
        const parent: FieldValue | undefined =
          membership.fields[module === "Leads" ? "Lead" : "Contact"];
        if (
          isJsonObject(campaign) &&
          campaign.module === "Campaigns" &&
          typeof campaign.id === "string" &&
          campaigns.has(campaign.id) &&
          filter.campaignIds.includes(campaign.id) &&
          isJsonObject(parent) &&
          parent.module === module &&
          typeof parent.id === "string" &&
          (!filter.memberStatuses ||
            filter.memberStatuses.includes(String(membership.fields.Member_Status)))
        )
          campaignMembers.add(parent.id);
      }
    }
    const activities = query.activityFilter ? linkedActivities(module, now) : undefined;
    const runtimeCtx = { userId: ctx.userId, now };
    const storedRows = [...moduleStore(module).records.values()];
    bundle.orderRows?.(storedRows);
    return storedRows
      .filter((record) => module !== "Attachments" || record.fields.$state === "ready")
      .map((record) => resolveRead(module, record, now))
      .filter(
        (record) =>
          (!view?.criteria || matches(record, view.criteria, runtimeCtx, fieldMap)) &&
          (!query.filters || matches(record, query.filters, runtimeCtx, fieldMap)) &&
          matchesSearch(record, query.search, bundle.searchFields) &&
          (!campaignMembers || campaignMembers.has(record.id)) &&
          (!query.activityFilter ||
            matchesActivityFilter(activities?.get(record.id) ?? [], query.activityFilter, now)),
      );
  };
  const validateIds = (ids: readonly string[]) => {
    if (ids.length < 1 || ids.length > 500)
      throw new ValidationError({ ids: ["Choose between 1 and 500 records."] }, undefined, "limit");
  };
  const atomic = <T>(operation: FixtureHistoryOperation, write: () => T): T => {
    const previous = state.modules;
    const previousDeletions = state.deletions;
    state.deletions = new Map(previousDeletions);
    const staged = new Map(previous);
    state.modules = staged;
    transactionOriginal = previous;
    hookCopies = new Set();
    try {
      const result = write();
      const events = historyBatch(previous, state.modules, fixtureModules, operation, {
        sequence: state.sequence + 1,
        occurredAt: clock().toISOString(),
        actor: { id: ctx.userId, name: options?.actorName ?? ctx.userId },
        source: options?.source ?? "manual",
      });
      const nextHistory = new Map(state.history);
      if (events.length) options?.beforeHistoryAppend?.(copy(events));
      fixtureHistoryStore(nextHistory).appendBatch(events);
      state.history = nextHistory;
      if (events.length) state.sequence++;
      return result;
    } catch (error) {
      state.modules = previous;
      state.deletions = previousDeletions;
      throw error;
    } finally {
      transactionOriginal = undefined;
    }
  };
  const tags = fixtureTagService({
    ctx,
    now: clock,
    moduleStore,
    assertModule(module, write) {
      const bundle = bundleFor(module);
      if (!bundle.metadata.fields.some((field) => field.apiName === "Tag"))
        throw new NotFoundError("Module not found.");
      if (write) assertModuleWritable(module);
    },
    assertRecord(module, id, write) {
      const record = recordFor(module, id);
      if (write) assertWritable(record);
    },
    atomic: (module, write) => atomic({ module, mechanism: "tags" }, write),
  });
  const recycleDependencies = {
    context: ctx,
    now: clock,
    modules: () => state.modules,
    manifests: () => state.deletions,
    moduleStore,
    bundle: bundleFor,
  };
  const recycleBin = fixtureRecycleBinService({
    ...recycleDependencies,
    atomic,
    async validateOwners(records) {
      const members = options?.listMemberIds ? await options.listMemberIds() : [...state.memberIds];
      for (const record of records) {
        const owner = record.fields.Owner;
        if (owner != null && (typeof owner !== "string" || !members.includes(owner)))
          throw new ValidationError({ Owner: ["Choose a member of this organization."] });
      }
    },
    validate(module, record) {
      const bundle = bundleFor(module);
      if (!bundle.readOnly) assertModuleWritable(module);
      if (options?.canReadRecord?.(module, record.id) === false)
        throw new ValidationError({ permission: ["You cannot restore this record."] });
      if (record.fields.Locked__s === true)
        throw new ValidationError({ Locked__s: ["The record is locked."] });
      const writableFields = bundle.metadata.fields.filter(
        (field) =>
          !field.readOnly && !bundle.managedFields.has(field.apiName) && field.apiName !== "Tag",
      );
      validateInput(
        Object.fromEntries(
          writableFields.map((field) => [field.apiName, record.fields[field.apiName] ?? null]),
        ),
        false,
        writableFields,
        new Set(),
      );
      validateReferences(module, record.fields);
      if (module === "Notes" || module === "Attachments")
        attachmentUltimateParent(record.fields, hookContext);
    },
  });
  const writeBatch = (
    module: string,
    ids: readonly string[],
    input: RecordInput,
    mechanism = "update",
  ) =>
    atomic({ module, mechanism }, () => {
      // Resolve every target after asynchronous membership checks, before any write.
      const bundle = bundleFor(module);
      const records = [...new Set(ids)].map((id) => recordFor(module, id));
      for (const record of records) assertWritable(record);
      const stamp = clock().toISOString();
      const moduleState = moduleStore(module);
      const overrides = new Map<string, Record<string, FieldValue>>();
      const updates = records.map((record) => {
        const fields: Record<string, FieldValue> = {
          ...copy(record.fields),
          ...input,
          Modified_By: ctx.userId,
          Modified_Time: stamp,
        };
        bundle.applyRules?.(fields, input, copy(record.fields), hookContext);
        fields[bundle.displayNameField] = bundle.fullName(fields);
        overrides.set(record.id, fields);
        return { id: record.id, fields };
      });
      assertUniqueFieldValues(
        bundle.metadata.fields,
        projectRecordsWithOverrides(moduleState.records, overrides),
      );
      for (const record of updates) {
        bundle.afterWrite?.(record, copy(moduleState.records.get(record.id)), hookContext);
        moduleState.records.set(record.id, record);
      }
    });

  const merge = async (module: string, input: MergeInput): Promise<RecordData> => {
    assertModuleWritable(module);
    const bundle = bundleFor(module);
    if (bundle.childModule) throw new ForbiddenError("Child modules do not support merge.");
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
    return atomic(
      { module, recordId: input.masterId, kind: "records_merged", mechanism: "merge" },
      () => {
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
          ...copy(master.fields),
          ...normalized,
          Created_By: oldest.fields.Created_By ?? null,
          Created_Time: oldest.fields.Created_Time ?? null,
          Modified_By: ctx.userId,
          Modified_Time: clock().toISOString(),
        };
        bundle.applyRules?.(fields, normalized, copy(master.fields), hookContext);
        fields[bundle.displayNameField] = bundle.fullName(fields);
        const removed = new Set(ids);
        const updated = { id: master.id, fields };
        const projected = new Map<string, Map<string, RecordData>>();
        const staged = copy(state.modules);
        bundle.transferMergedRecords?.(ids, master.id, {
          registeredModules: hookContext.registeredModules,
          moduleStore: (name) => {
            const store = staged.get(name);
            if (!store) throw new NotFoundError("Module not found.");
            return store;
          },
        });
        for (const [name, moduleState] of staged) {
          const next = new Map<string, RecordData>();
          for (const record of moduleState.records.values()) {
            if (name === module && removed.has(record.id)) continue;
            if (
              bundle.mergeRelatedRecords?.some(
                (relation) =>
                  name === relation.module &&
                  pointsAtGroupMember(record.fields[relation.field], module, removed),
              )
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
        bundle.afterWrite?.(recordFor(module, master.id), copy(master), hookContext);
        return copy(resolveRead(module, recordFor(module, master.id)));
      },
    );
  };
  const findDuplicateGroups = async (
    module: string,
    fields: readonly string[],
  ): Promise<readonly DuplicateGroup[]> => {
    const bundle = bundleFor(module);
    if (bundle.childModule) return [];
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
    tags,
    recycleBin,
    history: fixtureHistoryReader(
      ctx,
      () => fixtureHistoryStore(state.history),
      () => state.sequence,
      (module, id) => {
        recordFor(module, id);
      },
      (module) => Object.hasOwn(fixtureModules, module),
      {
        canReadRecord: options?.canReadRecord,
        canReadField: (module, apiName) =>
          bundleFor(module).metadata.fields.some((field) => field.apiName === apiName) &&
          (options?.canReadField?.(module, apiName) ?? true),
      },
      state.cursors,
    ),
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
        if (bundle.childModule) continue;
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
    async listKanbanViews(module) {
      return kanbanViews.list(module);
    },
    async getKanbanView(module, id) {
      return kanbanViews.get(module, id);
    },
    async createKanbanView(module, input) {
      return kanbanViews.create(module, input);
    },
    async updateKanbanView(module, id, input) {
      return kanbanViews.update(module, id, input);
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
      const now = clock();
      const rows = sortRecords(matching(module, query, true, now), applied, fieldMap);
      const start = (query.page - 1) * query.perPage;
      const activities = query.includeActivitySummary ? linkedActivities(module, now) : undefined;
      const activitySummaries = Object.fromEntries(
        rows.slice(start, start + query.perPage).flatMap((row) => {
          const summary = selectActivitySummary(activities?.get(row.id) ?? []);
          return summary ? [[row.id, summary]] : [];
        }),
      );
      return copy({
        ...(query.includeActivitySummary ? { activitySummaries } : {}),
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
      const record = recordFor(module, id);
      if (module === "Attachments" && record.fields.$state !== "ready")
        throw new NotFoundError("Record not found.");
      return copy(resolveRead(module, record));
    },
    async create(module, input) {
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      const stringFields = stringFieldNames(bundle);
      const normalized = normalizeInput(input, stringFields, bundle.metadata.fields);
      validateInput(normalized, false, bundle.metadata.fields, bundle.managedFields);
      validateReferences(module, normalized);
      await validateOwner(normalized);
      return atomic({ module, mechanism: "create" }, () => {
        const moduleState = moduleStore(module);
        const id = String(moduleState.nextId++);
        const fields: Record<string, FieldValue> = Object.fromEntries(
          bundle.metadata.fields.map((field) => [field.apiName, null]),
        );
        const stamp = clock().toISOString();
        Object.assign(fields, normalized, bundle.createDefaults(stamp), {
          id,
          ...(bundle.metadata.fields.some((field) => field.apiName === "Owner")
            ? { Owner: normalized.Owner ?? ctx.userId }
            : {}),
          Created_By: ctx.userId,
          Modified_By: ctx.userId,
        });
        bundle.applyRules?.(fields, normalized, undefined, hookContext);
        fields[bundle.displayNameField] = bundle.fullName(fields);
        const record = { id, fields };
        assertUniqueFieldValues(
          bundle.metadata.fields,
          projectRecordsWithOverrides(moduleState.records, new Map([[id, fields]])),
        );
        moduleState.records.set(id, record);
        bundle.afterWrite?.(record, undefined, hookContext);
        return copy(resolveRead(module, record));
      });
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
      return atomic({ module, mechanism: "update" }, () => {
        // Membership resolution may yield; preserve intervening partial writes/deletes.
        const record = recordFor(module, id);
        assertWritable(record);
        const fields: Record<string, FieldValue> = {
          ...copy(record.fields),
          ...normalized,
          Modified_By: ctx.userId,
          Modified_Time: clock().toISOString(),
        };
        bundle.applyRules?.(fields, normalized, copy(record.fields), hookContext);
        fields[bundle.displayNameField] = bundle.fullName(fields);
        const updated = { id, fields };
        const moduleState = moduleStore(module);
        assertUniqueFieldValues(
          bundle.metadata.fields,
          projectRecordsWithOverrides(moduleState.records, new Map([[id, fields]])),
        );
        bundle.afterWrite?.(updated, copy(record), hookContext);
        moduleState.records.set(id, updated);
        return copy(resolveRead(module, updated));
      });
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
      writeBatch(module, targets, normalized, "mass_update");
    },
    async changeOwner(module, ids, ownerId) {
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      const targets = [...ids];
      validateIds(targets);
      const input = { Owner: ownerId };
      validateInput(input, true, bundle.metadata.fields, bundle.managedFields);
      await validateOwner(input);
      writeBatch(module, targets, input, "change_owner");
    },
    async delete(module, ids) {
      assertModuleWritable(module);
      moduleExists(module);
      validateIds(ids);
      const records = [...new Set(ids)].map((id) => recordFor(module, id));
      for (const record of records) assertWritable(record, "delete");
      const operationId = randomUUID();
      atomic({ module, mechanism: "delete", operationId }, () => {
        for (const record of records) {
          // A previous root in the same batch can already own a shared cascade.
          if (!moduleStore(module).records.has(record.id)) continue;
          retainDeletion(recycleDependencies, module, record, operationId, () => {
            const moduleState = moduleStore(module);
            if (module === "Attachments") removeAttachmentIds([record.id], hookContext);
            moduleState.records.delete(record.id);
            bundleFor(module).afterDelete?.([record.id], hookContext);
          });
        }
      });
    },
  };
}

/** Internal lifecycle access for the server-side blob adapter; never a wire API. */
export function createFixtureAttachmentLifecycle(context: OrgContext) {
  createFixtureRecordService(context);
  const state = stores.get(context.orgId);
  if (!state) throw new NotFoundError("Organization store not found.");
  return fixtureAttachmentLifecycle({
    registeredModules: Object.keys(fixtureModules),
    moduleStore(module) {
      const store = state.modules.get(module);
      if (!store) throw new NotFoundError("Module not found.");
      return store;
    },
  });
}

/** Read-only history facade sharing the tenant's atomic fixture state. */
export function createFixtureRecordHistoryService(
  context: OrgContext,
  options?: FixtureRecordServiceOptions,
): RecordHistoryService {
  return createFixtureRecordService(context, options).history;
}

/** Organization-bound tag facade sharing record transactions and lifecycle hooks. */
export function createFixtureTagService(
  context: OrgContext,
  options?: FixtureRecordServiceOptions,
): TagService {
  return createFixtureRecordService(context, options).tags;
}

/** Organization-bound recoverable deletion facade; transport is deliberately separate. */
export function createFixtureRecycleBinService(
  context: OrgContext,
  options?: FixtureRecordServiceOptions,
): RecycleBinService {
  return createFixtureRecordService(context, options).recycleBin;
}
