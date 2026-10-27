import type {
  DefinitionFamily,
  DefinitionRepository,
  DefinitionRow,
  ReportDefinition,
  ReportInput,
} from "../../core/src/definitions/types";
import type { OrgContext } from "../../core/src/tenancy/types";
import type { createTenantDatabase, OrgTransaction } from "./tenancy";

export type TenantDatabase = Awaited<ReturnType<typeof createTenantDatabase>>;
// Fixed table names are trusted metadata, never interpolated request identifiers.
const tables = new Set<DefinitionFamily>([
  "report_definitions",
  "assignment_shells",
  "organization_email_addresses",
]);
const reject = (definitionCode: "conflict" | "not_found" | "unavailable"): never => {
  throw { definitionCode };
};
function table(family: DefinitionFamily): string {
  if (!tables.has(family)) return reject("unavailable");
  return family;
}
function project(family: DefinitionFamily, r: Record<string, unknown>): DefinitionRow {
  const base = { id: String(r.id) };
  const stamp = (v: unknown) => (v as Date).toISOString();
  if (family === "organization_email_addresses")
    return {
      ...base,
      displayName: String(r.display_name),
      address: String(r.address_normalized),
      status: "unverified",
      createdBy: String(r.created_by),
      createdAt: stamp(r.created_at),
    };
  const named = {
    ...base,
    module: String(r.module),
    name: String(r.name),
    description: String(r.description),
  };
  if (family === "assignment_shells")
    return {
      ...named,
      kind: "assignment",
      revision: String(r.revision),
      enabled: false,
      entries: [],
      fallback: null,
      position: 0,
    };
  return {
    ...named,
    columns: r.columns as string[],
    criteria: r.criteria as ReportInput["criteria"],
    grouping: null,
    revision: Number(r.revision),
    createdBy: String(r.created_by),
    updatedBy: String(r.updated_by),
    createdAt: stamp(r.created_at),
    updatedAt: stamp(r.updated_at),
  };
}
/** Each mutation locks a single family row. No cross-family locks or external I/O. */
export function createPostgresDefinitionRepository(db: TenantDatabase): DefinitionRepository {
  const run = async <T>(ctx: OrgContext, work: (tx: OrgTransaction) => Promise<T>): Promise<T> => {
    try {
      return await db.withOrg(ctx, work);
    } catch (error) {
      if (error && typeof error === "object" && "definitionCode" in error) throw error;
      if (error && typeof error === "object" && "code" in error && error.code === "23505")
        reject("conflict");
      return reject("unavailable");
    }
  };
  return {
    list: (ctx, family) =>
      run(ctx, async (tx) =>
        (
          await tx.query(`select * from ${table(family)} where organization_id=$1 order by id`, [
            ctx.orgId,
          ])
        ).rows.map((r) => project(family, r)),
      ),
    get: (ctx, family, id) =>
      run(ctx, async (tx) => {
        const r = (
          await tx.query(`select * from ${table(family)} where organization_id=$1 and id=$2`, [
            ctx.orgId,
            id,
          ])
        ).rows[0];
        return r ? project(family, r) : null;
      }),
    getByIdempotencyKey: (ctx, family, key) =>
      run(ctx, async (tx) => {
        const row = (
          await tx.query(
            `select * from ${table(family)} where organization_id=$1 and idempotency_key=$2`,
            [ctx.orgId, key],
          )
        ).rows[0];
        return row ? project(family, row) : null;
      }),
    create: (ctx, family, input, key) =>
      run(ctx, async (tx) => {
        const name = table(family);
        // Read committed retry: ON CONFLICT waits for a concurrent insert; the next
        // statement receives a fresh snapshot and reads its committed original row.
        const existing = async () =>
          (
            await tx.query(
              `select * from ${name} where organization_id=$1 and idempotency_key=$2`,
              [ctx.orgId, key],
            )
          ).rows[0];
        const previous = await existing();
        if (previous) return project(family, previous);
        let columns: string;
        let values: unknown[];
        if (family === "report_definitions") {
          const r = input as ReportInput;
          columns = "name,description,module,columns,criteria,created_by,updated_by";
          values = [
            r.name,
            r.description,
            r.module,
            JSON.stringify(r.columns),
            r.criteria === null ? null : JSON.stringify(r.criteria),
            ctx.userId,
            ctx.userId,
          ];
        } else if (family === "assignment_shells") {
          const r = input as { name: string; description: string; module: string };
          columns = "name,description,module";
          values = [r.name, r.description, r.module];
        } else {
          const r = input as { displayName: string; address: string };
          columns = "display_name,address_normalized,created_by";
          values = [r.displayName, r.address, ctx.userId];
        }
        const parameters = values.map((_, i) => `$${i + 3}`).join(",");
        const result = await tx.query(
          `insert into ${name} (organization_id,idempotency_key,${columns}) values ($1,$2,${parameters}) on conflict (organization_id,idempotency_key) do nothing returning *`,
          [ctx.orgId, key, ...values],
        );
        const row = result.rows[0] ?? (await existing());
        return row ? project(family, row) : reject("unavailable");
      }),
    updateReport: (ctx, input, revision) =>
      run(ctx, async (tx) => {
        const result = await tx.query(
          `update report_definitions set name=$4,description=$5,module=$6,columns=$7,criteria=$8,updated_by=$9,updated_at=now(),revision=revision+1 where organization_id=$1 and id=$2 and revision=$3 returning *`,
          [
            ctx.orgId,
            input.id,
            revision,
            input.name,
            input.description,
            input.module,
            JSON.stringify(input.columns),
            input.criteria === null ? null : JSON.stringify(input.criteria),
            ctx.userId,
          ],
        );
        if (result.rows[0])
          return project("report_definitions", result.rows[0]) as ReportDefinition;
        const exists = await tx.query(
          "select id from report_definitions where organization_id=$1 and id=$2",
          [ctx.orgId, input.id],
        );
        return reject(exists.rowCount ? "conflict" : "not_found");
      }),
  };
}
