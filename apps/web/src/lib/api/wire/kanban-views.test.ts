import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { beforeEach, describe, expect, it } from "vitest";
import {
  decodeKanbanView,
  decodeKanbanViewInput,
  encodeKanbanView,
  encodeKanbanViewInput,
} from "./kanban-views";
import { type OperationDeps, operationPath, operations } from "./operations";

const view = {
  id: "1",
  name: "Board",
  categorizeBy: "Stage",
  aggregateBy: null,
  headerStyle: "mono_color",
  fields: ["Deal_Name", "Stage"],
  sharedTo: "only_me" as const,
  createdBy: { id: "u1", name: "Ada" },
  modifiedBy: { id: "u2", name: "Bob" },
};

describe("kanban view codec", () => {
  it("round-trips a view and its write input", () => {
    const wire = encodeKanbanView(view);
    expect(wire).toEqual({
      id: "1",
      name: "Board",
      categorize_by: "Stage",
      aggregate_by: null,
      header_style: "mono_color",
      fields: [{ api_name: "Deal_Name" }, { api_name: "Stage" }],
      shared_to: "only_me",
      created_by: { id: "u1", name: "Ada" },
      modified_by: { id: "u2", name: "Bob" },
    });
    expect(decodeKanbanView(wire)).toEqual(view);
    const input = {
      name: view.name,
      categorizeBy: view.categorizeBy,
      aggregateBy: view.aggregateBy,
      headerStyle: view.headerStyle,
      fields: view.fields,
      sharedTo: "everyone" as const,
    };
    expect(decodeKanbanViewInput(encodeKanbanViewInput(input))).toEqual(input);
  });

  it("rejects malformed write items", () => {
    const ok = encodeKanbanViewInput({ ...view, id: undefined } as never);
    const withoutShare = encodeKanbanViewInput({ ...view, sharedTo: undefined } as never);
    expect("shared_to" in withoutShare).toBe(false);
    for (const bad of [
      null,
      { ...ok, extra: 1 },
      { ...ok, name: 3 },
      { ...ok, aggregate_by: 4 },
      { ...ok, fields: "x" },
      { ...ok, fields: [{ api_name: 1 }] },
    ])
      expect(() => decodeKanbanViewInput(bad)).toThrow(ValidationError);
  });
});

describe("kanban view operations", () => {
  let deps: OperationDeps;
  beforeEach(() => {
    deps = {
      records: createFixtureRecordService({
        orgId: randomUUID(),
        orgSlug: "kanban-wire",
        orgName: "Kanban Wire",
        userId: "wire-user",
        role: "admin",
      }),
      members: async () => [],
    };
  });
  const run = (op: keyof typeof operations, params: Record<string, string>, body?: unknown) =>
    // biome-ignore lint/suspicious/noExplicitAny: operation union
    (operations[op] as any).run(deps, { params, query: { module: "Deals" }, body });

  it("uses the settings paths", () => {
    expect(operationPath(operations.kanbanViews)).toBe("/crm/v9/settings/kanban_views");
    expect(operationPath(operations.updateKanbanView, { viewId: "7" })).toBe(
      "/crm/v9/settings/kanban_views/7",
    );
    expect(operations.createKanbanView.method).toBe("POST");
    expect(operations.updateKanbanView.method).toBe("PUT");
  });

  it("lists, creates, reads and updates", async () => {
    const list = await run("kanbanViews", {});
    expect(list.body.kanban_views).toHaveLength(1);
    const input = encodeKanbanViewInput({ ...view, fields: ["Deal_Name", "Stage", "Amount"] });
    const created = await run("createKanbanView", {}, { kanban_views: [input] });
    const id = created.body.kanban_views[0].id as string;
    const read = await run("kanbanView", { viewId: id });
    expect(read.body.kanban_views[0].name).toBe("Board");
    const updated = await run(
      "updateKanbanView",
      { viewId: id },
      { kanban_views: [{ ...input, name: "Renamed" }] },
    );
    expect(updated.body.kanban_views[0].name).toBe("Renamed");
  });

  it("maps service failures and body mistakes", async () => {
    await expect(run("kanbanView", { viewId: "nope" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(run("createKanbanView", {}, { kanban_views: [] })).rejects.toBeInstanceOf(
      ValidationError,
    );
    const input = encodeKanbanViewInput(view);
    await expect(
      run("createKanbanView", {}, { kanban_views: [{ ...input, name: " " }] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
