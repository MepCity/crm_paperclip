import pg from "pg";
import { describe, expect, inject, it } from "vitest";

describe("test cluster shared memory", () => {
  it("runs on mmap, so a saturated SysV identifier table cannot block it", async () => {
    const client = new pg.Client({ connectionString: inject("crmAdminUrl") });
    await client.connect();
    try {
      const result = await client.query("show shared_memory_type");
      const row = result.rows[0] as Record<string, unknown>;
      expect(Object.values(row)[0]).toBe("mmap");
    } finally {
      await client.end();
    }
  });
});
