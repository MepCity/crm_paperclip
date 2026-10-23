import type { OrgContext } from "../tenancy/types";
import type { AutomationPort, AutomationRule, ReadFailure, ReadResult, RuleSummary } from "./types";

export const MAX_AUTOMATION_PAGE_LIMIT = 100;

export type MemoryAutomationOptions = {
  /** Synthetic fixtures per organization id. Missing organization = empty. */
  fixtures?: Readonly<Record<string, readonly AutomationRule[]>>;
  /** Rules whose detail cannot be safely projected are withheld entirely. */
  withheld?: ReadonlySet<string>;
  /** Test hook: force an outcome for every read. */
  inject?: (op: "list" | "get") => ReadFailure | null;
};

const fail = <T>(code: ReadFailure["code"]): ReadResult<T> => ({ ok: false, error: { code } });
const clone = <T>(value: T): T => structuredClone(value);

const summarize = (r: AutomationRule): RuleSummary => ({
  id: r.id,
  revision: r.revision,
  module: r.module,
  name: r.name,
  description: r.description,
  enabled: r.enabled,
  position: r.position,
  kind: r.kind,
});

const encode = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const decode = (s: string): Record<string, unknown> | null => {
  try {
    const v = JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

/** In-memory read-only adapter. Never mutates state; default fixture is empty. */
export function createMemoryAutomationPort(options: MemoryAutomationOptions = {}): AutomationPort {
  const store = new Map<string, readonly AutomationRule[]>(
    Object.entries(options.fixtures ?? {}).map(([org, rules]) => [org, clone([...rules])]),
  );
  const visible = (ctx: OrgContext, kind: AutomationRule["kind"]) =>
    (store.get(ctx.orgId) ?? []).filter((r) => r.kind === kind && !options.withheld?.has(r.id));

  return {
    async list(ctx, query) {
      const injected = options.inject?.("list");
      if (injected) return { ok: false, error: injected };
      if (ctx.role !== "admin") return fail("forbidden");
      if (
        !Number.isInteger(query.limit) ||
        query.limit < 1 ||
        query.limit > MAX_AUTOMATION_PAGE_LIMIT
      ) {
        return fail("invalid_query");
      }
      const scope = { o: ctx.orgId, u: ctx.userId, k: query.kind, m: query.module ?? null };
      let offset = 0;
      if (query.cursor !== undefined) {
        const c = decode(query.cursor);
        if (
          !c ||
          c.o !== scope.o ||
          c.u !== scope.u ||
          c.k !== scope.k ||
          c.m !== scope.m ||
          !Number.isInteger(c.n) ||
          (c.n as number) < 0
        ) {
          return fail("invalid_query");
        }
        offset = c.n as number;
      }
      const all = visible(ctx, query.kind)
        .filter((r) => query.module === undefined || r.module === query.module)
        .sort((a, b) => a.position - b.position || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const items = all.slice(offset, offset + query.limit).map(summarize);
      const next = offset + query.limit;
      return {
        ok: true,
        value: { items, nextCursor: next < all.length ? encode({ ...scope, n: next }) : null },
      };
    },
    async get(ctx, query) {
      const injected = options.inject?.("get");
      if (injected) return { ok: false, error: injected };
      if (ctx.role !== "admin") return fail("forbidden");
      const rule = visible(ctx, query.kind).find((r) => r.id === query.id);
      return rule ? { ok: true, value: clone(rule) } : fail("not_found");
    },
  };
}
