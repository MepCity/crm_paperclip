import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumeRecordCreatePrefill,
  readRecordCreatePrefill,
  recordCreatePrefillKey,
  writeRecordCreatePrefill,
} from "./record-create-prefill";

function mockSessionStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  vi.stubGlobal("sessionStorage", storage);
  return storage;
}

describe("record-create-prefill", () => {
  beforeEach(() => {
    mockSessionStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes, reads and consumes module-scoped prefill", () => {
    writeRecordCreatePrefill("acme", {
      module: "Contacts",
      fields: { Reporting_To: { module: "Contacts", id: "1", name: "Manager" } },
    });
    expect(readRecordCreatePrefill("acme", "Contacts")?.fields.Reporting_To).toMatchObject({
      id: "1",
    });
    expect(consumeRecordCreatePrefill("acme", "Contacts")?.module).toBe("Contacts");
    expect(readRecordCreatePrefill("acme", "Contacts")).toBeNull();
    expect(recordCreatePrefillKey("acme", "Contacts")).toContain("Contacts");
  });
});
