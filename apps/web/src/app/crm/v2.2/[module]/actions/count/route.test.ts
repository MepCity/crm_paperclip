import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

it("delegates the count route to the shared operation wrapper", () => {
  expect(source).toContain("export const POST = operationRoute(operations.count);");
  expect(source).not.toContain("getRecordService");
  expect(source).not.toContain("listMembers");
  expect(source).not.toContain("X-CRM-ORG");
  expect(source).not.toContain("getSession");
  expect(source).not.toContain("requireOrgContext");
  expect(source).not.toContain("redirect");
  expect(source).not.toContain("notFound");
  expect(source).not.toContain("request.json");
});
