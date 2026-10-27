import { randomUUID } from "node:crypto";
import type { AssignmentRule } from "../automation/types";
import type {
  DefinitionFamily,
  DefinitionRepository,
  DefinitionRow,
  OrganizationAddress,
  ReportDefinition,
  ReportInput,
} from "./types";

/** Unit-test twin only. Never compose this repository into a product store. */
export function createMemoryDefinitionRepository(): DefinitionRepository {
  const rows = new Map<string, DefinitionRow>();
  const keys = new Map<string, string>();
  const names = new Map<string, string>();
  const scope = (org: string, family: DefinitionFamily, id: string) =>
    JSON.stringify([org, family, id]);
  const natural = (input: Parameters<DefinitionRepository["create"]>[2]) =>
    "address" in input ? input.address : `${input.module}:${input.name.toLowerCase()}`;
  const reject = (definitionCode: "conflict" | "not_found"): never => {
    throw { definitionCode };
  };
  return {
    async list(ctx, family) {
      return structuredClone(
        [...rows.entries()]
          .filter(([k]) => {
            const [org, f] = JSON.parse(k);
            return org === ctx.orgId && f === family;
          })
          .map(([, r]) => r)
          .sort((a, b) => a.id.localeCompare(b.id)),
      );
    },
    async get(ctx, family, id) {
      return structuredClone(rows.get(scope(ctx.orgId, family, id)) ?? null);
    },
    async getByIdempotencyKey(ctx, family, key) {
      const k = keys.get(scope(ctx.orgId, family, key));
      return k ? structuredClone(rows.get(k) ?? null) : null;
    },
    async create(ctx, family, input, key) {
      const old = keys.get(scope(ctx.orgId, family, key));
      if (old) return structuredClone(rows.get(old) as DefinitionRow);
      const n = scope(ctx.orgId, family, natural(input));
      if (names.has(n)) return reject("conflict");
      const id = randomUUID();
      const now = new Date().toISOString();
      let row: DefinitionRow;
      if (family === "report_definitions")
        row = {
          ...(input as ReportInput),
          id,
          revision: 1,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
          createdAt: now,
          updatedAt: now,
        };
      else if (family === "assignment_shells")
        row = {
          ...(input as Pick<AssignmentRule, "module" | "name" | "description">),
          id,
          revision: "1",
          enabled: false,
          entries: [],
          fallback: null,
          kind: "assignment",
          position: 0,
        };
      else
        row = {
          ...(input as Pick<OrganizationAddress, "displayName" | "address">),
          id,
          status: "unverified",
          createdBy: ctx.userId,
          createdAt: now,
        };
      const k = scope(ctx.orgId, family, id);
      rows.set(k, structuredClone(row));
      keys.set(scope(ctx.orgId, family, key), k);
      names.set(n, k);
      return structuredClone(row);
    },
    async updateReport(ctx, input, revision) {
      const k = scope(ctx.orgId, "report_definitions", input.id);
      const old = rows.get(k) as ReportDefinition | undefined;
      if (!old) return reject("not_found");
      if (old.revision !== revision) return reject("conflict");
      const n = scope(ctx.orgId, "report_definitions", natural(input));
      if (names.has(n) && names.get(n) !== k) return reject("conflict");
      names.delete(scope(ctx.orgId, "report_definitions", natural(old)));
      names.set(n, k);
      const row = {
        ...old,
        ...input,
        revision: revision + 1,
        updatedBy: ctx.userId,
        updatedAt: new Date().toISOString(),
      };
      rows.set(k, structuredClone(row));
      return structuredClone(row);
    },
  };
}
