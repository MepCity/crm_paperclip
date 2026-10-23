import { expect, test } from "vitest";
import { ACCOUNTS_TIMELINE_SUBTABS, normalizeAccountsEventKind } from "./accounts-timeline";

test("Accounts timeline subtabs", () => {
  expect(ACCOUNTS_TIMELINE_SUBTABS).toEqual([{ id: "history", label: "History" }]);
  expect(normalizeAccountsEventKind("account_image_upload")).toBe("image_upload");
  expect(normalizeAccountsEventKind("field_change")).toBe("field_change");
});
