import { getDb } from "@crm/core";
import { createTestUser } from "@crm/core/testing";
import { closeDb, createDb, eq, schema } from "@crm/db";
import { describe, expect, it } from "vitest";
import { persistLanguage, readSavedLanguage } from "./language";

describe("saved language identity persistence", () => {
  it("defaults to English, isolates users and survives a new database connection", async () => {
    const first = await createTestUser();
    const second = await createTestUser();
    expect(await readSavedLanguage(first.user.id)).toBe("en");
    await persistLanguage(first.user.id, "tr");
    expect(await readSavedLanguage(first.user.id)).toBe("tr");
    expect(await readSavedLanguage(second.user.id)).toBe("en");
    const reopened = createDb(process.env.DATABASE_URL ?? "");
    try {
      const [row] = await reopened
        .select({ language: schema.users.uiLanguage })
        .from(schema.users)
        .where(eq(schema.users.id, first.user.id));
      expect(row?.language).toBe("tr");
    } finally {
      await closeDb(reopened);
    }
    await persistLanguage(first.user.id, "en");
    expect(await readSavedLanguage(first.user.id)).toBe("en");
  });
  it("rejects invalid codes in the database and retains the saved value", async () => {
    const { user } = await createTestUser();
    await persistLanguage(user.id, "tr");
    await expect(
      getDb()
        .update(schema.users)
        .set({ uiLanguage: "unsupported" })
        .where(eq(schema.users.id, user.id)),
    ).rejects.toThrow();
    expect(await readSavedLanguage(user.id)).toBe("tr");
  });
});
