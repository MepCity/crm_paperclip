import { z } from "zod";
import type { AssignmentRule, ReadResult } from "../automation/types";
import type { FieldDefinition } from "../records/contract";
import type { OrgContext } from "../tenancy/types";
import type {
  AssignmentDefinitionPort,
  DefinitionCode,
  DefinitionDependencies,
  DefinitionResult,
  OrganizationAddress,
  OrganizationAddressPort,
  ReportDefinition,
  ReportDefinitionPort,
} from "./types";

const text = z.string().trim().min(1).max(255);
const shell = z.object({ module: text, name: text, description: z.string().max(4000) }).strict();
const report = shell
  .extend({
    columns: z.array(text).min(1).max(100),
    criteria: z.json().nullable(),
    grouping: z.null(),
  })
  .strict();
const address = z
  .object({
    displayName: text,
    address: z
      .email()
      .max(320)
      .transform((v) => v.toLowerCase()),
  })
  .strict();
const key = z.string().min(1).max(200);
const uuid = z.uuid();
const fail = <T>(code: DefinitionCode): DefinitionResult<T> => ({ ok: false, error: { code } });
function reject(code: DefinitionCode): never {
  throw { definitionCode: code };
}
async function safe<T>(work: () => Promise<T>): Promise<DefinitionResult<T>> {
  try {
    return { ok: true, value: await work() };
  } catch (error) {
    const code =
      error && typeof error === "object" && "definitionCode" in error
        ? error.definitionCode
        : "unavailable";
    return fail(
      (["validation", "forbidden", "not_found", "conflict"] as unknown[]).includes(code)
        ? (code as DefinitionCode)
        : "unavailable",
    );
  }
}
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  return result.success ? result.data : reject("validation");
}
/** Bounded scalar criteria subset. Reject unsupported operators and malformed typed values. */
function criteria(value: unknown, fields: ReadonlyMap<string, FieldDefinition>, depth = 0): void {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 10)
    reject("validation");
  const v = value as Record<string, unknown>;
  if ("group" in v) {
    if (
      Object.keys(v).some((k) => !["group", "groupOperator"].includes(k)) ||
      !["and", "or"].includes(v.groupOperator as string) ||
      !Array.isArray(v.group) ||
      !v.group.length ||
      v.group.length > 100
    )
      reject("validation");
    for (const child of v.group as unknown[]) criteria(child, fields, depth + 1);
    return;
  }
  if (Object.keys(v).some((k) => !["field", "comparator", "value"].includes(k)))
    reject("validation");
  const field = fields.get(String(v.field));
  if (
    !field ||
    ![
      "equal",
      "not_equal",
      "contains",
      "starts_with",
      "ends_with",
      "greater_than",
      "less_than",
      "is_empty",
      "is_not_empty",
    ].includes(String(v.comparator))
  )
    reject("validation");
  if (["is_empty", "is_not_empty"].includes(String(v.comparator))) {
    if (v.value !== null) reject("validation");
    return;
  }
  const numeric = ["integer", "currency", "double"].includes(field.dataType);
  if (["greater_than", "less_than"].includes(String(v.comparator)) && !numeric)
    reject("validation");
  if (
    ["contains", "starts_with", "ends_with"].includes(String(v.comparator)) &&
    !["text", "textarea", "email", "phone", "website"].includes(field.dataType)
  )
    reject("validation");
  if (numeric) {
    if (
      typeof v.value !== "number" ||
      !Number.isFinite(v.value) ||
      (field.dataType === "integer" && !Number.isInteger(v.value))
    )
      reject("validation");
  } else if (field.dataType === "boolean") {
    if (typeof v.value !== "boolean") reject("validation");
  } else if (
    [
      "text",
      "textarea",
      "email",
      "phone",
      "website",
      "picklist",
      "date",
      "datetime",
      "bigint",
    ].includes(field.dataType)
  ) {
    if (typeof v.value !== "string" || v.value.length > 4000) reject("validation");
    if (field.dataType === "picklist" && !field.picklist?.some((p) => p.storedValue === v.value))
      reject("validation");
    if (
      field.dataType === "date" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(v.value as string) ||
        !Number.isFinite(Date.parse(v.value as string)) ||
        new Date(v.value as string).toISOString().slice(0, 10) !== v.value)
    )
      reject("validation");
    if (
      field.dataType === "datetime" &&
      (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v.value as string) ||
        !Number.isFinite(Date.parse(v.value as string)))
    )
      reject("validation");
    if (field.dataType === "bigint" && !/^-?\d+$/.test(v.value as string)) reject("validation");
  } else reject("validation");
}

export function createDefinitionPorts(deps: DefinitionDependencies): {
  reports: ReportDefinitionPort;
  automation: AssignmentDefinitionPort;
  organizationAddresses: OrganizationAddressPort;
} {
  const { repository: repo } = deps;
  const admin = (ctx: OrgContext) => {
    if (ctx.role !== "admin") reject("forbidden");
  };
  const writer = async (ctx: OrgContext) => {
    if (ctx.role !== "admin" && !(await deps.canManageReports(ctx))) reject("forbidden");
  };
  const validateModule = async (ctx: OrgContext, module: string) => {
    try {
      return await deps.customization.readEffective(ctx.orgId, module);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "not_found")
        reject("validation");
      throw error;
    }
  };
  const validateReport = async (ctx: OrgContext, raw: unknown) => {
    const input = parse(report, raw);
    const metadata = await validateModule(ctx, input.module);
    const fields = new Map(
      metadata.fields.filter((f) => f.lifecycle === "active").map((f) => [f.apiName, f]),
    );
    if (
      new Set(input.columns).size !== input.columns.length ||
      input.columns.some((c) => !fields.has(c))
    )
      reject("validation");
    if (input.criteria !== null) criteria(input.criteria, fields);
    return input as Parameters<ReportDefinitionPort["create"]>[1];
  };
  const reports: ReportDefinitionPort = {
    list: (ctx) =>
      safe(async () => {
        return (await repo.list(ctx, "report_definitions")) as ReportDefinition[];
      }),
    get: (ctx, id) =>
      safe(async () => {
        if (!uuid.safeParse(id).success) reject("not_found");
        return (
          ((await repo.get(ctx, "report_definitions", id)) as ReportDefinition) ??
          reject("not_found")
        );
      }),
    create: (ctx, input, options) =>
      safe(async () => {
        await writer(ctx);
        const k = parse(key, options?.idempotencyKey);
        const previous = await repo.getByIdempotencyKey(ctx, "report_definitions", k);
        if (previous) return previous as ReportDefinition;
        const data = await validateReport(ctx, input);
        return (await repo.create(ctx, "report_definitions", data, k)) as ReportDefinition;
      }),
    update: (ctx, input, options) =>
      safe(async () => {
        await writer(ctx);
        const { id, ...raw } = input;
        if (!uuid.safeParse(id).success) reject("not_found");
        const revision = parse(z.number().int().positive(), options?.expectedRevision);
        if (!(await repo.get(ctx, "report_definitions", id))) reject("not_found");
        return repo.updateReport(ctx, { ...(await validateReport(ctx, raw)), id }, revision);
      }),
  };
  const organizationAddresses: OrganizationAddressPort = {
    list: (ctx) =>
      safe(async () => {
        admin(ctx);
        return (await repo.list(ctx, "organization_email_addresses")) as OrganizationAddress[];
      }),
    add: (ctx, input, options) =>
      safe(async () => {
        admin(ctx);
        const k = parse(key, options?.idempotencyKey);
        const previous = await repo.getByIdempotencyKey(ctx, "organization_email_addresses", k);
        if (previous) return previous as OrganizationAddress;
        return (await repo.create(
          ctx,
          "organization_email_addresses",
          parse(address, input),
          k,
        )) as OrganizationAddress;
      }),
  };
  const automation: AssignmentDefinitionPort = {
    createAssignmentShell: (ctx, input, options) =>
      safe(async () => {
        admin(ctx);
        const k = parse(key, options?.idempotencyKey);
        const previous = await repo.getByIdempotencyKey(ctx, "assignment_shells", k);
        if (previous) return previous as AssignmentRule;
        const data = parse(shell, input);
        await validateModule(ctx, data.module);
        return (await repo.create(ctx, "assignment_shells", data, k)) as AssignmentRule;
      }),
    async list(ctx, query) {
      if (ctx.role !== "admin") return { ok: false, error: { code: "forbidden" } };
      if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100)
        return { ok: false, error: { code: "invalid_query" } };
      let after = "";
      if (query.cursor !== undefined) {
        try {
          const cursor = JSON.parse(Buffer.from(query.cursor, "base64url").toString("utf8"));
          if (
            cursor.org !== ctx.orgId ||
            cursor.user !== ctx.userId ||
            cursor.module !== (query.module ?? null) ||
            cursor.kind !== query.kind ||
            typeof cursor.after !== "string" ||
            !uuid.safeParse(cursor.after).success
          )
            throw new Error();
          after = cursor.after;
        } catch {
          return { ok: false, error: { code: "invalid_query" } };
        }
      }
      const result = await safe(async () => {
        const rows =
          query.kind === "assignment"
            ? ((await repo.list(ctx, "assignment_shells")) as AssignmentRule[])
            : [];
        const matching = rows
          .filter((r) => (!query.module || r.module === query.module) && r.id > after)
          .sort((a, b) => a.id.localeCompare(b.id));
        const items = matching.slice(0, query.limit);
        const nextCursor =
          matching.length > query.limit
            ? Buffer.from(
                JSON.stringify({
                  org: ctx.orgId,
                  user: ctx.userId,
                  module: query.module ?? null,
                  kind: query.kind,
                  after: items.at(-1)?.id,
                }),
              ).toString("base64url")
            : null;
        return { items, nextCursor };
      });
      return result.ok ? result : { ok: false, error: { code: "unavailable" } };
    },
    async get(ctx, query): Promise<ReadResult<AssignmentRule>> {
      if (ctx.role !== "admin") return { ok: false, error: { code: "forbidden" } };
      if (query.kind !== "assignment" || !uuid.safeParse(query.id).success)
        return { ok: false, error: { code: "not_found" } };
      const result = await safe(
        async () =>
          ((await repo.get(ctx, "assignment_shells", query.id)) as AssignmentRule) ??
          reject("not_found"),
      );
      return result.ok
        ? result
        : {
            ok: false,
            error: { code: result.error.code === "not_found" ? "not_found" : "unavailable" },
          };
    },
  };
  return { reports, automation, organizationAddresses };
}
