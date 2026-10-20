import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type { FieldValue } from "../contract";
import type { HistoryChange, RecordHistoryEvent, RecordHistoryService } from "../history";
import type { RecordHistoryStore } from "../history-store";

export interface FixtureHistoryPermissions {
  canReadRecord?: (module: string, recordId: string) => boolean;
  canReadField?: (module: string, apiName: string) => boolean;
}
interface Cursor {
  scope: string;
  highWater: number;
  after: Pick<RecordHistoryEvent, "sequence" | "ordinal" | "id">;
  expires: number;
}

export function fixtureHistoryReader(
  ctx: OrgContext,
  store: () => RecordHistoryStore,
  sequence: () => number,
  assertRecord: (module: string, id: string) => void,
  knownModule: (module: string) => boolean,
  permissions: FixtureHistoryPermissions,
  cursors: Map<string, Cursor>,
  projectChild?: (
    event: RecordHistoryEvent,
  ) => { name?: string; payload: RecordHistoryEvent["payload"] } | null,
): RecordHistoryService {
  const invalid = () => new ValidationError({ history: ["Invalid history query or page token."] });
  const canRead = (module: string, id: string) => {
    try {
      assertRecord(module, id);
      return permissions.canReadRecord?.(module, id) ?? true;
    } catch {
      return false;
    }
  };
  const visibleValue = (value: FieldValue): boolean => {
    if (!value || typeof value !== "object") return true;
    if (
      "module" in value &&
      "id" in value &&
      typeof value.module === "string" &&
      typeof value.id === "string"
    )
      return canRead(value.module, value.id);
    return true;
  };
  const visibleChange = (event: RecordHistoryEvent, change: HistoryChange) =>
    (permissions.canReadField?.(event.subject.module, change.apiName) ?? true) &&
    visibleValue(change.old) &&
    visibleValue(change.new);
  return {
    async list(module, recordId, query) {
      // Never validate a cursor or reveal its scope before authorizing the parent.
      try {
        assertRecord(module, recordId);
        if (!canRead(module, recordId)) throw new NotFoundError();
      } catch {
        throw new NotFoundError("Record not found.");
      }
      const perPage = query.perPage ?? 25;
      const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
      for (const bound of [query.from, query.to])
        if (
          bound != null &&
          (typeof bound !== "string" || !iso.test(bound) || !Number.isFinite(Date.parse(bound)))
        )
          throw invalid();
      if (
        !Number.isInteger(perPage) ||
        perPage < 1 ||
        perPage > 200 ||
        (query.modules !== undefined &&
          (!Array.isArray(query.modules) || query.modules.some((m) => !knownModule(m)))) ||
        (query.sources !== undefined &&
          (!Array.isArray(query.sources) ||
            query.sources.some((s) => !["manual", "api", "import"].includes(s)))) ||
        (query.actorId != null && (typeof query.actorId !== "string" || !query.actorId)) ||
        (query.from != null && query.to != null && Date.parse(query.from) >= Date.parse(query.to))
      )
        throw invalid();
      const modules = [...new Set(query.modules ?? [])].sort();
      const sources = [...new Set(query.sources ?? [])].sort();
      const scope = JSON.stringify([
        ctx.orgId,
        ctx.userId,
        ctx.role,
        module,
        recordId,
        perPage,
        modules,
        query.actorId ?? null,
        query.from == null ? null : Date.parse(query.from),
        query.to == null ? null : Date.parse(query.to),
        sources,
      ]);
      let highWater = sequence();
      let after: Cursor["after"] | undefined;
      if (query.pageToken != null) {
        const cursor = cursors.get(query.pageToken);
        if (!cursor || cursor.scope !== scope || cursor.expires < Date.now()) throw invalid();
        highWater = cursor.highWater;
        after = cursor.after;
      }
      const rows = store().readPage({ module, recordId }, highWater);
      const anchor = after;
      const remaining =
        anchor === undefined
          ? rows
          : rows.filter(
              (event) =>
                event.sequence < anchor.sequence ||
                (event.sequence === anchor.sequence && event.ordinal < anchor.ordinal) ||
                (event.sequence === anchor.sequence &&
                  event.ordinal === anchor.ordinal &&
                  event.id.localeCompare(anchor.id) < 0),
            );
      const visible: RecordHistoryEvent[] = [];
      for (const event of remaining) {
        if (
          (modules.length && !modules.includes(event.subject.module)) ||
          (sources.length && !sources.includes(event.source)) ||
          (query.actorId != null && event.actor.id !== query.actorId) ||
          (query.from != null && Date.parse(event.occurredAt) < Date.parse(query.from)) ||
          (query.to != null && Date.parse(event.occurredAt) >= Date.parse(query.to)) ||
          !canRead(event.subject.module, event.subject.recordId)
        )
          continue;
        const changes = event.changes.filter((change) => visibleChange(event, change));
        if (event.kind === "fields_updated" && changes.length === 0) continue;
        // Identity/payload snapshots may derive from hidden fields. Only the typed field
        // snapshots are exposed for direct CRUD until kind-specific readers are supplied.
        const child = projectChild?.(event);
        if (child === null) continue;
        visible.push({
          ...event,
          stream: { module, recordId },
          subject: {
            module: event.subject.module,
            recordId: event.subject.recordId,
            ...(child?.name ? { name: child.name } : {}),
          },
          changes,
          payload: child?.payload ?? null,
        });
        if (visible.length > perPage) break;
      }
      const events = visible.slice(0, perPage);
      const moreRecords = visible.length > perPage;
      let nextPageToken: string | null = null;
      const last = events.at(-1);
      if (moreRecords && last) {
        nextPageToken = randomUUID();
        for (const [token, cursor] of cursors)
          if (cursor.expires < Date.now()) cursors.delete(token);
        cursors.set(nextPageToken, {
          scope,
          highWater,
          after: { sequence: last.sequence, ordinal: last.ordinal, id: last.id },
          expires: Date.now() + 30 * 60 * 1000,
        });
      }
      return structuredClone({ events, nextPageToken, moreRecords });
    },
  };
}
