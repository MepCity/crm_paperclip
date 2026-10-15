// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type RecordListContext,
  readRecordListContext,
  recordListContextKey,
  removeRecordFromListContext,
  subscribeRecordListContext,
  writeRecordListContext,
} from "./record-list-context";

function context(module: string, recordIds: string[]): RecordListContext {
  return {
    module,
    viewId: "view-1",
    listHref: `/org/${module}`,
    page: 2,
    perPage: 25,
    recordIds,
  };
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("recordListContextKey", () => {
  it("separates organizations and modules", () => {
    const keys = new Set([
      recordListContextKey("org-a", "Leads"),
      recordListContextKey("org-b", "Leads"),
      recordListContextKey("org-a", "Contacts"),
      recordListContextKey("org-b", "Contacts"),
    ]);
    expect(keys.size).toBe(4);
  });
});

describe("write/read round trip", () => {
  it("returns what was written", () => {
    const value = context("Leads", ["a", "b", "c"]);
    writeRecordListContext("org-a", value);
    expect(readRecordListContext("org-a", "Leads")).toEqual(value);
  });

  it("keeps organizations and modules apart", () => {
    writeRecordListContext("org-a", context("Leads", ["a"]));
    writeRecordListContext("org-b", context("Leads", ["b"]));
    writeRecordListContext("org-a", context("Contacts", ["c"]));
    expect(readRecordListContext("org-a", "Leads")?.recordIds).toEqual(["a"]);
    expect(readRecordListContext("org-b", "Leads")?.recordIds).toEqual(["b"]);
    expect(readRecordListContext("org-a", "Contacts")?.recordIds).toEqual(["c"]);
  });

  it("returns null for a missing key", () => {
    expect(readRecordListContext("org-a", "Leads")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    sessionStorage.setItem(recordListContextKey("org-a", "Leads"), "{not json");
    expect(readRecordListContext("org-a", "Leads")).toBeNull();
  });

  it("returns null when the stored module differs or recordIds is not an array", () => {
    sessionStorage.setItem(
      recordListContextKey("org-a", "Leads"),
      JSON.stringify(context("Contacts", ["a"])),
    );
    expect(readRecordListContext("org-a", "Leads")).toBeNull();
    sessionStorage.setItem(
      recordListContextKey("org-a", "Leads"),
      JSON.stringify({ ...context("Leads", []), recordIds: "abc" }),
    );
    expect(readRecordListContext("org-a", "Leads")).toBeNull();
  });

  it("returns null for a JSON null value", () => {
    sessionStorage.setItem(recordListContextKey("org-a", "Leads"), "null");
    // JSON.parse yields null; reading a property throws inside the try block.
    expect(readRecordListContext("org-a", "Leads")).toBeNull();
  });

  it("propagates sessionStorage access errors on read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => readRecordListContext("org-a", "Leads")).toThrow("denied");
  });
});

describe("removeRecordFromListContext", () => {
  it("drops only the given id and keeps order", () => {
    writeRecordListContext("org-a", context("Leads", ["a", "b", "c", "d"]));
    removeRecordFromListContext("org-a", "Leads", "b");
    const result = readRecordListContext("org-a", "Leads");
    expect(result?.recordIds).toEqual(["a", "c", "d"]);
    expect(result?.page).toBe(2);
  });

  it("does not change anything for an unknown id", () => {
    writeRecordListContext("org-a", context("Leads", ["a", "b"]));
    const before = sessionStorage.getItem(recordListContextKey("org-a", "Leads"));
    removeRecordFromListContext("org-a", "Leads", "zzz");
    expect(sessionStorage.getItem(recordListContextKey("org-a", "Leads"))).toBe(before);
  });

  it("does nothing without a stored context", () => {
    removeRecordFromListContext("org-a", "Leads", "a");
    expect(sessionStorage.getItem(recordListContextKey("org-a", "Leads"))).toBeNull();
  });
});

describe("subscribeRecordListContext", () => {
  it("notifies after write and remove, and stops after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeRecordListContext("org-a", "Leads", listener);
    writeRecordListContext("org-a", context("Leads", ["a", "b"]));
    expect(listener).toHaveBeenCalledTimes(1);
    removeRecordFromListContext("org-a", "Leads", "a");
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    writeRecordListContext("org-a", context("Leads", ["x"]));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("ignores writes for another organization or module", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeRecordListContext("org-a", "Leads", listener);
    writeRecordListContext("org-b", context("Leads", ["a"]));
    writeRecordListContext("org-a", context("Contacts", ["a"]));
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("notifies on a cross-tab storage event for its key only", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeRecordListContext("org-a", "Leads", listener);
    window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    expect(listener).not.toHaveBeenCalled();
    window.dispatchEvent(
      new StorageEvent("storage", { key: recordListContextKey("org-a", "Leads") }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
