import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const collection = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const item = readFileSync(new URL("./[attachmentId]/route.ts", import.meta.url), "utf8");

describe("Attachments route exports", () => {
  it("delegates collection and item routes to the attachmentRoute wrapper", () => {
    expect(collection).toContain("export const GET = attachmentRoute();");
    expect(collection).toContain("export const POST = attachmentRoute();");
    expect(item).toContain("export const GET = attachmentRoute();");
    expect(item).toContain("export const DELETE = attachmentRoute();");

    for (const source of [collection, item]) {
      expect(source).toContain('export const dynamic = "force-dynamic";');
      expect(source).not.toContain("getRecordService");
      expect(source).not.toContain("getSession");
      expect(source).not.toContain("requireOrgContext");
    }
  });
});
