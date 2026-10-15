import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const list = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const detail = readFileSync(new URL("./[viewId]/route.ts", import.meta.url), "utf8");

it("delegates the Kanban view routes to the shared operation wrapper", () => {
  expect(list).toContain("export const GET = operationRoute(operations.kanbanViews);");
  expect(list).toContain("export const POST = operationRoute(operations.createKanbanView);");
  expect(detail).toContain("export const GET = operationRoute(operations.kanbanView);");
  expect(detail).toContain("export const PUT = operationRoute(operations.updateKanbanView);");
  for (const source of [list, detail]) {
    expect(source).not.toContain("getRecordService");
    expect(source).not.toContain("request.json");
  }
});
