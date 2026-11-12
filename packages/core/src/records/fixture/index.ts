import { randomUUID } from "node:crypto";
import { childRecordLevel } from "../../access/evaluate";
import { ATTACHMENT_PARENT_MODULES } from "../../attachments/modules";
import type { CustomizationPort } from "../../customization";
import type { InMemorySchemaCoordinator } from "../../customization/coordinator";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RecordLockedError,
  ValidationError,
} from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import {
  type ChildLevelResolver,
  createRecordAccessChecker,
  type RecordAccessChecker,
  type RecordAccessSource,
} from "../access-policy";
import { projectMetadataForViewer, projectViewForViewer } from "../access-projection";
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
  ActorRef,
  ConvertLeadInput,
  DuplicateGroup,
  FieldDefinition,
  FieldValue,
  ListQuery,
  MergeInput,
  ModuleMetadataReader,
  RecordData,
  RecordInput,
  RecordService,
  RecordWriteOptions,
  RelatedModuleFilter,
} from "../contract";
import type { HistorySource, RecordHistoryEvent, RecordHistoryService } from "../history";
import { isJsonArray, isJsonObject } from "../json";
import {
  evaluatePortalSelect,
  PORTAL_READ_MODULES,
  type PortalSelectQuery,
  type PortalSelectResult,
} from "../portal-select";
import type { RecycleBinService } from "../recycle-bin";
import {
  relatedFilterModules,
  relatedFilterParentModules,
  validateRelatedModules,
} from "../related-module-filters";
import { roundMoneyTwoDecimals } from "../rounding";
import { matchesSystemFilters, validateSystemFilters } from "../system-filters";
import type { TagService } from "../tags";
import type { RecordWriteObserver } from "../write-observer";
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
import { readFixtureModuleProjection } from "./metadata-projection";
import { notesParentModules } from "./notes/metadata";
import {
  DEFAULT_LIST_SORT,
  matches,
  matchesSearch,
  sortRecords,
  validateCriteria,
  withLineItemFilterFields,
} from "./query";
import { type DeletionManifest, fixtureRecycleBinService, retainDeletion } from "./recycle-bin";
import { type FixtureReferenceModule, resolveRecordReferences } from "./references";
import { type FixtureModuleBundle, fixtureModules } from "./registry";
import { schemaRecordService } from "./schema-service";
import { validateSchemaRecord } from "./schema-validation";
import { relatedFilterHistory } from "./system-filter-history";
import { fixtureTagService, projectTags } from "./tags";
import { assertUniqueFieldValues, projectRecordsWithOverrides } from "./unique";
import { assertSourceTimes, validateInput } from "./validation";

interface FixtureStore {
  schema?: InMemorySchemaCoordinator;
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

const dropIgnored = (
  bundle: { ignoredInputFields?: ReadonlySet<string> },
  input: RecordInput,
): RecordInput =>
  bundle.ignoredInputFields
    ? Object.fromEntries(
        Object.entries(input).filter(([name]) => !bundle.ignoredInputFields?.has(name)),
      )
    : input;

export interface FixtureRecordServiceOptions extends FixtureHistoryPermissions {
  /**
   * Record access policy source (ADR 0017 §6): applied in the single candidate-selection step
   * and on get/write. Without it the service acts as the organisation system actor (§4.8),
   * which production callers must request explicitly with `system: true`.
   */
  access?: RecordAccessSource;
  /** Marks an intentional system actor (automation, worker, approval write-back). */
  system?: boolean;
  /** Bounded principal (ADR 0019 §3.1). */
  actor?: ActorRef;
  customization?: CustomizationPort;
  /** Internal ephemeral schema integration; shared by every service for this organization. */
  schema?: InMemorySchemaCoordinator;
  actorName?: string;
  source?: HistorySource;
  /** Internal synchronous failure seam; runs before staged history publication. */
  beforeHistoryAppend?: (events: readonly RecordHistoryEvent[]) => void;
  /** Clock for seed times, write timestamps and date tokens. Defaults to the system clock. */
  now?: () => Date;
  /** Live membership source; defaults to authorized contexts opened in this fixture org. */
  listMemberIds?: () => Promise<readonly string[]>;
  /** Approval lock and submission observer (ADR 0018 §5). Omitted for system writes. */
  writeObserver?: RecordWriteObserver;
}

function moduleBundle(module: string): FixtureModuleBundle {
  const bundle = Object.hasOwn(fixtureModules, module) ? fixtureModules[module] : undefined;
  if (!bundle) throw new NotFoundError("Module not found.");
  return bundle;
}

export function createFixtureRecordService(
  context: OrgContext,
  options?: FixtureRecordServiceOptions,
): RecordService &
  Required<Pick<RecordService, "convertQuoteToInvoice">> &
  ModuleMetadataReader & {
    readonly attachmentLifecycle: ReturnType<typeof fixtureAttachmentLifecycle>;
    readonly history: RecordHistoryService;
    readonly tags: TagService;
    readonly recycleBin: RecycleBinService;
    /** Portal reads; only with a portal actor (ADR 0019a §4). */
    readonly portalSelect: (query: PortalSelectQuery) => PortalSelectResult;
  } {
  const ctx = { ...context };
  const isWebformActor = options?.actor?.kind === "webform";
  const webformFormName = options?.actor?.kind === "webform" ? options.actor.formName : undefined;
  const isCadenceActor = options?.actor?.kind === "cadence";
  const cadenceActor = options?.actor?.kind === "cadence" ? options.actor : undefined;
  const isJourneyActor = options?.actor?.kind === "journey";
  const journeyActor = options?.actor?.kind === "journey" ? options.actor : undefined;
  const portalActor = options?.actor?.kind === "portal" ? options.actor : undefined;
  // The portal actor is neither a member (no AccessSnapshot) nor the system bypass (§4.3).
  if (portalActor && (options?.access || options?.system))
    throw new Error("A portal actor cannot carry member access or the system flag.");
  let webformRecordsCreated = 0;
  const assertWebformCanRead = () => {
    if (isWebformActor) {
      throw new ForbiddenError("Webform actor cannot read records", "permission_denied");
    }
  };
  const assertWebformCanMutate = () => {
    if (isWebformActor) {
      throw new ForbiddenError(
        "Webform actor cannot update or delete records",
        "permission_denied",
      );
    }
  };
  const assertExecutionActorCanAccess = (module: string) => {
    if (isCadenceActor && cadenceActor) {
      const allowed = new Set([
        ...(cadenceActor.module ? [cadenceActor.module] : []),
        ...(cadenceActor.allowedModules ?? []),
        "Tasks",
        "Calls",
        "Events",
      ]);
      if (!allowed.has(module)) {
        throw new ForbiddenError(
          `Cadence actor cannot access module '${module}'`,
          "permission_denied",
        );
      }
    }
    if (isJourneyActor && journeyActor) {
      const allowed = new Set([
        ...(journeyActor.module ? [journeyActor.module] : []),
        ...(journeyActor.allowedModules ?? []),
        "Tasks",
        "Calls",
      ]);
      if (!allowed.has(module)) {
        throw new ForbiddenError(
          `Journey actor cannot access module '${module}'`,
          "permission_denied",
        );
      }
    }
  };
  const assertCadenceCanAccess = assertExecutionActorCanAccess;

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
  if (!state.schema && options?.schema && state.memberIds.size)
    throw new ConflictError(
      "Schema coordination must be configured before opening organization records.",
    );
  if (state.schema && options?.schema && state.schema !== options.schema)
    throw new ConflictError("Organization already has a schema coordinator.");
  state.schema ??= options?.schema;
  const schema = state.schema;
  for (const [module, bundle] of Object.entries(fixtureModules)) {
    if (!schema?.metadata.hasModule(module)) continue;
    schema.register(ctx.orgId, module, {
      records: () => {
        const current = state.modules.get(module);
        return [...(current?.records.values() ?? []), ...(current?.deletedRecords?.values() ?? [])];
      },
      // Built-in code can depend on any baseline field. Custom scalar fields have no
      // executable hooks; layouts and views are checked by the metadata resolver.
      dependencies: () => ({
        complete: true,
        fieldIds: bundle.metadata.fields.map((f) => {
          return (
            schema.read(ctx.orgId, module).fields.find((field) => field.apiName === f.apiName)
              ?.id ?? f.apiName
          );
        }),
      }),
    });
  }
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
  const bundleFor = (module: string): FixtureModuleBundle => {
    const bundle = moduleBundle(module);
    if (!schema?.metadata.hasModule(module)) return bundle;
    const effective = schema.read(ctx.orgId, module);
    const byId = new Map(effective.fields.map((field) => [field.id, field.apiName]));
    const name = (id: string) => {
      const apiName = byId.get(id);
      if (!apiName) throw new ValidationError({ fields: ["Inactive schema field reference."] });
      return apiName;
    };
    const criteria = (value: import("../contract").Criteria): import("../contract").Criteria =>
      "group" in value
        ? { ...value, group: value.group.map(criteria) }
        : {
            ...value,
            field: effective.externalCriteriaFields.includes(value.field)
              ? value.field
              : name(value.field),
          };
    return {
      ...bundle,
      metadata: {
        ...bundle.metadata,
        singularLabel: effective.singularLabel,
        pluralLabel: effective.pluralLabel,
        businessCardFields: bundle.metadata.businessCardFields.filter((name) =>
          effective.fields.some((field) => field.apiName === name),
        ),
        fields: effective.fields,
        layout:
          effective.layouts[0]?.sections.map((section) => ({
            label: section.label,
            columnCount: section.columnCount,
            columns: section.columns.map((column) => column.map(name)),
            fields: section.fields.map(name),
          })) ?? [],
      },
      views: effective.views.map((view) => ({
        ...view,
        columns: view.columns.map(name),
        criteria: view.criteria ? criteria(view.criteria) : null,
        sort: view.sort ? { ...view.sort, field: name(view.sort.field) } : null,
      })),
      searchFields: bundle.searchFields.filter((apiName) =>
        effective.fields.some((f) => f.apiName === apiName),
      ),
    };
  };
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
  const childLevel: ChildLevelResolver = (module, fields, levelOf) => {
    if (!["Notes", "Attachments", "Contact_Roles", "Campaign_Members"].includes(module))
      return undefined;
    let parent: { module: string; id: string } | undefined;
    if (module === "Notes") parent = attachmentParent(fields.Parent_Id);
    else if (module === "Contact_Roles") parent = attachmentParent(fields.Deal);
    else if (module === "Campaign_Members") parent = attachmentParent(fields.Campaign);
    else {
      try {
        parent = attachmentUltimateParent(fields as RecordData["fields"], hookContext);
      } catch {
        return "none";
      }
    }
    const parentRecord = parent && moduleStore(parent.module).records.get(parent.id);
    if (!parent || !parentRecord) return "none";
    const author = fields.Created_By;
    const authorId =
      typeof author === "string" ? author : isJsonObject(author) ? author.id : undefined;
    return childRecordLevel(levelOf(parent.module, parentRecord.fields), authorId === ctx.userId);
  };
  let checkerPromise: Promise<RecordAccessChecker | undefined> | undefined;
  const accessFor = () =>
    // One snapshot per service instance (one request); undefined = system actor.
    (checkerPromise ??= options?.access
      ? options.access().then((snapshot) => createRecordAccessChecker(snapshot, childLevel))
      : Promise.resolve(undefined));
  // The history reader's permission hooks are synchronous; the guard below resolves the access
  // checker before every read so the timeline follows the same record and field rules (§4.5).
  let historyAccess: RecordAccessChecker | undefined;
  const guardedHistory = (inner: RecordHistoryService): RecordHistoryService => ({
    async list(module, recordId, query) {
      assertWebformCanRead();
      historyAccess = await accessFor();
      return inner.list(module, recordId, query);
    },
  });
  const assertRecordLevel = async (
    module: string,
    ids: readonly string[],
    operation: "read" | "edit" | "delete",
  ) => {
    const acc = await accessFor();
    if (!acc) return;
    // Atomic (§4.6): every selected record must pass; invisible ids count as missing.
    for (const id of ids) {
      const record = moduleStore(module).records.get(id);
      if (record) acc.assert(module, record.fields, operation);
    }
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
    const activeRecord = schema?.metadata.hasModule(module)
      ? {
          ...publicRecord,
          fields: Object.fromEntries(
            bundle.metadata.fields.map((field) => [
              field.apiName,
              publicRecord.fields[field.apiName] ?? null,
            ]),
          ),
        }
      : publicRecord;
    return resolveRecordReferences(
      bundle.metadata.fields.some((field) => field.apiName === "Tag")
        ? projectTags(moduleStore(module), bundle.readRecord?.(activeRecord, now) ?? activeRecord)
        : (bundle.readRecord?.(activeRecord, now) ?? activeRecord),
      bundle.metadata.fields,
      referenceModules(),
    );
  };
  /** Drops the required flag from fields a module hook declares optional for this record. */
  const relaxRequired = (
    bundle: FixtureModuleBundle,
    fields: Readonly<Record<string, FieldValue>>,
    options?: RecordWriteOptions,
  ) => {
    const optional = bundle.optionalFields?.(fields);
    const allowEmptyLines = options?.allowEmptyLines === true;
    return optional?.length || allowEmptyLines
      ? bundle.metadata.fields.map((f) => {
          if (allowEmptyLines && f.dataType === "subform") {
            return { ...f, required: false };
          }
          return optional?.includes(f.apiName) &&
            moduleBundle(bundle.metadata.apiName).metadata.fields.find(
              (base) => base.apiName === f.apiName,
            )?.required === f.required
            ? { ...f, required: false }
            : f;
        })
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
  const observer = options?.writeObserver;
  const assertUnlocked = async (
    module: string,
    ids: readonly string[],
    operation: "update" | "delete",
  ) => {
    if (observer) await observer.assertEditable({ module, ids, operation });
  };
  /** Imports carry source times and never submit approvals; the observer must not fail a write. */
  const publishWrite = async (
    module: string,
    kind: "create" | "edit",
    record: RecordData,
    previous: RecordData | undefined,
    writeOptions?: RecordWriteOptions,
  ) => {
    if (!observer || writeOptions?.sourceTimes || writeOptions?.allowEmptyLines) return;
    try {
      const label = String(record.fields[bundleFor(module).displayNameField] ?? "");
      await observer.afterWrite({ module, kind, record: copy(record), previous, label });
    } catch (error) {
      console.error("Record write observer failed", error);
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
    const acc = await accessFor();
    acc?.assertCriteria(module, query.filters);
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
    const rawView = applyView ? viewFor(module, query.viewId) : undefined;
    const view = rawView && acc ? projectViewForViewer(rawView, acc.hiddenFields(module)) : rawView;
    const fieldMap = withLineItemFilterFields(
      new Map(bundle.metadata.fields.map((field) => [field.apiName, field])),
    );
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
      .filter((record) => !acc || acc.visible(module, record.fields))
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
      )
      .map((record) => (acc ? acc.project(module, record) : record));
  };
  const validateIds = (ids: readonly string[]) => {
    if (ids.length < 1 || ids.length > 500)
      throw new ValidationError({ ids: ["Choose between 1 and 500 records."] }, undefined, "limit");
  };
  const atomic = <T>(operation: FixtureHistoryOperation, write: () => T): T =>
    schema
      ? schema.commit(ctx.orgId, () => atomicWrite(operation, write))
      : atomicWrite(operation, write);
  const atomicWrite = <T>(operation: FixtureHistoryOperation, write: () => T): T => {
    const previous = state.modules;
    const previousDeletions = state.deletions;
    state.deletions = new Map(previousDeletions);
    const staged = new Map(previous);
    state.modules = staged;
    transactionOriginal = previous;
    hookCopies = new Set();
    try {
      const result = write();
      if (schema) {
        for (const [module, current] of state.modules) {
          if (!schema.metadata.hasModule(module)) continue;
          const effective = schema.read(ctx.orgId, module);
          const baselineFields = moduleBundle(module).metadata.fields;
          const constraints = effective.fields.filter((field) => {
            const original = baselineFields.find((f) => f.apiName === field.apiName);
            return (
              !original ||
              ["required", "maxLength", "picklist"].some(
                (key) =>
                  JSON.stringify(original[key as keyof typeof original]) !==
                  JSON.stringify(field[key as keyof typeof field]),
              )
            );
          });
          for (const record of current.records.values()) {
            if (previous.get(module)?.records.get(record.id) !== record)
              validateSchemaRecord({ ...effective, fields: constraints }, record);
          }
        }
      }
      const commit = {
        sequence: state.sequence + 1,
        occurredAt: clock().toISOString(),
        actor:
          options?.actor?.kind === "webform"
            ? {
                id: options.actor.formId,
                name: webformFormName ?? options.actor.formName ?? options.actorName ?? "Webform",
              }
            : options?.actor?.kind === "cadence"
              ? {
                  id: options.actor.id,
                  name: options.actorName ?? "Cadence",
                }
              : portalActor
                ? { id: portalActor.identityId, name: options?.actorName ?? "Portal user" }
                : { id: ctx.userId, name: options?.actorName ?? ctx.userId },
        source:
          options?.actor?.kind === "webform"
            ? ("webform" as const)
            : options?.actor?.kind === "cadence"
              ? ("cadence" as const)
              : portalActor
                ? ("portal" as const)
                : (options?.source ?? ("manual" as const)),
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
    access: accessFor,
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

  const batchWithObserver = async (
    module: string,
    ids: readonly string[],
    input: RecordInput,
    mechanism: string,
  ) => {
    const unique = [...new Set(ids)];
    await assertUnlocked(module, unique, "update");
    const previous = observer ? unique.map((id) => copy(recordFor(module, id))) : [];
    writeBatch(module, ids, input, mechanism);
    for (const before of previous)
      await publishWrite(module, "edit", copy(recordFor(module, before.id)), before);
  };

  /** Synchronous insert shared by create and the conversion coordinator; callers validate first. */
  const insertRecord = (
    module: string,
    normalized: Record<string, FieldValue>,
    options?: RecordWriteOptions,
  ): RecordData => {
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
    const sourceTimes = options?.sourceTimes;
    if (sourceTimes?.createdTime && "Created_Time" in fields)
      fields.Created_Time = sourceTimes.createdTime;
    if (sourceTimes?.modifiedTime && "Modified_Time" in fields)
      fields.Modified_Time = sourceTimes.modifiedTime;
    if (bundle.autoNumberField) assignAutoNumber(moduleState, bundle.autoNumberField, fields);
    if (options !== undefined) {
      bundle.applyRules?.(fields, normalized, undefined, hookContext, options);
    } else {
      bundle.applyRules?.(fields, normalized, undefined, hookContext);
    }
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
    assertWebformCanMutate();
    if (isCadenceActor || isJourneyActor)
      throw new ForbiddenError(
        isJourneyActor
          ? "Journey actor cannot merge records"
          : "Cadence actor cannot merge records",
        "permission_denied",
      );
    assertModuleWritable(module);
    const bundle = bundleFor(module);
    if (bundle.childModule) throw new ForbiddenError("Child modules do not support merge.");
    const ids = [...input.duplicateIds];
    const mergeAccess = await accessFor();
    if (mergeAccess) {
      // ADR 0017 §4.7: findAndMerge + RW on the master + RWD on the others.
      if (!mergeAccess.tool("findAndMerge", module))
        throw new ForbiddenError(undefined, "permission_denied");
      await assertRecordLevel(module, [input.masterId], "edit");
      await assertRecordLevel(module, ids, "delete");
    }
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
    assertWebformCanRead();
    const bundle = bundleFor(module);
    if (bundle.childModule) return [];
    // A hidden field must not be usable as a duplicate-match key (ADR 0017 §4.5).
    const dupAccess = await accessFor();
    for (const field of fields)
      if (dupAccess?.hiddenFields(module).has(field))
        throw new ForbiddenError(undefined, "field_forbidden");
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
    assertWebformCanMutate();
    if (isCadenceActor || isJourneyActor)
      throw new ForbiddenError(
        isJourneyActor
          ? "Journey actor cannot convert leads"
          : "Cadence actor cannot convert leads",
        "permission_denied",
      );
    assertModuleWritable("Leads");
    const sourceLead = recordFor("Leads", leadId);
    const convertAccess = await accessFor();
    if (convertAccess) {
      // ADR 0017 §4.7: tools.convert + RW on the lead + create on created / read on reused targets.
      if (!convertAccess.tool("convert", "Leads"))
        throw new ForbiddenError(undefined, "permission_denied");
      await assertRecordLevel("Leads", [leadId], "edit");
      for (const [targetModule, target] of [
        ["Accounts", input.account],
        ["Contacts", input.contact],
        ["Deals", input.deal],
      ] as const) {
        if (!target) continue;
        if ("reuseId" in target) await assertRecordLevel(targetModule, [target.reuseId], "read");
        else if (!convertAccess.can(targetModule, "create"))
          throw new ForbiddenError(undefined, "permission_denied");
      }
    }
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
  /** ADR 0016 §7: one atomic write; returns the new invoice id. The quote is not changed. */
  const convertQuoteToInvoice = async (quoteId: string): Promise<string> => {
    assertWebformCanMutate();
    assertModuleWritable("Invoices");
    const quote = recordFor("Quotes", quoteId);
    const q = quote.fields;
    const copied = [
      "Subject",
      "Account_Name",
      "Contact_Name",
      "Owner",
      "Terms_and_Conditions",
      "Description",
      "Discount",
      "Discount_Percentage",
      "Header_Tax",
      "Adjustment",
      ...[
        "Flat_House_No_Building_Apartment_Name",
        "Street",
        "City",
        "State",
        "Country",
        "Code",
        "Latitude",
        "Longitude",
      ].flatMap((part) => [`Billing_${part}`, `Shipping_${part}`]),
    ];
    const input: Record<string, FieldValue> = {};
    for (const name of copied) if (q[name] != null) input[name] = copy(q[name]);
    if (q.Deal_Name != null) input.Deal_Name__s = copy(q.Deal_Name);
    input.Status = "Created";
    input.Invoice_Date = clock().toISOString().slice(0, 10);
    const rows = Array.isArray(q.Quoted_Items) ? q.Quoted_Items : [];
    // Rows drop their ids and every computed value; the rules recompute them.
    input.Invoiced_Items = rows.map((row) => {
      const { id: _id, ...rest } = row as Record<string, FieldValue>;
      return copy(rest);
    });
    validateReferences("Invoices", input);
    return atomic(
      { module: "Invoices", mechanism: "convert_quote" },
      () => insertRecord("Invoices", input).id,
    );
  };
  const portalDenied = () =>
    new ForbiddenError("Portal actor cannot perform this operation", "permission_denied");
  /** `A`: the linked Contact's current Account, read from the live row. */
  const portalContactAccount = (): string | null => {
    const contact =
      portalActor && state.modules.get("Contacts")?.records.get(portalActor.contactId);
    const account = contact?.fields.Account_Name;
    return isJsonObject(account) && typeof account.id === "string" ? account.id : null;
  };
  /** Case create (ADR 0019a §4.3): projected `edit` keys plus server-set relationship. */
  const portalCaseInput = (module: string, input: RecordInput): RecordInput => {
    if (!portalActor || module !== "Cases") throw portalDenied();
    if (!state.modules.get("Contacts")?.records.has(portalActor.contactId))
      throw new NotFoundError("Record not found.");
    const allowed = new Set([...(portalActor.editableFields.Cases ?? []), "Owner"]);
    for (const key of Object.keys(input))
      if (!allowed.has(key))
        throw new ForbiddenError(`Portal actor cannot write field '${key}'`, "field_forbidden");
    const account = portalContactAccount();
    return {
      Status: "New",
      Case_Origin: "Web",
      ...input,
      Related_To: { module: "Contacts", id: portalActor.contactId },
      Account_Name: account ? { module: "Accounts", id: account } : null,
    };
  };
  const assertPortalSelfEdit = (module: string, id: string, input: RecordInput) => {
    if (!portalActor || module !== "Contacts" || id !== portalActor.contactId) throw portalDenied();
    const allowed = new Set(portalActor.editableFields.Contacts ?? []);
    for (const key of Object.keys(input))
      if (!allowed.has(key))
        throw new ForbiddenError(`Portal actor cannot write field '${key}'`, "field_forbidden");
  };
  const portalSelect = (query: PortalSelectQuery): PortalSelectResult => {
    if (!portalActor) throw portalDenied();
    if (!PORTAL_READ_MODULES.has(query.module)) throw new NotFoundError("Not found.");
    const fieldsOf = (module: string) =>
      new Map(bundleFor(module).metadata.fields.map((field) => [field.apiName, field]));
    const projected = fieldsOf(query.module);
    if (query.filters)
      validateCriteria(
        query.filters,
        new Map([...projected].filter(([name]) => query.columns.includes(name))),
      );
    const runtime = { userId: ctx.userId, now: clock() };
    return copy(
      evaluatePortalSelect(
        {
          rows: (module) => state.modules.get(module)?.records.values() ?? [],
          get: (module, id) =>
            Object.hasOwn(fixtureModules, module)
              ? state.modules.get(module)?.records.get(id)
              : undefined,
          displayName: (module, record) => {
            const name = record.fields[bundleFor(module).displayNameField];
            return typeof name === "string" ? name : "";
          },
          fields: fieldsOf,
          matches: (record, criteria, fields) => matches(record, criteria, runtime, fields),
          sort: (records, sort, fields) => sortRecords(records, sort, fields),
        },
        portalActor.contactId,
        query,
      ),
    );
  };
  const service: RecordService &
    Required<Pick<RecordService, "convertQuoteToInvoice">> &
    ModuleMetadataReader & {
      attachmentLifecycle: typeof attachmentLifecycle;
      history: RecordHistoryService;
      tags: TagService;
      recycleBin: RecycleBinService;
      portalSelect: typeof portalSelect;
    } = {
    convertLead,
    convertQuoteToInvoice,
    portalSelect,
    attachmentLifecycle: {
      ...attachmentLifecycle,
      publish(id, data) {
        return atomic(
          { module: "Attachments", recordId: id, mechanism: "attachment_publish" },
          () => attachmentLifecycle.publish(id, data),
        );
      },
    },
    // Tagging a record is a record write (ADR 0017 §7.3): invisible → 404, read-only → 403.
    tags: {
      ...tags,
      async addTags(module, recordId, ids) {
        assertWebformCanMutate();
        recordFor(module, recordId);
        await assertRecordLevel(module, [recordId], "edit");
        return tags.addTags(module, recordId, ids);
      },
      async removeTags(module, recordId, ids) {
        assertWebformCanMutate();
        recordFor(module, recordId);
        await assertRecordLevel(module, [recordId], "edit");
        return tags.removeTags(module, recordId, ids);
      },
      async listRecordTags(module, recordId) {
        assertWebformCanRead();
        recordFor(module, recordId);
        await assertRecordLevel(module, [recordId], "read");
        return tags.listRecordTags(module, recordId);
      },
    },
    recycleBin: {
      list(query) {
        assertWebformCanRead();
        return recycleBin.list(query);
      },
      restore(entryIds) {
        assertWebformCanMutate();
        return recycleBin.restore(entryIds);
      },
      purge(entryIds) {
        assertWebformCanMutate();
        return recycleBin.purge(entryIds);
      },
      empty() {
        assertWebformCanMutate();
        return recycleBin.empty();
      },
    },
    history: guardedHistory(
      fixtureHistoryReader(
        ctx,
        () => fixtureHistoryStore(state.history),
        () => state.sequence,
        (module, id) => {
          recordFor(module, id);
        },
        (module) => Object.hasOwn(fixtureModules, module),
        {
          canReadRecord: (module, id) => {
            if (options?.canReadRecord?.(module, id) === false) return false;
            const stored = state.modules.get(module)?.records.get(id);
            return !historyAccess || !stored || historyAccess.visible(module, stored.fields);
          },
          canReadField: (module, apiName) =>
            bundleFor(module).metadata.fields.some((field) => field.apiName === apiName) &&
            (options?.canReadField?.(module, apiName) ?? true) &&
            !historyAccess?.hiddenFields(module).has(apiName),
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
    ),
    merge,
    findDuplicateGroups,
    async deduplicate(module, fields) {
      assertWebformCanMutate();
      assertModuleWritable(module);
      moduleExists(module);
      const dedupAccess = await accessFor();
      // Without an access source only the administrator membership may deduplicate (fail-closed).
      if (dedupAccess ? !dedupAccess.tool("findAndMerge", module) : ctx.role !== "admin")
        throw new ForbiddenError(undefined, "permission_denied");
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
      assertWebformCanRead();
      if (typeof query.text !== "string" || query.text.trim().length < 3)
        throw new ValidationError({ text: ["Enter at least three characters."] });
      if (query.scope !== undefined && query.scope !== "all" && query.scope !== "nameOrTags")
        throw new ValidationError({ scope: ["Choose a search scope."] });
      const page = query.page ?? 1;
      const perPage = query.perPage ?? 30;
      if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(perPage) || perPage < 1)
        throw new ValidationError({ page: ["Choose positive integer paging values."] });
      const groups = [];
      const acc = await accessFor();
      for (const module of new Set(
        query.modules ?? Object.keys(fixtureModules).filter((name) => !bundleFor(name).readOnly),
      )) {
        const bundle = bundleFor(module);
        if (bundle.childModule) continue;
        // Global search spans modules, so the route gate cannot check them: a module the
        // profile cannot view contributes nothing (ADR 0017 §4.1, MEP-1468).
        if (acc && !acc.can(module, "view")) continue;
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
                    query.fields
                      .filter((name) => !acc?.hiddenFields(module).has(name))
                      .map((name) => [name, record.fields[name] ?? null]),
                  ),
                },
          ),
        });
      }
      return copy(groups);
    },
    async listKanbanViews(module) {
      assertWebformCanRead();
      return kanbanViews.list(module);
    },
    async getKanbanView(module, id) {
      assertWebformCanRead();
      return kanbanViews.get(module, id);
    },
    async createKanbanView(module, input) {
      assertWebformCanMutate();
      return kanbanViews.create(module, input);
    },
    async updateKanbanView(module, id, input) {
      assertWebformCanMutate();
      return kanbanViews.update(module, id, input);
    },
    async getHomeCurrency() {
      assertWebformCanRead();
      return { isoCode: "TRY", symbol: "TL", name: "Turkish Lira - TRY", prefixSymbol: true };
    },
    async getModuleProjection(module) {
      assertWebformCanRead();
      bundleFor(module);
      const projection = await readFixtureModuleProjection(
        ctx.orgId,
        module,
        schema?.metadata ?? options?.customization,
      );
      const acc = await accessFor();
      if (!acc) return projection;
      const hidden = acc.hiddenFields(module);
      return {
        ...projectMetadataForViewer(projection, { hidden, readOnly: acc.readOnlyFields(module) }),
        views: projection.views.map((view) => projectViewForViewer(view, hidden)),
      };
    },
    async getModule(module) {
      assertWebformCanRead();
      const acc = await accessFor();
      const metadata = bundleFor(module).metadata;
      return copy(
        acc
          ? projectMetadataForViewer(metadata, {
              hidden: acc.hiddenFields(module),
              readOnly: acc.readOnlyFields(module),
            })
          : metadata,
      );
    },
    async listViews(module) {
      assertWebformCanRead();
      const acc = await accessFor();
      const views = bundleFor(module).views;
      return copy(
        acc ? views.map((v) => projectViewForViewer(v, acc.hiddenFields(module))) : views,
      );
    },
    async getView(module, id) {
      assertWebformCanRead();
      const acc = await accessFor();
      const view = viewFor(module, id);
      return copy(acc ? projectViewForViewer(view, acc.hiddenFields(module)) : view);
    },
    async list(module, query) {
      assertWebformCanRead();
      assertCadenceCanAccess(module);
      const bundle = bundleFor(module);
      const viewAcc = await accessFor();
      const rawView = viewFor(module, query.viewId);
      const view = viewAcc ? projectViewForViewer(rawView, viewAcc.hiddenFields(module)) : rawView;
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
      (await accessFor())?.assertCriteria(module, undefined, applied);
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
                  // A requested hidden field is dropped, never echoed as null (ADR 0017 §4.5).
                  ["id", ...query.fields]
                    .filter((name) => !viewAcc?.hiddenFields(module).has(name))
                    .map((name) => [
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
      assertWebformCanRead();
      return (await matching(module, query)).length;
    },
    async summarize(module, query) {
      assertWebformCanRead();
      (await accessFor())?.assertCriteria(module, query.filters, undefined, query.groupBy);
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
      assertWebformCanRead();
      assertCadenceCanAccess(module);
      const record = recordFor(module, id);
      await assertRecordLevel(module, [id], "read");
      if (module === "Attachments" && record.fields.$state !== "ready")
        throw new NotFoundError("Record not found.");
      const resolved = resolveRead(module, record);
      const acc = await accessFor();
      return copy(acc ? acc.project(module, resolved) : resolved);
    },
    async create(module, rawInput, createOpts) {
      assertCadenceCanAccess(module);
      const input = portalActor ? portalCaseInput(module, rawInput) : rawInput;
      if (isWebformActor && options?.actor?.kind === "webform") {
        if (webformRecordsCreated > 0) {
          throw new ForbiddenError("Webform actor may only create one record", "permission_denied");
        }
        const webformActor = options.actor;
        const actorModule = webformActor.module;
        const allowedFields = webformActor.allowedFields
          ? webformActor.allowedFields instanceof Set
            ? webformActor.allowedFields
            : new Set(webformActor.allowedFields)
          : undefined;

        if (actorModule && module !== actorModule) {
          throw new ForbiddenError(
            `Webform actor cannot create records in module '${module}'`,
            "permission_denied",
          );
        }

        if (allowedFields) {
          for (const key of Object.keys(input)) {
            if (key !== "Owner" && !allowedFields.has(key)) {
              throw new ForbiddenError(
                `Webform actor cannot write extra field '${key}'`,
                "field_forbidden",
              );
            }
          }
        }

        webformRecordsCreated++;
      }
      assertModuleWritable(module);
      if (createOpts?.idempotencyKey) {
        const moduleState = moduleStore(module);
        const existingId = moduleState.idempotencyMap?.get(createOpts.idempotencyKey);
        if (existingId) {
          const existingRecord = moduleState.records.get(existingId);
          if (existingRecord) {
            const writer = await accessFor();
            return copy(writer ? writer.project(module, existingRecord) : existingRecord);
          }
        }
      }
      assertSourceTimes(createOpts?.sourceTimes);
      const bundle = bundleFor(module);
      const stringFields = stringFieldNames(bundle);
      const normalized = dropIgnored(
        bundle,
        normalizeInput(input, stringFields, bundle.metadata.fields),
      );
      validateInput(
        normalized,
        false,
        relaxRequired(bundle, normalized, createOpts),
        bundle.managedFields,
      );
      validateReferences(module, normalized);
      await validateOwner(normalized);
      const writer = await accessFor();
      writer?.assertWrite(module, normalized);
      const created = atomic({ module, mechanism: "create" }, () =>
        insertRecord(module, normalized, createOpts),
      );
      if (createOpts?.idempotencyKey) {
        const moduleState = moduleStore(module);
        moduleState.idempotencyMap ??= new Map<string, string>();
        moduleState.idempotencyMap.set(createOpts.idempotencyKey, created.id);
      }
      await publishWrite(module, "create", created, undefined, createOpts);
      return writer ? writer.project(module, created) : created;
    },
    async update(module, id, input, options) {
      assertWebformCanMutate();
      assertCadenceCanAccess(module);
      if (portalActor) assertPortalSelfEdit(module, id, input);
      assertModuleWritable(module);
      await assertRecordLevel(module, [id], "edit");
      assertSourceTimes(options?.sourceTimes);
      const bundle = bundleFor(module);
      recordFor(module, id);
      const stringFields = stringFieldNames(bundle);
      const normalized = dropIgnored(
        bundle,
        normalizeInput(input, stringFields, bundle.metadata.fields),
      );
      validateInput(
        normalized,
        true,
        relaxRequired(bundle, { ...recordFor(module, id).fields, ...normalized }, options),
        bundle.managedFields,
      );
      validateReferences(module, normalized);
      await validateOwner(normalized);
      (await accessFor())?.assertWrite(module, normalized, recordFor(module, id).fields);
      await assertUnlocked(module, [id], "update");
      const previous = copy(recordFor(module, id));
      const updatedRecord = atomic({ module, mechanism: "update" }, () => {
        // Membership resolution may yield; preserve intervening partial writes/deletes.
        const record = recordFor(module, id);
        assertWritable(record);
        const fields: Record<string, FieldValue> = {
          ...copy(record.fields),
          ...normalized,
          Modified_By: ctx.userId,
          Modified_Time: options?.sourceTimes?.modifiedTime ?? clock().toISOString(),
        };
        if (options !== undefined) {
          bundle.applyRules?.(fields, normalized, copy(record.fields), hookContext, options);
        } else {
          bundle.applyRules?.(fields, normalized, copy(record.fields), hookContext);
        }
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
      await publishWrite(module, "edit", updatedRecord, previous, options);
      const viewer = await accessFor();
      return viewer ? viewer.project(module, updatedRecord) : updatedRecord;
    },
    async massUpdate(module, ids, input) {
      assertWebformCanMutate();
      if (isCadenceActor || isJourneyActor)
        throw new ForbiddenError(
          isJourneyActor
            ? "Journey actor cannot mass update records"
            : "Cadence actor cannot mass update records",
          "permission_denied",
        );
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      const targets = [...ids];
      validateIds(targets);
      await assertRecordLevel(module, targets, "edit");
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
      const writer = await accessFor();
      if (writer && !writer.tool("massUpdate", module))
        throw new ForbiddenError(undefined, "permission_denied");
      writer?.assertWrite(module, normalized);
      await batchWithObserver(module, targets, normalized, "mass_update");
    },
    async changeOwner(module, ids, ownerId) {
      assertWebformCanMutate();
      if (isCadenceActor || isJourneyActor)
        throw new ForbiddenError(
          isJourneyActor
            ? "Journey actor cannot change record owner"
            : "Cadence actor cannot change record owner",
          "permission_denied",
        );
      assertModuleWritable(module);
      const bundle = bundleFor(module);
      const targets = [...ids];
      validateIds(targets);
      await assertRecordLevel(module, targets, "edit");
      const input = { Owner: ownerId };
      validateInput(input, true, bundle.metadata.fields, bundle.managedFields);
      await validateOwner(input);
      const writer = await accessFor();
      if (writer && !writer.tool("changeOwner", module))
        throw new ForbiddenError(undefined, "permission_denied");
      writer?.assertWrite(module, input);
      await batchWithObserver(module, targets, input, "change_owner");
    },
    async delete(module, ids) {
      assertWebformCanMutate();
      if (isCadenceActor || isJourneyActor)
        throw new ForbiddenError(
          isJourneyActor
            ? "Journey actor cannot delete records"
            : "Cadence actor cannot delete records",
          "permission_denied",
        );
      assertModuleWritable(module);
      await assertRecordLevel(module, ids, "delete");
      // Deleting more than one record at once is the mass-delete tool (ADR 0017 §3, §4.6).
      if (new Set(ids).size > 1) {
        const deleter = await accessFor();
        if (deleter && !deleter.tool("massDelete", module))
          throw new ForbiddenError(undefined, "permission_denied");
      }
      moduleExists(module);
      validateIds(ids);
      const records = [...new Set(ids)].map((id) => recordFor(module, id));
      for (const record of records) assertWritable(record, "delete");
      await assertUnlocked(module, [...new Set(ids)], "delete");
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
      await observer?.afterDelete?.({ module, ids: [...new Set(ids)] });
    },
  };
  const bound = schema ? schemaRecordService(ctx, service, schema) : service;
  return portalActor ? portalGuard(bound, portalActor.contactId) : bound;
}

const PORTAL_OPERATIONS = new Set(["portalSelect", "create", "update"]);

/**
 * The record service accepts the portal actor only for portal reads, the identity's own
 * Contact edit and Case create (ADR 0019a §4.3); every other member throws.
 */
function portalGuard<T extends object>(service: T, contactId: string): T {
  const denied = () =>
    new ForbiddenError("Portal actor cannot perform this operation", "permission_denied");
  const deniedObject = new Proxy(
    {},
    { get: (_target, prop) => (prop === "then" ? undefined : () => Promise.reject(denied())) },
  );
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value: unknown = Reflect.get(target, prop, receiver);
      if (typeof prop === "string" && PORTAL_OPERATIONS.has(prop) && typeof value === "function") {
        if (prop === "create")
          return (module: string, ...rest: unknown[]) =>
            module === "Cases" ? value.call(target, module, ...rest) : Promise.reject(denied());
        if (prop === "update")
          return (module: string, id: string, ...rest: unknown[]) =>
            module === "Contacts" && id === contactId
              ? value.call(target, module, id, ...rest)
              : Promise.reject(denied());
        return value.bind(target);
      }
      if (prop === "then") return undefined;
      if (typeof value === "function") return () => Promise.reject(denied());
      if (value && typeof value === "object") return deniedObject;
      return value;
    },
  });
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
