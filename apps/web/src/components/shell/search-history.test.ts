import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readSearchHistory, rememberSearchRecord, searchHistoryKey } from "./search-history";

function mockLocalStorage() {
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
  vi.stubGlobal("localStorage", storage);
  return storage;
}

describe("searchHistoryKey", () => {
  it("is stable for the same org and user pair", () => {
    const a = searchHistoryKey("myorg", "user-1");
    const b = searchHistoryKey("myorg", "user-1");
    expect(a).toBe(b);
  });

  it("differs when org differs", () => {
    expect(searchHistoryKey("org-a", "user-1")).not.toBe(searchHistoryKey("org-b", "user-1"));
  });

  it("differs when user differs", () => {
    expect(searchHistoryKey("myorg", "user-1")).not.toBe(searchHistoryKey("myorg", "user-2"));
  });

  it("differs when org contains a colon", () => {
    // "org:slug" + "user" vs "org" + ":slug:user" — must not collide
    expect(searchHistoryKey("org:slug", "user")).not.toBe(searchHistoryKey("org", ":slug:user"));
  });

  it("differs when user contains a colon", () => {
    expect(searchHistoryKey("myorg", "us:er")).not.toBe(searchHistoryKey("myorg", "us"));
  });
});

describe("readSearchHistory", () => {
  let storage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    storage = mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns [] when the key is missing", () => {
    expect(readSearchHistory("missing-key")).toEqual([]);
  });

  it("returns [] when the stored value is empty string (invalid JSON)", () => {
    storage.setItem("k", "");
    expect(readSearchHistory("k")).toEqual([]);
  });

  it("returns [] for invalid JSON", () => {
    storage.setItem("k", "{not json}");
    expect(readSearchHistory("k")).toEqual([]);
  });

  it("returns [] when stored value is a non-array JSON value (object)", () => {
    storage.setItem("k", JSON.stringify({ module: "Leads", id: "1", name: "A" }));
    expect(readSearchHistory("k")).toEqual([]);
  });

  it("returns [] when stored value is a non-array JSON value (number)", () => {
    storage.setItem("k", "42");
    expect(readSearchHistory("k")).toEqual([]);
  });

  it("drops entries missing the module field", () => {
    storage.setItem(
      "k",
      JSON.stringify([
        { id: "1", name: "A" },
        { module: "Leads", id: "2", name: "B" },
      ]),
    );
    expect(readSearchHistory("k")).toEqual([{ module: "Leads", id: "2", name: "B" }]);
  });

  it("drops entries missing the id field", () => {
    storage.setItem(
      "k",
      JSON.stringify([
        { module: "Leads", name: "A" },
        { module: "Leads", id: "2", name: "B" },
      ]),
    );
    expect(readSearchHistory("k")).toEqual([{ module: "Leads", id: "2", name: "B" }]);
  });

  it("drops entries missing the name field", () => {
    storage.setItem(
      "k",
      JSON.stringify([
        { module: "Leads", id: "1" },
        { module: "Leads", id: "2", name: "B" },
      ]),
    );
    expect(readSearchHistory("k")).toEqual([{ module: "Leads", id: "2", name: "B" }]);
  });

  it("drops entries with non-string module", () => {
    storage.setItem(
      "k",
      JSON.stringify([
        { module: 1, id: "1", name: "A" },
        { module: "Leads", id: "2", name: "B" },
      ]),
    );
    expect(readSearchHistory("k")).toEqual([{ module: "Leads", id: "2", name: "B" }]);
  });

  it("drops entries with non-string id", () => {
    storage.setItem(
      "k",
      JSON.stringify([
        { module: "Leads", id: null, name: "A" },
        { module: "Leads", id: "2", name: "B" },
      ]),
    );
    expect(readSearchHistory("k")).toEqual([{ module: "Leads", id: "2", name: "B" }]);
  });

  it("drops entries with non-string name", () => {
    storage.setItem(
      "k",
      JSON.stringify([
        { module: "Leads", id: "1", name: true },
        { module: "Leads", id: "2", name: "B" },
      ]),
    );
    expect(readSearchHistory("k")).toEqual([{ module: "Leads", id: "2", name: "B" }]);
  });

  it("drops null entries in the array", () => {
    storage.setItem("k", JSON.stringify([null, { module: "Leads", id: "2", name: "B" }]));
    expect(readSearchHistory("k")).toEqual([{ module: "Leads", id: "2", name: "B" }]);
  });

  it("keeps at most 15 entries in stored order", () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      module: "Leads",
      id: String(i),
      name: `Entry ${i}`,
    }));
    storage.setItem("k", JSON.stringify(entries));
    const result = readSearchHistory("k");
    expect(result).toHaveLength(15);
    expect(result[0]).toEqual({ module: "Leads", id: "0", name: "Entry 0" });
    expect(result[14]).toEqual({ module: "Leads", id: "14", name: "Entry 14" });
  });
});

describe("rememberSearchRecord", () => {
  let storage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    storage = mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("puts the new entry first in an empty history", () => {
    const entry = { module: "Leads", id: "1", name: "Lead A" };
    const result = rememberSearchRecord("k", entry);
    expect(result[0]).toEqual(entry);
  });

  it("puts the new entry first ahead of existing entries", () => {
    const old = { module: "Leads", id: "2", name: "Lead B" };
    storage.setItem("k", JSON.stringify([old]));
    const entry = { module: "Leads", id: "1", name: "Lead A" };
    const result = rememberSearchRecord("k", entry);
    expect(result[0]).toEqual(entry);
    expect(result[1]).toEqual(old);
  });

  it("removes an older entry with the same module and id", () => {
    const existing = [
      { module: "Leads", id: "1", name: "Lead A old" },
      { module: "Leads", id: "2", name: "Lead B" },
    ];
    storage.setItem("k", JSON.stringify(existing));
    const updated = { module: "Leads", id: "1", name: "Lead A new" };
    const result = rememberSearchRecord("k", updated);
    expect(result[0]).toEqual(updated);
    // old entry with same id should be gone
    const ids = result.map((e) => e.id);
    expect(ids.filter((id) => id === "1")).toHaveLength(1);
    expect(result).toHaveLength(2);
  });

  it("keeps an entry with the same id in a different module", () => {
    const existing = [{ module: "Contacts", id: "1", name: "Contact A" }];
    storage.setItem("k", JSON.stringify(existing));
    const entry = { module: "Leads", id: "1", name: "Lead A" };
    const result = rememberSearchRecord("k", entry);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(entry);
    expect(result[1]).toEqual(existing[0]);
  });

  it("caps the list at 15 entries", () => {
    const entries = Array.from({ length: 15 }, (_, i) => ({
      module: "Leads",
      id: String(i + 10),
      name: `Entry ${i + 10}`,
    }));
    storage.setItem("k", JSON.stringify(entries));
    const newEntry = { module: "Leads", id: "999", name: "New" };
    const result = rememberSearchRecord("k", newEntry);
    expect(result).toHaveLength(15);
    expect(result[0]).toEqual(newEntry);
  });

  it("persists the new list to localStorage", () => {
    const entry = { module: "Leads", id: "1", name: "Lead A" };
    rememberSearchRecord("k", entry);
    const stored = JSON.parse(storage.getItem("k") ?? "[]");
    expect(stored[0]).toEqual(entry);
  });

  it("returns the new list even when localStorage.setItem throws", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
    });
    const entry = { module: "Leads", id: "1", name: "Lead A" };
    // must not throw and must return the new list
    expect(() => {
      const result = rememberSearchRecord("k", entry);
      expect(result[0]).toEqual(entry);
    }).not.toThrow();
  });
});
