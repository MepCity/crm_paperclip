import { getDb } from "@crm/core";
import { eq, schema } from "@crm/db";
import { supportedLanguage, type UiLanguage } from "@/i18n/resolve-language";

/** Identity tables remain behind the existing authentication persistence boundary. */
export async function readSavedLanguage(userId: string): Promise<UiLanguage | undefined> {
  const [user] = await getDb()
    .select({ language: schema.users.uiLanguage })
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  return supportedLanguage(user?.language);
}

export async function persistLanguage(userId: string, language: UiLanguage) {
  const rows = await getDb()
    .update(schema.users)
    .set({ uiLanguage: language, updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning({ id: schema.users.id });
  if (!rows.length) throw new Error("UserNotFound");
}
