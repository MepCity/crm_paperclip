import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../errors";
import type { FieldValue, RecordData } from "../../contract";
import { generateFixtureContacts } from "../contacts/seed";
import { generateFixtureDeals } from "../deals/seed";
import type { FixtureHookContext, FixtureModuleStore } from "../hooks";
import { contactRolesHooks, removeContactRolesFor, transferContactRolesToMaster } from "./hooks";
import { contactRolesIdBase, generateFixtureContactRoles } from "./seed";

const row = (
  id: string,
  deal: string,
  contact: string,
  role: string | null = null,
): RecordData => ({
  id,
  fields: {
    id,
    Deal: { module: "Deals", id: deal },
    Contact: { module: "Contacts", id: contact },
    Contact_Role: role,
  },
});
function context(roles: RecordData[] = []) {
  const stores: Record<string, FixtureModuleStore> = {
    Deals: {
      records: new Map([
        ["d1", { id: "d1", fields: {} }],
        ["d2", { id: "d2", fields: {} }],
      ]),
      nextId: 1n,
    },
    Contacts: {
      records: new Map(["c1", "c2", "c3"].map((id) => [id, { id, fields: {} }])),
      nextId: 1n,
    },
    Contact_Roles: { records: new Map(roles.map((r) => [r.id, r])), nextId: 100n },
  };
  const ctx: FixtureHookContext = {
    registeredModules: Object.keys(stores),
    moduleStore: (module) => stores[module] as FixtureModuleStore,
  };
  return { ctx, store: stores.Contact_Roles as FixtureModuleStore };
}
const apply = (
  fields: Record<string, FieldValue>,
  ctx: FixtureHookContext,
  previous?: Record<string, FieldValue>,
) => contactRolesHooks.applyRules?.(fields, {}, previous, ctx);
const base = (extra: Record<string, FieldValue> = {}) => ({
  Deal: { module: "Deals", id: "d1" },
  Contact: { module: "Contacts", id: "c1" },
  Contact_Role: "Evaluator",
  ...extra,
});

describe("Contact_Roles rules", () => {
  it("accepts a valid row and normalises -None- to empty", () => {
    const { ctx } = context();
    expect(() => apply(base(), ctx)).not.toThrow();
    const none = base({ Contact_Role: "-None-" });
    apply(none, ctx);
    expect(none.Contact_Role).toBeNull();
  });
  it("rejects missing deal, missing contact and unknown role", () => {
    const { ctx } = context();
    expect(() => apply(base({ Deal: { module: "Deals", id: "x" } }), ctx)).toThrow(ValidationError);
    expect(() => apply(base({ Contact: { module: "Contacts", id: "x" } }), ctx)).toThrow(
      ValidationError,
    );
    expect(() => apply(base({ Contact_Role: "Boss" }), ctx)).toThrow(ValidationError);
  });
  it("rejects a duplicate pair but lets the role change by update", () => {
    const existing = row("r1", "d1", "c1", "Purchasing");
    const { ctx } = context([existing]);
    expect(() => apply(base(), ctx)).toThrow(ValidationError);
    const next = base({ Contact_Role: "Evaluator" });
    expect(() => apply(next, ctx, existing.fields as Record<string, FieldValue>)).not.toThrow();
  });
  it("rejects Deal or Contact changes on update", () => {
    const existing = row("r1", "d1", "c1");
    const { ctx } = context([existing]);
    const prev = existing.fields as Record<string, FieldValue>;
    expect(() => apply(base({ Deal: { module: "Deals", id: "d2" } }), ctx, prev)).toThrow(
      ValidationError,
    );
    expect(() => apply(base({ Contact: { module: "Contacts", id: "c2" } }), ctx, prev)).toThrow(
      ValidationError,
    );
  });
});

describe("Contact_Roles helpers", () => {
  const rows = () => [row("r1", "d1", "c1"), row("r2", "d1", "c2"), row("r3", "d2", "c1")];
  it("removes rows by Deal and by Contact", () => {
    const a = context(rows());
    removeContactRolesFor("Deal", ["d1"], a.ctx);
    expect([...a.store.records.keys()]).toEqual(["r3"]);
    const b = context(rows());
    removeContactRolesFor("Contact", ["c1"], b.ctx);
    expect([...b.store.records.keys()]).toEqual(["r2"]);
  });
  it("transfers rows to the master and drops conflicting deals", () => {
    const { ctx, store } = context([...rows(), row("r4", "d2", "c3")]);
    // master c3 already has d2; duplicates c1 (d1, d2) and c2 (d1)
    transferContactRolesToMaster(["c1", "c2"], "c3", ctx);
    const left = [...store.records.values()].map((r) => [
      r.id,
      (r.fields.Contact as { id: string }).id,
    ]);
    expect(left).toEqual([
      ["r1", "c3"],
      ["r4", "c3"],
    ]);
  });
});

describe("Contact_Roles seed", () => {
  const deals = generateFixtureDeals();
  const contacts = generateFixtureContacts();
  const make = () => generateFixtureContactRoles(deals, contacts);
  const accountOf = (r: { fields: Record<string, unknown> } | undefined) =>
    (r?.fields.Account_Name as { id?: string } | null)?.id;

  it("is deterministic", () => {
    expect(make()).toEqual(make());
    expect(make().length).toBeGreaterThan(0);
  });

  it("links contacts of the deal's own account", () => {
    for (const row of make()) {
      const deal = deals.find((d) => d.id === (row.fields.Deal as { id: string }).id);
      const contact = contacts.find((c) => c.id === (row.fields.Contact as { id: string }).id);
      expect(accountOf(contact)).toBeDefined();
      expect(accountOf(contact)).toBe(accountOf(deal));
    }
  });

  it("mixes roles with empty roles and uses unique ids from the new base", () => {
    const rows = make();
    expect(rows.some((r) => r.fields.Contact_Role === null)).toBe(true);
    expect(rows.some((r) => typeof r.fields.Contact_Role === "string")).toBe(true);
    const ids = rows.map((r) => BigInt(r.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id >= contactRolesIdBase)).toBe(true);
  });
});
