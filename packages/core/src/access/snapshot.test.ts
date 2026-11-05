import { describe, expect, it } from "vitest";
import { standardPermissions } from "./catalogue";
import { buildAccessSnapshot, recordLevel } from "./evaluate";
import { SnapshotCache } from "./store";
import type { AccessData, AccessRoleRow, AccessSharingRuleRow } from "./types";

const snapshotFor = (userId: string, version: number) =>
  buildAccessSnapshot({
    orgId: "o",
    userId,
    version,
    profile: { id: "p", kind: "standard", permissions: standardPermissions() },
    fieldRows: [],
    roles: [{ id: "r", name: "R", parentRoleId: null, shareWithPeers: false }],
    members: [{ userId, roleId: "r", profileId: "p" }],
    groupMembers: [],
    defaults: [],
    rules: [],
  });

describe("SnapshotCache", () => {
  it("keys by org, user and version", () => {
    const cache = new SnapshotCache();
    cache.set(snapshotFor("u1", 1));
    expect(cache.get("o", "u1", 1)?.userId).toBe("u1");
    expect(cache.get("o", "u1", 2)).toBeUndefined();
    expect(cache.get("o", "u2", 1)).toBeUndefined();
    expect(cache.get("other", "u1", 1)).toBeUndefined();
  });
  it("evicts the least recently used entry beyond max", () => {
    const cache = new SnapshotCache(2);
    cache.set(snapshotFor("a", 1));
    cache.set(snapshotFor("b", 1));
    cache.get("o", "a", 1); // a is now most recent
    cache.set(snapshotFor("c", 1));
    expect(cache.size).toBe(2);
    expect(cache.get("o", "b", 1)).toBeUndefined();
    expect(cache.get("o", "a", 1)).toBeDefined();
  });
  it("expires entries after the TTL", () => {
    let now = 0;
    const cache = new SnapshotCache(10, 1000, () => now);
    cache.set(snapshotFor("a", 1));
    now = 999;
    expect(cache.get("o", "a", 1)).toBeDefined();
    now = 1001;
    expect(cache.get("o", "a", 1)).toBeUndefined();
  });
});

describe("snapshot micro-benchmark (ADR 0017 §12)", () => {
  // 25 members, 50 roles, 20 groups, 50 rules x 13 modules; pure build (queries excluded)
  // median under 10 ms (budget 25 ms p95 with queries) and under 1 ms per request on a cache hit.
  const roles: AccessRoleRow[] = Array.from({ length: 50 }, (_, i) => ({
    id: `r${i}`,
    name: `R${i}`,
    parentRoleId: i === 0 ? null : `r${Math.floor((i - 1) / 2)}`,
    shareWithPeers: i % 3 === 0,
  }));
  const members = Array.from({ length: 25 }, (_, i) => ({
    userId: `u${i}`,
    roleId: `r${i + 20}`,
    profileId: "p",
  }));
  const modules = [
    "Leads",
    "Contacts",
    "Accounts",
    "Deals",
    "Tasks",
    "Meetings",
    "Calls",
    "Campaigns",
    "Cases",
    "Solutions",
    "Products",
    "Quotes",
    "Invoices",
  ];
  const rules: AccessSharingRuleRow[] = modules.flatMap((module) =>
    Array.from({ length: 50 }, (_, i) => ({
      id: `${module}${i}`,
      module,
      sourceKind: "role_and_subordinates" as const,
      sourceId: `r${i}`,
      targetKind: "group" as const,
      targetId: `g${i % 20}`,
      level: "read" as const,
    })),
  );
  const groupMembers = Array.from({ length: 20 }, (_, g) => ({
    groupId: `g${g}`,
    kind: "role_and_subordinates" as const,
    memberId: `r${g}`,
  }));
  const data: AccessData = {
    orgId: "o",
    userId: "u3",
    version: 1,
    profile: { id: "p", kind: "standard", permissions: standardPermissions() },
    fieldRows: [],
    roles,
    members,
    groupMembers,
    defaults: [],
    rules,
  };
  // The shared machine produces load spikes; the median measures the algorithm, not the spikes.
  const median = (samples: number[]) =>
    [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)] ?? 0;

  it("builds a snapshot within budget and evaluates a record level in well under 1 ms", () => {
    const build: number[] = [];
    let snapshot = buildAccessSnapshot(data);
    for (let i = 0; i < 20; i++) {
      const t = performance.now();
      snapshot = buildAccessSnapshot(data);
      build.push(performance.now() - t);
    }
    expect(median(build)).toBeLessThan(10);
    const evaluate: number[] = [];
    for (let i = 0; i < 200; i++) {
      const t = performance.now();
      for (const owner of ["u1", "u2", "u9", "u24"]) recordLevel(snapshot, "Leads", owner);
      evaluate.push(performance.now() - t);
    }
    expect(median(evaluate)).toBeLessThan(1);
  });
});
