import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import type { InMemorySchemaCoordinator } from "../customization/coordinator";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RecordLockedError,
  ValidationError,
} from "../errors";
import type { Criteria, PortalActorRef, RecordInput, SortSpec } from "../records/contract";
import { createFixtureRecordService } from "../records/fixture";
import { fixtureModules } from "../records/fixture/registry";
import {
  PORTAL_MAX_PER_PAGE,
  type PortalPredicate,
  type PortalSelectQuery,
  type PortalSelectResult,
  type PortalSelectRow,
} from "../records/portal-select";
import type { RecordWriteObserver } from "../records/write-observer";
import { systemOrgContext, withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import type { PortalPrincipal } from "./auth/service";
import {
  isPortalExposable,
  moduleFields,
  PORTAL_MODULE_RULES,
  PORTAL_MODULES,
  type PortalModule,
  type PortalModuleConfig,
  type PortalModules,
  type PortalUserTypeSettings,
  portalModulesSchema,
  portalServerSetFields,
  portalUserTypeSettingsSchema,
} from "./matrix";

/**
 * Portal data access (ADR 0019a §3–§4). Every read and write goes through the portal query
 * builder below and the record service's portal actor. One body for every "not found":
 * missing id, other organisation, failed proof, recycle bin, module not enabled (§4.4).
 * The portal data API never answers 403.
 */
export const PORTAL_NOT_FOUND_BODY = Object.freeze({ message: "Not found." });

export type PortalDataFailure =
  | { ok: false; status: 404; body: typeof PORTAL_NOT_FOUND_BODY }
  | {
      ok: false;
      status: 422;
      body: { message: string; errors: Record<string, readonly string[]> };
    };

export type PortalDataResult<T> = { ok: true; status: 200 | 201; data: T } | PortalDataFailure;

export interface PortalListParams {
  page?: string | null;
  perPage?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
  search?: string | null;
  /** JSON-encoded criteria over projected fields. */
  filters?: string | null;
}

export interface PortalListPage {
  data: readonly PortalSelectRow[];
  info: {
    page: number;
    per_page: number;
    more_records: boolean;
    sort_by: string;
    sort_order: "asc" | "desc";
  };
}

export interface PortalRecordBody {
  data: PortalSelectRow;
}

export interface PortalDataDeps {
  /** Automation and approval observers (ADR 0013), the same chain member writes use. */
  writeObserver?: (ctx: OrgContext) => RecordWriteObserver | undefined;
  schema?: InMemorySchemaCoordinator;
  now?: () => Date;
}

/** Principal fields the data layer reads; the session (Portals A) supplies them. */
export type PortalDataPrincipal = Pick<
  PortalPrincipal,
  "orgId" | "portalId" | "identityId" | "userTypeId" | "displayName" | "recordId"
>;

/** Related lists: the child lookup that points at a portal parent record (§3 lookups only). */
const RELATED_FIELDS: Partial<Record<PortalModule, Partial<Record<PortalModule, string>>>> = {
  Accounts: {
    Contacts: "Account_Name",
    Deals: "Account_Name",
    Cases: "Account_Name",
    Quotes: "Account_Name",
    Invoices: "Account_Name",
  },
  Contacts: {
    Deals: "Contact_Name",
    Cases: "Related_To",
    Quotes: "Contact_Name",
    Invoices: "Contact_Name",
  },
};

const DEFAULT_PER_PAGE = 20;
const NOT_FOUND = { ok: false, status: 404, body: PORTAL_NOT_FOUND_BODY } as const;

function invalid(errors: Record<string, readonly string[]>): PortalDataFailure {
  return { ok: false, status: 422, body: { message: "Check the highlighted fields.", errors } };
}

class PortalInvalid extends Error {
  constructor(readonly errors: Record<string, readonly string[]>) {
    super("invalid portal request");
  }
}

function isPortalModule(module: string): module is PortalModule {
  return (PORTAL_MODULES as readonly string[]).includes(module);
}

/** The §3 relationship proof of one module in the user type's scope. */
export function portalProof(module: PortalModule, config: PortalModuleConfig): PortalPredicate {
  const rule = PORTAL_MODULE_RULES[module];
  const terms: PortalPredicate[] = [];
  if (rule.contactLookup) terms.push({ op: "eq", field: rule.contactLookup, ref: "contact" });
  if (module === "Accounts") terms.push({ op: "eq", field: "id", ref: "contactAccount" });
  else if (config.scope === "account" && rule.accountLookup)
    terms.push({ op: "eq", field: rule.accountLookup, ref: "contactAccount" });
  const [only] = terms;
  if (terms.length === 1 && only) return only;
  return { op: "or", terms };
}

/** Projected columns that still exist and may be exposed (re-checked at query time). */
export function portalColumns(module: PortalModule, config: PortalModuleConfig): string[] {
  const defs = new Map(moduleFields(module).map((field) => [field.apiName, field]));
  return config.fields.flatMap((field) => {
    const def = defs.get(field.apiName);
    return def && isPortalExposable(def) ? [field.apiName] : [];
  });
}

function editableColumns(module: PortalModule, config: PortalModuleConfig): Set<string> {
  const columns = new Set(portalColumns(module, config));
  const serverSet = new Set(portalServerSetFields(module));
  return new Set(
    config.fields
      .filter((f) => f.mode === "edit" && columns.has(f.apiName) && !serverSet.has(f.apiName))
      .map((f) => f.apiName),
  );
}

function criteriaFields(criteria: Criteria, out: string[] = []): string[] {
  if ("group" in criteria) for (const item of criteria.group) criteriaFields(item, out);
  else out.push(criteria.field);
  return out;
}

function positiveInt(value: string | null | undefined, fallback: number, key: string): number {
  if (value === null || value === undefined || value === "") return fallback;
  if (!/^\d{1,6}$/.test(value)) throw new PortalInvalid({ [key]: ["Choose a positive integer."] });
  const parsed = Number(value);
  if (parsed < 1) throw new PortalInvalid({ [key]: ["Choose a positive integer."] });
  return parsed;
}

interface UserTypeView {
  modules: PortalModules;
  settings: PortalUserTypeSettings;
  portalCreator: string;
}

/** Query builder: list parameters → a proof-carrying `PortalSelectQuery` (§4.2). */
export function buildPortalListQuery(
  module: PortalModule,
  modules: PortalModules,
  params: PortalListParams,
  parent?: PortalSelectQuery["parent"],
): PortalSelectQuery {
  const config = modules[module];
  if (!config) throw new NotFoundError("Not found.");
  const columns = portalColumns(module, config);
  const projected = new Set(columns);
  const page = positiveInt(params.page, 1, "page");
  const perPage = positiveInt(params.perPage, DEFAULT_PER_PAGE, "per_page");
  if (perPage > PORTAL_MAX_PER_PAGE)
    throw new PortalInvalid({ per_page: [`Choose at most ${PORTAL_MAX_PER_PAGE} records.`] });
  const sortField = params.sortBy || "id";
  if (sortField !== "id" && !projected.has(sortField))
    throw new PortalInvalid({ sort_by: [`Field "${sortField}" is not available.`] });
  const order = params.sortOrder || "desc";
  if (order !== "asc" && order !== "desc")
    throw new PortalInvalid({ sort_order: ["Choose asc or desc."] });
  const sort: SortSpec = { field: sortField, order };
  let filters: Criteria | undefined;
  if (params.filters) {
    try {
      filters = JSON.parse(params.filters) as Criteria;
    } catch {
      throw new PortalInvalid({ filters: ["Invalid filter."] });
    }
    if (!filters || typeof filters !== "object" || Array.isArray(filters))
      throw new PortalInvalid({ filters: ["Invalid filter."] });
    for (const field of criteriaFields(filters))
      if (!projected.has(field))
        throw new PortalInvalid({ filters: [`Field "${field}" is not available.`] });
  }
  let search: PortalSelectQuery["search"];
  const text = params.search?.trim();
  if (text) {
    const bundle = fixtureModules[module];
    const candidates = [...(bundle?.searchFields ?? []), bundle?.displayNameField ?? ""];
    const fields = [...new Set(candidates.filter((name) => projected.has(name)))];
    if (!fields.length) throw new PortalInvalid({ search: ["Search is not available."] });
    search = { text, fields };
  }
  return {
    module,
    proof: portalProof(module, config),
    ...(parent ? { parent } : {}),
    columns,
    ...(filters ? { filters } : {}),
    ...(search ? { search } : {}),
    sort,
    page,
    perPage,
    linkProofs: linkProofs(modules),
  };
}

function linkProofs(modules: PortalModules): Partial<Record<string, PortalPredicate>> {
  return Object.fromEntries(
    PORTAL_MODULES.flatMap((module) => {
      const config = modules[module];
      return config?.enabled && config.actions.view ? [[module, portalProof(module, config)]] : [];
    }),
  );
}

export function buildPortalRecordQuery(
  module: PortalModule,
  modules: PortalModules,
  id: string,
): PortalSelectQuery {
  const config = modules[module];
  if (!config) throw new NotFoundError("Not found.");
  return {
    module,
    proof: portalProof(module, config),
    id,
    columns: portalColumns(module, config),
    sort: { field: "id", order: "desc" },
    page: 1,
    perPage: 1,
    linkProofs: linkProofs(modules),
  };
}

export function createPortalDataService(deps: PortalDataDeps = {}) {
  const loadUserType = async (principal: PortalDataPrincipal): Promise<UserTypeView | null> =>
    withOrg(systemOrgContext(principal.orgId), async (tx) => {
      const [row] = await tx
        .select({
          modules: schema.portalUserTypes.modules,
          settings: schema.portalUserTypes.settings,
          creator: schema.portals.createdBy,
        })
        .from(schema.portalUserTypes)
        .innerJoin(
          schema.portals,
          and(
            eq(schema.portals.organizationId, schema.portalUserTypes.organizationId),
            eq(schema.portals.id, schema.portalUserTypes.portalId),
          ),
        )
        .where(
          and(
            eq(schema.portalUserTypes.organizationId, principal.orgId),
            eq(schema.portalUserTypes.portalId, principal.portalId),
            eq(schema.portalUserTypes.id, principal.userTypeId),
          ),
        );
      if (!row) return null;
      const modules = portalModulesSchema.safeParse(row.modules);
      const settings = portalUserTypeSettingsSchema.safeParse(row.settings);
      return {
        modules: modules.success ? (modules.data as PortalModules) : {},
        settings: settings.success ? settings.data : { caseOwner: null },
        portalCreator: row.creator,
      };
    });

  const listMemberIds = (orgId: string) => async (): Promise<readonly string[]> =>
    withOrg(systemOrgContext(orgId), async (tx) =>
      (
        await tx
          .select({ userId: schema.memberships.userId })
          .from(schema.memberships)
          .where(eq(schema.memberships.organizationId, orgId))
      ).map((row) => row.userId),
    );

  const recordsFor = (principal: PortalDataPrincipal, view: UserTypeView) => {
    const actor: PortalActorRef = {
      kind: "portal",
      identityId: principal.identityId,
      userTypeId: principal.userTypeId,
      contactId: principal.recordId,
      editableFields: {
        ...(view.modules.Contacts?.enabled && view.modules.Contacts.actions.edit
          ? { Contacts: [...editableColumns("Contacts", view.modules.Contacts)] }
          : {}),
        ...(view.modules.Cases?.enabled && view.modules.Cases.actions.create
          ? { Cases: [...editableColumns("Cases", view.modules.Cases)] }
          : {}),
      },
    };
    // Writes are stamped with the portal creator as the member of record; history and the
    // actor kind name the portal identity (§4.3).
    const ctx: OrgContext = {
      orgId: principal.orgId,
      userId: view.portalCreator,
      orgSlug: "",
      orgName: "",
      role: "member",
    };
    return createFixtureRecordService(ctx, {
      actor,
      actorName: principal.displayName || "Portal user",
      listMemberIds: listMemberIds(principal.orgId),
      ...(deps.schema ? { schema: deps.schema } : {}),
      ...(deps.now ? { now: deps.now } : {}),
      writeObserver: deps.writeObserver?.(ctx),
    });
  };

  /** Runs one portal operation; every failure becomes the §4.4 404 or a 422. */
  const run = async <T>(
    principal: PortalDataPrincipal,
    module: string,
    work: (
      view: UserTypeView,
      config: PortalModuleConfig,
      module: PortalModule,
    ) => Promise<{ status: 200 | 201; data: T }>,
  ): Promise<PortalDataResult<T>> => {
    if (!isPortalModule(module)) return NOT_FOUND;
    const view = await loadUserType(principal);
    const config = view?.modules[module];
    if (!view || !config?.enabled || !config.actions.view) return NOT_FOUND;
    try {
      const { status, data } = await work(view, config, module);
      return { ok: true, status, data };
    } catch (error) {
      if (error instanceof PortalInvalid) return invalid(error.errors);
      if (error instanceof ValidationError) return invalid(error.fieldErrors);
      // Own-record write refusals (approval lock, unique value) stay inside the 422 family.
      if (error instanceof RecordLockedError || error instanceof ConflictError)
        return invalid({ record: [error.message] });
      // A refused operation never becomes a 403 (existence must not leak).
      if (error instanceof NotFoundError || error instanceof ForbiddenError) return NOT_FOUND;
      throw error;
    }
  };

  const one = (
    records: ReturnType<typeof recordsFor>,
    view: UserTypeView,
    module: PortalModule,
    id: string,
  ): PortalSelectRow => {
    const [row] = records.portalSelect(buildPortalRecordQuery(module, view.modules, id)).records;
    if (!row) throw new NotFoundError("Not found.");
    return row;
  };

  const page = (result: PortalSelectResult, sort: SortSpec): PortalListPage => ({
    data: result.records,
    info: {
      page: result.page,
      per_page: result.perPage,
      more_records: result.moreRecords,
      sort_by: sort.field,
      sort_order: sort.order,
    },
  });

  const assertKeys = (
    input: Record<string, unknown>,
    editable: ReadonlySet<string>,
    serverSet: readonly string[],
  ) => {
    const errors: Record<string, string[]> = {};
    for (const key of Object.keys(input)) {
      if (serverSet.includes(key)) errors[key] = ["This field is set by the portal."];
      else if (!editable.has(key)) errors[key] = ["This field cannot be edited."];
    }
    if (Object.keys(errors).length) throw new PortalInvalid(errors);
  };

  const caseOwner = async (principal: PortalDataPrincipal, view: UserTypeView) => {
    const members = await listMemberIds(principal.orgId)();
    const owner = view.settings.caseOwner;
    // ADR 0013 assignment rules are not resolvable from a portal request yet: fallback.
    if (owner?.kind === "user" && members.includes(owner.userId)) return owner.userId;
    return view.portalCreator;
  };

  return {
    async list(
      principal: PortalDataPrincipal,
      module: string,
      params: PortalListParams,
    ): Promise<PortalDataResult<PortalListPage>> {
      return run(principal, module, async (view, _config, m) => {
        const query = buildPortalListQuery(m, view.modules, params);
        return {
          status: 200,
          data: page(recordsFor(principal, view).portalSelect(query), query.sort),
        };
      });
    },

    async get(
      principal: PortalDataPrincipal,
      module: string,
      id: string,
    ): Promise<PortalDataResult<PortalRecordBody>> {
      return run(principal, module, async (view, _config, m) => ({
        status: 200,
        data: { data: one(recordsFor(principal, view), view, m, id) },
      }));
    },

    /**
     * Related list of a portal record: the parent is proved by its own query first, then the
     * child list runs with the CHILD's proof plus the parent pointer; the parent's proof is
     * never inherited (§3).
     */
    async related(
      principal: PortalDataPrincipal,
      module: string,
      id: string,
      childModule: string,
      params: PortalListParams,
    ): Promise<PortalDataResult<PortalListPage>> {
      return run(principal, module, async (view, _config, m) => {
        const records = recordsFor(principal, view);
        one(records, view, m, id);
        const field = isPortalModule(childModule) ? RELATED_FIELDS[m]?.[childModule] : undefined;
        const child = isPortalModule(childModule) ? view.modules[childModule] : undefined;
        if (!field || !child?.enabled || !child.actions.view || !isPortalModule(childModule))
          throw new NotFoundError("Not found.");
        const query = buildPortalListQuery(childModule, view.modules, params, {
          field,
          module: m,
          id,
        });
        return { status: 200, data: page(records.portalSelect(query), query.sort) };
      });
    },

    /** Case create (§4.3): projected `edit` keys only; relationship and owner server-side. */
    async create(
      principal: PortalDataPrincipal,
      module: string,
      input: Record<string, unknown>,
    ): Promise<PortalDataResult<PortalRecordBody>> {
      return run(principal, module, async (view, config, m) => {
        if (m !== "Cases" || !config.actions.create) throw new NotFoundError("Not found.");
        assertKeys(input, editableColumns(m, config), portalServerSetFields(m));
        const records = recordsFor(principal, view);
        const created = await records.create(m, {
          ...(input as RecordInput),
          Owner: await caseOwner(principal, view),
        });
        return { status: 201, data: { data: one(records, view, m, created.id) } };
      });
    },

    /** Contacts self-edit (§4.3): the identity's own Contact, projected `edit` keys only. */
    async update(
      principal: PortalDataPrincipal,
      module: string,
      id: string,
      input: Record<string, unknown>,
    ): Promise<PortalDataResult<PortalRecordBody>> {
      return run(principal, module, async (view, config, m) => {
        const records = recordsFor(principal, view);
        // Proof first, from the same query path as reads: other ids are plain 404s.
        one(records, view, m, id);
        if (m !== "Contacts" || !config.actions.edit || id !== principal.recordId)
          throw new NotFoundError("Not found.");
        assertKeys(input, editableColumns(m, config), []);
        await records.update(m, id, input as RecordInput);
        return { status: 200, data: { data: one(records, view, m, id) } };
      });
    },
  };
}

export type PortalDataService = ReturnType<typeof createPortalDataService>;
