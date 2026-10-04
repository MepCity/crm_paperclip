import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

it("keeps the count route to the wrapper and one service call", () => {
  expect(source).toContain("apiRoute");
  expect(source).toContain("getRecordService");
  expect(source.match(/getRecordService\(/g)).toHaveLength(1);
  expect(source).not.toContain("X-CRM-ORG");
  expect(source).not.toContain("getSession");
  expect(source).not.toContain("requireOrgContext");
  expect(source).not.toContain("redirect");
  expect(source).not.toContain("notFound");
  expect(source).not.toContain("request.json");
});
