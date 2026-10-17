import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../errors";
import type { FieldValue, RecordData } from "../../contract";
import type { FixtureHookContext, FixtureModuleStore } from "../hooks";
import { notesHooks, removeNotesForParents } from "./hooks";
import { notesParentModules } from "./metadata";

function context(): FixtureHookContext {
  const stores = new Map<string, FixtureModuleStore>();
  for (const module of [...notesParentModules, "Notes"]) {
    stores.set(module, { records: new Map(), nextId: 1n });
  }
  for (const module of notesParentModules) {
    stores.get(module)?.records.set("parent", { id: "parent", fields: {} });
    stores.get(module)?.records.set("other", { id: "other", fields: {} });
  }
  return {
    registeredModules: [...stores.keys()],
    moduleStore(module) {
      const store = stores.get(module);
      if (!store) throw new Error("Unexpected module access.");
      return store;
    },
  };
}
function fields(module = "Leads", id = "parent"): Record<string, FieldValue> {
  return { Parent_Id: { module, id }, Note_Content: "General information." };
}
function apply(current = fields(), previous?: RecordData["fields"], ctx = context()) {
  notesHooks.applyRules?.(current, {}, previous, ctx);
}
function expectFieldError(current: Record<string, FieldValue>, field: string) {
  try {
    apply(current);
    throw new Error("Expected validation failure.");
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors[field]).toBeDefined();
  }
}

describe("Notes parent and content rules", () => {
  it.each(notesParentModules)("accepts a titleless note under %s", (module) => {
    expect(() => apply(fields(module))).not.toThrow();
    expect(() => apply({ ...fields(module), Note_Title: null })).not.toThrow();
  });
  it("accepts creating notes with a Campaigns parent record", () => {
    expect(() => apply(fields("Campaigns"))).not.toThrow();
    expect(() =>
      apply({
        Parent_Id: { module: "Campaigns", id: "parent" },
        Note_Title: "Campaign strategy",
        Note_Content: "Q1 Campaign roadmap note",
      }),
    ).not.toThrow();
  });
  it.each(["Tasks", "Events", "Calls", "Notes", "Unknown"])("rejects %s parents", (module) => {
    expectFieldError(fields(module), "Parent_Id");
  });
  it("requires a well-formed existing parent in the bound store", () => {
    const invalidParents: FieldValue[] = [null, "parent", { id: "parent" }, { module: "Leads" }];
    for (const Parent_Id of invalidParents) {
      expectFieldError({ ...fields(), Parent_Id }, "Parent_Id");
    }
    expectFieldError(fields("Leads", "missing"), "Parent_Id");
    const ctx = context();
    expect(() => apply(fields(), undefined, { ...ctx, registeredModules: ["Notes"] })).toThrow(
      ValidationError,
    );
  });
  it.each([
    ["Note_Title", 120],
    ["Note_Content", 65_535],
  ] as const)("enforces the exact %s limit including HTML markup", (field, limit) => {
    const boundary = `<p>${"x".repeat(limit - 7)}</p>`;
    expect(() => apply({ ...fields(), [field]: boundary })).not.toThrow();
    expectFieldError({ ...fields(), [field]: `${boundary}x` }, field);
  });
  it("rejects changes of parent id or module but permits display-name refresh", () => {
    const previous = fields();
    expect(() => apply(fields("Leads", "other"), previous)).toThrow(ValidationError);
    expect(() => apply(fields("Contacts"), previous)).toThrow(ValidationError);
    expect(() => apply({ ...fields(), Parent_Id: null }, previous)).toThrow(ValidationError);
    expect(() =>
      apply(
        { ...fields(), Parent_Id: { module: "Leads", id: "parent", name: "Updated" } },
        previous,
      ),
    ).not.toThrow();
  });
});

describe("Notes parent removal", () => {
  it("removes only matching parents, including locked notes, without detaching", () => {
    const ctx = context();
    const notes = ctx.moduleStore("Notes").records;
    for (const [id, module, parent] of [
      ["one", "Leads", "parent"],
      ["two", "Leads", "other"],
      ["three", "Contacts", "parent"],
      ["four", "Leads", "parent"],
    ] as const) {
      notes.set(id, { id, fields: { ...fields(module, parent), Locked__s: true } });
    }
    removeNotesForParents("Leads", ["parent", "missing"], ctx);
    expect([...notes.keys()]).toEqual(["two", "three"]);
    expect(notes.get("two")?.fields.Parent_Id).toEqual({ module: "Leads", id: "other" });
    removeNotesForParents("Leads", ["parent"], ctx);
    expect(notes.size).toBe(2);
    removeNotesForParents("Leads", [], ctx);
    removeNotesForParents("Leads", ["parent"], { ...ctx, registeredModules: [] });
    expect(notes.size).toBe(2);
  });
});
