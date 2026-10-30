import { describe, expect, it } from "vitest";
import type { OrgContext } from "../tenancy/types";
import { createMemoryAutomationPort } from "./memory";
import type { AssignmentRule, AutomationRule, WorkflowRule } from "./types";

const ctx = (orgId: string, role: OrgContext["role"] = "admin"): OrgContext => ({
  orgId,
  orgSlug: orgId,
  orgName: orgId,
  userId: "u1",
  role,
});
const wf = (id: string, position: number, module = "Leads"): WorkflowRule => ({
  kind: "workflow",
  id,
  revision: "r1",
  module,
  name: `Rule ${id}`,
  description: "synthetic",
  enabled: true,
  position,
  trigger: { kind: "record", on: "create" },
  branches: [],
});
const asg: AssignmentRule = {
  kind: "assignment",
  id: "a1",
  revision: "r1",
  module: "Leads",
  name: "Assign",
  description: "",
  enabled: false,
  position: 0,
  entries: [],
  fallback: null,
};

describe("memory AutomationPort", () => {
  it("defaults to an empty successful page and has no write methods", async () => {
    const port = createMemoryAutomationPort();
    expect(await port.list(ctx("o1"), { kind: "assignment", limit: 10 })).toEqual({
      ok: true,
      value: { items: [], nextCursor: null },
    });
    expect(Object.keys(port).sort()).toEqual(["get", "list"]);
  });

  it("separates tenants and enforces admin-only reads", async () => {
    const port = createMemoryAutomationPort({ fixtures: { o1: [wf("w1", 0)], o2: [] } });
    expect((await port.get(ctx("o2"), { kind: "workflow", id: "w1" })).ok).toBe(false);
    const r = await port.get(ctx("o2"), { kind: "workflow", id: "w1" });
    expect(r).toEqual({ ok: false, error: { code: "not_found" } });
    expect(await port.list(ctx("o1", "member"), { kind: "workflow", limit: 5 })).toEqual({
      ok: false,
      error: { code: "forbidden" },
    });
    expect((await port.get(ctx("o1", "member"), { kind: "workflow", id: "w1" })).ok).toBe(false);
  });

  it("filters by kind and module, sorts by position then id, and pages", async () => {
    const rules: AutomationRule[] = [
      wf("b", 1),
      wf("a", 1),
      wf("c", 0),
      wf("d", 2, "Contacts"),
      asg,
    ];
    const port = createMemoryAutomationPort({ fixtures: { o1: rules } });
    const c = ctx("o1");
    const p1 = await port.list(c, { kind: "workflow", module: "Leads", limit: 2 });
    if (!p1.ok) throw new Error("expected ok");
    expect(p1.value.items.map((i) => i.id)).toEqual(["c", "a"]);
    const p2 = await port.list(c, {
      kind: "workflow",
      module: "Leads",
      limit: 2,
      cursor: p1.value.nextCursor ?? "",
    });
    if (!p2.ok) throw new Error("expected ok");
    expect(p2.value.items.map((i) => i.id)).toEqual(["b"]);
    expect(p2.value.nextCursor).toBeNull();
  });

  it("rejects bad limits and foreign, malformed or mismatched cursors", async () => {
    const port = createMemoryAutomationPort({ fixtures: { o1: [wf("a", 0), wf("b", 1)] } });
    const bad = { ok: false, error: { code: "invalid_query" } };
    expect(await port.list(ctx("o1"), { kind: "workflow", limit: 0 })).toEqual(bad);
    expect(await port.list(ctx("o1"), { kind: "workflow", limit: 101 })).toEqual(bad);
    expect(await port.list(ctx("o1"), { kind: "workflow", limit: 1, cursor: "zzz" })).toEqual(bad);
    const p = await port.list(ctx("o1"), { kind: "workflow", limit: 1 });
    if (!p.ok) throw new Error("expected ok");
    const cursor = p.value.nextCursor ?? "";
    expect(await port.list(ctx("o2"), { kind: "workflow", limit: 1, cursor })).toEqual(bad);
    expect(await port.list(ctx("o1"), { kind: "assignment", limit: 1, cursor })).toEqual(bad);
  });

  it("returns defensive copies and isolates input and instances", async () => {
    const input = [wf("a", 0)];
    const port = createMemoryAutomationPort({ fixtures: { o1: input } });
    const got = await port.get(ctx("o1"), { kind: "workflow", id: "a" });
    if (!got.ok) throw new Error("expected ok");
    (got.value as { name: string }).name = "mutated";
    (input[0] as { name: string }).name = "mutated-input";
    const again = await port.get(ctx("o1"), { kind: "workflow", id: "a" });
    expect(again.ok && again.value.name).toBe("Rule a");
    const other = createMemoryAutomationPort();
    expect((await other.get(ctx("o1"), { kind: "workflow", id: "a" })).ok).toBe(false);
  });

  it("withholds unprojectable rules and surfaces injected failures", async () => {
    const port = createMemoryAutomationPort({
      fixtures: { o1: [wf("a", 0), wf("h", 1)] },
      withheld: new Set(["h"]),
    });
    const l = await port.list(ctx("o1"), { kind: "workflow", limit: 10 });
    expect(l.ok && l.value.items.map((i) => i.id)).toEqual(["a"]);
    expect(await port.get(ctx("o1"), { kind: "workflow", id: "h" })).toEqual({
      ok: false,
      error: { code: "not_found" },
    });
    const down = createMemoryAutomationPort({ inject: () => ({ code: "unavailable" }) });
    expect(await down.list(ctx("o1"), { kind: "workflow", limit: 1 })).toEqual({
      ok: false,
      error: { code: "unavailable" },
    });
  });
});
