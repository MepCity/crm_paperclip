import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./list-stale-shared-memory.ts", import.meta.url), "utf8");

describe("list-stale-shared-memory", () => {
  it("cannot remove anything: no subprocess and no flag switches a removal path on", () => {
    // Freeing an ID needs `ipcrm`, which needs a subprocess. The kernel report does not prove
    // which program created a segment and an attachment can appear after the listing, so
    // removal stays a human decision checked on each id.
    expect(source).not.toMatch(/node:child_process|execFile|spawn|execSync/);
    expect(source).not.toMatch(/process\.argv/);
  });

  it("says in its own output that it removed nothing", () => {
    expect(source).toContain("Nothing was removed.");
  });
});
