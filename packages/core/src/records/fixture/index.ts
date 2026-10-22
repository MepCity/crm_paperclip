import { randomUUID } from "node:crypto";
import { ATTACHMENT_PARENT_MODULES } from "../../attachments/modules";
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
  RelatedModuleFilter,
} from "../contract";
import type { HistorySource, RecordHistoryEvent, RecordHistoryService } from "../history";
import { isJsonArray, isJsonObject } from "../json";
import type { RecycleBinService } from "../recycle-bin";
import {
  relatedFilterModules,
  relatedFilterParentModules,
  validateRelatedModules,
} from "../related-module-filters";
import { roundMoneyTwoDecimals } from "../rounding";
import { matchesSystemFilters, validateSystemFilters } from "../system-filters";
import type { TagService } from "../tags";
import {
  attachmentParent,
  attachmentUltimateParent,
  fixtureAttachmentLifecycle,
  removeAttachmentIds,
} from "./attachments/hooks";
import { assignAutoNumber, seedAutoNumbers } from "./auto-number";
import { leadConvertMapping } from "./convert-mapping";
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
import { notesParentModules } from "./notes/metadata";
import { DEFAULT_LIST_SORT, matches, matchesSearch, sortRecords, validateCriteria } from "./query";
import { type DeletionManifest, fixtureRecycleBinService, retainDeletion } from "./recycle-bin";
import { type FixtureReferenceModule, resolveRecordReferences } from "./references";
import { type FixtureModuleBundle, fixtureModules } from "./registry";
import { relatedFilterHistory } from "./system-filter-history";
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

export type ConvertTarget = { reuseId: string; update?: RecordInput } | { create: RecordInput };
export interface ConvertLeadInput {
  account?: ConvertTarget;
  contact?: ConvertTarget;
  deal?: ConvertTarget;
}
export interface ConvertLeadResult {
  accountId: string | null;
  contactId: string | null;
  dealId: string | null;
}

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
  readonly attachmentLifecycle: ReturnType<typeof fixtureAttachmentLifecycle>;
  /** Core-only conversion coordinator; no wire contract yet (Module 4 owns the endpoint). */
  convertLead(leadId: string, input: ConvertLeadInput): Promise<ConvertLeadResult>;
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
              bundle.generateSeed(now).map((record, index) => [
                record.id,
                {
                  ...record,
                  fields: {
                    ...record.fields,
                    // Internal lock state is separate from exported module fields.
                    ...(["Calls", "Events", "Campaigns"].includes(name)
                      ? { Locked__s: index === 125 }
                      : {}),
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
    for (const [name, bundle] of Object.entries(fixtureModules)) {
      if (bundle.autoNumberField)
        seedAutoNumbers(seedContext.moduleStore(name), bundle.autoNumberField);
      bundle.afterSeed?.(seedContext);
    }
    // Seeded notes get their parent-stream row up front, as if created through the service.
    const notes = store.modules.get("Notes");
    const seedEvents = relatedFilterHistory(
      new Map(),
      store.modules,
      [],
      {
        sequence: 0,
        occurredAt: new Date(0).toISOString(),
        actor: { id: "system", name: "System" },
        source: "manual",
      },
      "seed",
    )
      .filter((event) => event.kind === "note_added")
      .map((event) => {
        // Date the row at the note's own creation so seeds never count as recent activity.
        const created = notes?.records.get(event.subject.recordId)?.fields.Created_Time;
        const at = typeof created === "string" ? Date.parse(created) : Number.NaN;
        return { ...event, occurredAt: new Date(Number.isNaN(at) ? 0 : at).toISOString() };
      });
    if (seedEvents.length) fixtureHistoryStore(store.history).appendBatch(seedEvents);
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
  const noteParentVisible = (fields: RecordData["fields"]) => {
    const parent = fields.Parent_Id;
    return (
      isJsonObject(parent) &&
      typeof parent.module === "string" &&
      typeof parent.id === "string" &&
      Object.hasOwn(fixtureModules, parent.module) &&
      moduleStore(parent.module).records.has(parent.id) &&
      options?.canReadRecord?.(parent.module, parent.id) !== false
    );
  };
  const assertNoteParentVisible = (module: string, fields: RecordData["fields"]) => {
    if (module === "Notes" && !noteParentVisible(fields))
      throw new NotFoundError("Record not found.");
  };
  const recordFor = (module: string, id: string) => {
    const record = moduleStore(module).records.get(id);
    if (!record) throw new NotFoundError("Record not found.");
    assertNoteParentVisible(module, record.fields);
    return record;
  };
  const resolveRead = (module: string, record: RecordData, now = clock()) => {
    const bundle = bundleFor(module);
    if (module === "Attachments") attachmentUltimateParent(record.fields, hookContext);
    // Some modules have no public lock field; their fixture lock remains server-only.
    const publicRecord =
      Object.hasOwn(record.fields, "Locked__s") &&
      !bundle.metadata.fields.some((field) => field.apiName === "Locked__s")
        ? {
            ...record,
            fields: Object.fromEntries(
              Object.entries(record.fields).filter(([name]) => name !== "Locked__s"),
            ),
          }
        : record;
    return resolveRecordReferences(
      bundle.metadata.fields.some((field) => field.apiName === "Tag")
        ? projectTags(moduleStore(module), bundle.readRecord?.(publicRecord, now) ?? publicRecord)
        : (bundle.readRecord?.(publicRecord, now) ?? publicRecord),
      bundle.metadata.fields,
      referenceModules(),
    );
  };
  /** Drops the required flag from fields a module hook declares optional for this record. */
  const relaxRequired = (
    bundle: FixtureModuleBundle,
    fields: Readonly<Record<string, FieldValue>>,
  ) => {
    const optional = bundle.optionalFields?.(fields);
    return optional?.length
      ? bundle.metadata.fields.map((f) =>
          optional.includes(f.apiName) ? { ...f, required: false } : f,
        )
      : bundle.metadata.fields;
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
  /** Builds a per-parent predicate for `relatedModules` conditions (EXISTS / NOT EXISTS). */
  const relatedModuleMatcher = async (module: string, rows: readonly RelatedModuleFilter[]) => {
    validateRelatedModules(rows);
    if (!relatedFilterParentModules.has(module))
      throw new ValidationError({ relatedModules: ["Choose a parent record module."] });
    const now = clock();
    const runtimeCtx = { userId: ctx.userId, now };
    const linked = rows.map((row) => {
      const target = relatedFilterModules[row.module];
      if (!Object.hasOwn(fixtureModules, target.module))
        throw new ValidationError({ relatedModules: ["Choose a valid related module."] });
      const childFields = new Map(
        bundleFor(target.module).metadata.fields.map((field) => [field.apiName, field]),
      );
      for (const criterion of row.criteria) validateCriteria(criterion, childFields);
      const parents = new Set<string>();
      for (const child of moduleStore(target.module).records.values()) {
        if (options?.canReadRecord?.(target.module, child.id) === false) continue;
        const parentIds =
          target.kind === "note"
            ? noteParentVisible(child.fields) &&
              isJsonObject(child.fields.Parent_Id) &&
              child.fields.Parent_Id.module === module
              ? [String(child.fields.Parent_Id.id)]
              : []
            : activityParentIds(module, child);
        if (!parentIds.length) continue;
        const resolved = resolveRead(target.module, child, now);
        if (!row.criteria.every((c) => matches(resolved, c, runtimeCtx, childFields))) continue;
        for (const id of parentIds) parents.add(id);
      }
      return { presence: row.presence, parents };
    });
    return (id: string) =>
      linked.every(({ presence, parents }) => (presence === "with") === parents.has(id));
  };
  const matching = async (
    module: string,
    query: Pick<
      ListQuery,
      | "viewId"
      | "filters"
      | "search"
      | "activityFilter"
      | "campaignFilter"
      | "systemFilters"
      | "relatedModules"
    >,
    applyView = true,
    now = clock(),
  ) => {
    const bundle = bundleFor(module);
    if (query.systemFilters !== undefined)
      validateSystemFilters(query.systemFilters, {
        module,
        memberIds: options?.listMemberIds ? await options.listMemberIds() : [...state.memberIds],
        relatedModules: [
          ...((notesParentModules as readonly string[]).includes(module) ? ["Notes"] : []),
          ...(ATTACHMENT_PARENT_MODULES.includes(module) ? ["Attachments"] : []),
          ...(activityParentModules.has(module) ? ["Tasks", "Events", "Calls"] : []),
        ],
      });
    const systemFilters =
      query.systemFilters && Object.keys(query.systemFilters).length
        ? query.systemFilters
        : undefined;
    const systemEvents = systemFilters
      ? [...state.history.values()].filter(
          (event) =>
            options?.canReadRecord?.(event.subject.module, event.subject.recordId) !== false,
        )
      : [];
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
    const relatedRows = query.relatedModules?.length
      ? await relatedModuleMatcher(module, query.relatedModules)
      : undefined;
    const activities = query.activityFilter ? linkedActivities(module, now) : undefined;
    const runtimeCtx = { userId: ctx.userId, now };
    const storedRows = [...moduleStore(module).records.values()];
    bundle.orderRows?.(storedRows);
    return storedRows
      .filter((record) => module !== "Notes" || noteParentVisible(record.fields))
      .filter((record) => module !== "Attachments" || record.fields.$state === "ready")
      .filter(
        (record) =>
          !systemFilters || matchesSystemFilters(module, record, systemFilters, systemEvents),
      )
      .map((record) => resolveRead(module, record, now))
      .filter(
        (record) =>
          ((!systemFilters && !relatedRows) ||
            options?.canReadRecord?.(module, record.id) !== false) &&
          (!view?.criteria || matches(record, view.criteria, runtimeCtx, fieldMap)) &&
          (!query.filters || matches(record, query.filters, runtimeCtx, fieldMap)) &&
          matchesSearch(record, query.search, bundle.searchFields) &&
          (!relatedRows || relatedRows(record.id)) &&
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
      const commit = {
        sequence: state.sequence + 1,
        occurredAt: clock().toISOString(),
        actor: { id: ctx.userId, name: options?.actorName ?? ctx.userId },
        source: options?.source ?? ("manual" as const),
      };
      const operationId = operation.operationId ?? randomUUID();
      const events = historyBatch(
        previous,
        state.modules,
        fixtureModules,
        { ...operation, operationId },
        commit,
      );
      const noteIds = new Set(
        [...state.history.values()]
          .filter((event) => event.kind === "note_added")
          .map((event) => event.subject.recordId),
      );
      events.push(
        ...relatedFilterHistory(previous, state.modules, events, commit, operationId).filter(
          (event) => event.kind !== "note_added" || !noteIds.has(event.subject.recordId),
        ),
      );
      const nextHistory = new Map(state.history);
      if (events.length) options?.beforeHistoryAppend?.(copy(events));
      fixtureHistoryStore(nextHistory).appendBatch(events);
      for (const [id, event] of nextHistory) {
        if (event.kind !== "note_added") continue;
        const note = state.modules.get("Notes")?.records.get(event.subject.recordId);
        const parent = attachmentParent(note?.fields.Parent_Id);
        if (
          parent &&
          (event.stream.module !== parent.module || event.stream.recordId !== parent.id)
        )
          nextHistory.set(id, { ...event, stream: { module: parent.module, recordId: parent.id } });
      }
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
      // Restore honours the same per-record optional fields as create/update (e.g. planned calls).
      const writableFields = relaxRequired(bundle, record.fields).filter(
        (field) =>
          !field.readOnly && !bundle.managedFields.has(field.apiName) && field.apiName !== "Tag",
      );
      const restoreInput = Object.fromEntries(
        writableFields.map((field) => [field.apiName, record.fields[field.apiName] ?? null]),
      );
      const optional = bundle.optionalFields?.(record.fields) ?? [];
      validateInput(
        restoreInput,
        false,
        writableFields.map((field) =>
          optional.includes(field.apiName) ? { ...field, required: false } : field,
        ),
        new Set(),
      );
      validateReferences(module, record.fields);
      assertNoteParentVisible(module, record.fields);
      if (module === "Attachments") attachmentUltimateParent(record.fields, hookContext);
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

  /** Synchronous insert shared by create and the conversion coordinator; callers validate first. */
  const insertRecord = (module: string, normalized: Record<string, FieldValue>): RecordData => {
    const bundle = bundleFor(module);
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
    if (bundle.autoNumberField) assignAutoNumber(moduleState, bundle.autoNumberField, fields);
    bundle.applyRules?.(fields, normalized, undefined, hookContext);
    assertNoteParentVisible(module, fields);
    fields[bundle.displayNameField] = bundle.fullName(fields);
    const record = { id, fields };
    assertUniqueFieldValues(
      bundle.metadata.fields,
      projectRecordsWithOverrides(moduleState.records, new Map([[id, fields]])),
    );
    moduleState.records.set(id, record);
    bundle.afterWrite?.(record, undefined, hookContext);
    return copy(resolveRead(module, record));
  };

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
        await matching(module, { viewId: "" }, false),
        fields,
        bundle.metadata.fields,
        bundle.managedFields,
      ),
    );
  };

  const attachmentLifecycle = fixtureAttachmentLifecycle(hookContext);
  const convertLead = async (leadId: string, input: ConvertLeadInput) => {
    assertModuleWritable("Leads");
    const sourceLead = recordFor("Leads", leadId);
    if (!input.contact)
      throw new ValidationError({ contact: ["Choose or create a contact to convert into."] });
    const targets = [
      ["Accounts", input.account, "Converted_Account", "accountId"],
      ["Contacts", input.contact, "Converted_Contact", "contactId"],
      ["Deals", input.deal, "Converted_Deal", "dealId"],
    ] as const;
    const lookup = (module: string, id: string, name?: FieldValue): FieldValue => ({
      module,
      id,
      ...(typeof name === "string" ? { name } : {}),
    });
    /** Explicit input wins over the mapped lead values; links are added by the caller. */
    const explicitInput = (
      module: "Accounts" | "Contacts" | "Deals",
      lead: RecordData,
      target: NonNullable<(typeof targets)[number][1]>,
    ): RecordInput => {
      if ("reuseId" in target) return target.update ?? {};
      const bundle = bundleFor(module);
      const defaults: Record<string, FieldValue> = {};
      for (const [to, from] of Object.entries(leadConvertMapping[module])) {
        const value = lead.fields[from];
        if (value != null && bundle.metadata.fields.some((field) => field.apiName === to))
          defaults[to] = value;
      }
      return { ...defaults, Owner: lead.fields.Owner ?? ctx.userId, ...target.create };
    };
    const linkFields = (
      module: "Accounts" | "Contacts" | "Deals",
      account: FieldValue | undefined,
      contact: FieldValue | undefined,
    ): Record<string, FieldValue> => ({
      ...(module !== "Accounts" && account ? { Account_Name: account } : {}),
      ...(module === "Deals" && contact ? { Contact_Name: contact } : {}),
    });
    // Validate like create/update before staging anything (async work stays outside atomic).
    for (const [module, target] of targets) {
      if (!target) continue;
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      const stringFields = stringFieldNames(bundle);

      if ("reuseId" in target) {
        const existing = recordFor(module, target.reuseId);
        if (!target.update) continue;
        const normalized = normalizeInput(target.update, stringFields, bundle.metadata.fields);
        validateInput(
          normalized,
          true,
          relaxRequired(bundle, { ...existing.fields, ...normalized }),
          bundle.managedFields,
        );
        validateReferences(module, normalized);
        await validateOwner(normalized);
        continue;
      }
      const normalized = normalizeInput(
        explicitInput(module, sourceLead, target),
        stringFields,
        bundle.metadata.fields,
      );
      const linked = {
        ...linkFields(
          module,
          input.account ? lookup("Accounts", "0") : undefined,
          input.contact ? lookup("Contacts", "0") : undefined,
        ),
        ...normalized,
      };
      validateInput(linked, false, relaxRequired(bundle, linked), bundle.managedFields);
      validateReferences(module, normalized);
      await validateOwner(normalized);
    }
    return atomic(
      { module: "Leads", recordId: leadId, kind: "record_converted", mechanism: "convert" },
      () => {
        const lead = recordFor("Leads", leadId);
        assertWritable(lead);
        if (lead.fields.Converted__s === true)
          throw new ValidationError({ Converted__s: ["This lead is already converted."] });
        const stamp = clock().toISOString();
        const refs: Record<string, FieldValue> = {};
        const ids: Record<string, string | null> = {};
        let account: FieldValue | undefined;
        let contact: FieldValue | undefined;
        for (const [module, target, leadField, resultKey] of targets) {
          ids[resultKey] = null;
          if (!target) continue;
          const bundle = bundleFor(module);
          const moduleState = moduleStore(module);
          const links = linkFields(module, account, contact);
          let record: RecordData;
          if ("reuseId" in target) {
            const existing = recordFor(module, target.reuseId);
            assertWritable(existing);
            // A reused contact keeps an account it already has.
            const newLinks = Object.fromEntries(
              Object.entries(links).filter(([name]) => existing.fields[name] == null),
            );
            const normalized = normalizeInput(
              { ...newLinks, ...explicitInput(module, lead, target) },
              stringFieldNames(bundle),
              bundle.metadata.fields,
            );
            const fields: Record<string, FieldValue> = {
              ...copy(existing.fields),
              ...normalized,
              Modified_By: ctx.userId,
              Modified_Time: stamp,
            };
            bundle.applyRules?.(fields, normalized, copy(existing.fields), hookContext);
            fields[bundle.displayNameField] = bundle.fullName(fields);
            if (JSON.stringify(fields) === JSON.stringify(existing.fields)) record = existing;
            else {
              assertUniqueFieldValues(
                bundle.metadata.fields,
                projectRecordsWithOverrides(moduleState.records, new Map([[existing.id, fields]])),
              );
              record = { id: existing.id, fields };
              bundle.afterWrite?.(record, copy(existing), hookContext);
              moduleState.records.set(record.id, record);
            }
          } else {
            const normalized = normalizeInput(
              { ...links, ...explicitInput(module, lead, target) },
              stringFieldNames(bundle),
              bundle.metadata.fields,
            );
            record = insertRecord(module, normalized);
          }
          ids[resultKey] = record.id;
          const ref = lookup(module, record.id, record.fields[bundle.displayNameField]);
          refs[leadField] = ref;
          if (module === "Accounts") account = ref;
          if (module === "Contacts") contact = ref;
        }
        moduleStore("Leads").records.set(leadId, {
          id: leadId,
          fields: {
            ...copy(lead.fields),
            ...refs,
            Converted__s: true,
            Converted_Date_Time: stamp,
            Modified_By: ctx.userId,
            Modified_Time: stamp,
          },
        });
        return {
          accountId: ids.accountId ?? null,
          contactId: ids.contactId ?? null,
          dealId: ids.dealId ?? null,
        };
      },
    );
  };
  return {
    convertLead,
    attachmentLifecycle: {
      ...attachmentLifecycle,
      publish(id, data) {
        return atomic(
          { module: "Attachments", recordId: id, mechanism: "attachment_publish" },
          () => attachmentLifecycle.publish(id, data),
        );
      },
    },
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
      (event) => {
        if (event.kind === "note_added") {
          const note = state.modules.get("Notes")?.records.get(event.subject.recordId);
          if (!note || !noteParentVisible(note.fields)) return null;
          return {
            ...(options?.canReadField?.("Notes", "Note_Title") !== false &&
            typeof note.fields.Note_Title === "string"
              ? { name: note.fields.Note_Title }
              : {}),
            payload: {
              body:
                options?.canReadField?.("Notes", "Note_Content") !== false
                  ? String(note.fields.Note_Content ?? "")
                  : "",
            },
          };
        }
        if (["attachment_added", "attachment_deleted"].includes(event.kind)) {
          const noteId = event.payload?.noteId;
          if (typeof noteId === "string") {
            const note = state.modules.get("Notes")?.records.get(noteId);
            if (
              !note ||
              !noteParentVisible(note.fields) ||
              options?.canReadRecord?.("Notes", noteId) === false
            )
              return null;
          }
        }
        if (
          ["attachment_added", "attachment_deleted"].includes(event.kind) &&
          options?.canReadField?.("Attachments", "File_Name") !== false
        )
          return { name: event.subject.name ?? undefined, payload: null };
        return { payload: null };
      },
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
          (await matching(module, { viewId: "", filters: query.filters }, false)).filter((record) =>
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
      const rows = sortRecords(await matching(module, query, true, now), applied, fieldMap);
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
      return (await matching(module, query)).length;
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
      const rows = await matching(module, query);
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
      validateInput(normalized, false, relaxRequired(bundle, normalized), bundle.managedFields);
      validateReferences(module, normalized);
      await validateOwner(normalized);
      return atomic({ module, mechanism: "create" }, () => insertRecord(module, normalized));
    },
    async update(module, id, input) {
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      recordFor(module, id);
      const stringFields = stringFieldNames(bundle);
      const normalized = normalizeInput(input, stringFields, bundle.metadata.fields);
      validateInput(
        normalized,
        true,
        relaxRequired(bundle, { ...recordFor(module, id).fields, ...normalized }),
        bundle.managedFields,
      );
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
export function createFixtureAttachmentLifecycle(
  context: OrgContext,
  options?: FixtureRecordServiceOptions,
) {
  return createFixtureRecordService(context, options).attachmentLifecycle;
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
