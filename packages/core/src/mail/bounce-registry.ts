import { normalizeAddress } from "../mail-threading/address";
import type { DeliveryReport } from "./dsn";

export interface BounceEntry {
  address: string;
  state: "bounced" | "soft";
  /** For a `soft` entry this is `soft_limit` (the limit has not been reached yet). */
  reason: "permanent" | "soft_limit";
  lastStatus: string;
  lastDiagnostic: string | null;
  softCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface BounceRegistryOptions {
  now?: () => Date;
  softLimit?: number;
  softWindowMs?: number;
}

export interface BounceRegistry {
  recordReport(report: DeliveryReport): void;
  isBounced(address: string): boolean;
  get(address: string): BounceEntry | null;
  clear(address: string): void;
  list(): BounceEntry[];
}

interface Internal {
  entry: BounceEntry;
  softTimes: number[];
}

const DEFAULT_SOFT_LIMIT = 3;
const DEFAULT_SOFT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function copy(entry: BounceEntry): BounceEntry {
  return {
    ...entry,
    firstSeenAt: new Date(entry.firstSeenAt),
    lastSeenAt: new Date(entry.lastSeenAt),
  };
}

export function createInMemoryBounceRegistry(opts: BounceRegistryOptions = {}): BounceRegistry {
  const now = opts.now ?? (() => new Date());
  const softLimit = opts.softLimit ?? DEFAULT_SOFT_LIMIT;
  const softWindowMs = opts.softWindowMs ?? DEFAULT_SOFT_WINDOW_MS;
  const store = new Map<string, Internal>();

  return {
    recordReport(report) {
      for (const r of report.recipients) {
        if (r.kind === "other" || r.action.trim().toLowerCase() !== "failed") continue;
        const address = normalizeAddress(r.finalRecipient);
        if (!address) continue;
        const at = now();
        const existing = store.get(address);
        const base: Internal = existing ?? {
          entry: {
            address,
            state: "soft",
            reason: "soft_limit",
            lastStatus: r.status,
            lastDiagnostic: r.diagnosticCode,
            softCount: 0,
            firstSeenAt: at,
            lastSeenAt: at,
          },
          softTimes: [],
        };
        const e = base.entry;
        e.lastStatus = r.status;
        e.lastDiagnostic = r.diagnosticCode;
        e.lastSeenAt = at;
        if (r.kind === "permanent") {
          e.state = "bounced";
          e.reason = "permanent";
        } else {
          const cutoff = at.getTime() - softWindowMs;
          base.softTimes = base.softTimes.filter((t) => t > cutoff);
          base.softTimes.push(at.getTime());
          e.softCount = base.softTimes.length;
          if (e.state !== "bounced" && e.softCount >= softLimit) {
            e.state = "bounced";
            e.reason = "soft_limit";
          }
        }
        store.set(address, base);
      }
    },
    isBounced(address) {
      const key = normalizeAddress(address);
      return key !== null && store.get(key)?.entry.state === "bounced";
    },
    get(address) {
      const key = normalizeAddress(address);
      const found = key === null ? undefined : store.get(key);
      return found ? copy(found.entry) : null;
    },
    clear(address) {
      const key = normalizeAddress(address);
      if (key !== null) store.delete(key);
    },
    list() {
      return [...store.values()]
        .map((i) => copy(i.entry))
        .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime());
    },
  };
}
