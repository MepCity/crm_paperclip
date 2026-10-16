// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readSearchHistory,
  rememberSearchRecord,
  type SearchHistoryEntry,
  searchHistoryKey,
} from "./search-history";

describe("searchHistoryKey", () => {
  it("formats key as JSON-serialized [orgSlug, userId]", () => {
    expect(searchHistoryKey("org-1", "user-1")).toBe('crm:search-history:["org-1","user-1"]');
  });

  it("handles empty strings and special characters safely", () => {
    expect(searchHistoryKey("", "")).toBe('crm:search-history:["",""]');
    expect(searchHistoryKey("org/sub:test", "user@company.com")).toBe(
      'crm:search-history:["org/sub:test","user@company.com"]',
    );
  });

  it("produces distinct keys for different orgs or users", () => {
    const keys = new Set([
      searchHistoryKey("org-a", "user-1"),
      searchHistoryKey("org-b", "user-1"),
      searchHistoryKey("org-a", "user-2"),
      searchHistoryKey("org-b", "user-2"),
    ]);
    expect(keys.size).toBe(4);
  });
});

describe("readSearchHistory", () => {
  const key = searchHistoryKey("test-org", "test-user");

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns an empty array when the key does not exist in localStorage", () => {
    expect(readSearchHistory(key)).toEqual([]);
  });

  it("returns an empty array when the value in localStorage is an empty string", () => {
    localStorage.setItem(key, "");
    expect(readSearchHistory(key)).toEqual([]);
  });

  it("returns an empty array when localStorage contains malformed JSON", () => {
    localStorage.setItem(key, "{not-json");
    expect(readSearchHistory(key)).toEqual([]);
    localStorage.setItem(key, "[1, 2,");
    expect(readSearchHistory(key)).toEqual([]);
  });

  it("returns an empty array when JSON parses to non-array types", () => {
    localStorage.setItem(key, "null");
    expect(readSearchHistory(key)).toEqual([]);

    localStorage.setItem(key, "{}");
    expect(readSearchHistory(key)).toEqual([]);

    localStorage.setItem(key, "42");
    expect(readSearchHistory(key)).toEqual([]);

    localStorage.setItem(key, '"string"');
    expect(readSearchHistory(key)).toEqual([]);

    localStorage.setItem(key, "true");
    expect(readSearchHistory(key)).toEqual([]);
  });

  it("returns valid SearchHistoryEntry items from stored array", () => {
    const stored: SearchHistoryEntry[] = [
      { module: "Leads", id: "lead-1", name: "Alice Smith" },
      { module: "Contacts", id: "contact-1", name: "Bob Jones" },
    ];
    localStorage.setItem(key, JSON.stringify(stored));
    expect(readSearchHistory(key)).toEqual(stored);
  });

  it("filters out invalid, null, primitive, or incomplete objects in the array", () => {
    const raw = [
      null,
      undefined,
      42,
      "hello",
      true,
      {},
      { module: "Leads" },
      { id: "lead-1", name: "Alice" },
      { module: "Leads", id: 123, name: "Invalid ID type" },
      { module: 123, id: "lead-2", name: "Invalid module type" },
      { module: "Leads", id: "lead-3", name: null },
      { module: "Leads", id: "lead-valid", name: "Valid Lead" },
    ];
    localStorage.setItem(key, JSON.stringify(raw));
    expect(readSearchHistory(key)).toEqual([
      { module: "Leads", id: "lead-valid", name: "Valid Lead" },
    ]);
  });

  it("caps the returned items to 15 when storage contains more", () => {
    const items: SearchHistoryEntry[] = Array.from({ length: 20 }, (_, i) => ({
      module: "Leads",
      id: `lead-${i}`,
      name: `Lead ${i}`,
    }));
    localStorage.setItem(key, JSON.stringify(items));
    const result = readSearchHistory(key);
    expect(result).toHaveLength(15);
    expect(result).toEqual(items.slice(0, 15));
  });

  it("returns an empty array gracefully when localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: localStorage is disabled");
    });
    expect(readSearchHistory(key)).toEqual([]);
  });
});

describe("rememberSearchRecord", () => {
  const key = searchHistoryKey("test-org", "test-user");

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("adds an entry to empty history and writes it to localStorage", () => {
    const entry: SearchHistoryEntry = {
      module: "Leads",
      id: "lead-1",
      name: "Acme Lead",
    };
    const result = rememberSearchRecord(key, entry);
    expect(result).toEqual([entry]);
    expect(JSON.parse(localStorage.getItem(key) ?? "[]")).toEqual([entry]);
  });

  it("prepends the newest entry to existing history", () => {
    const entry1: SearchHistoryEntry = { module: "Leads", id: "lead-1", name: "Lead 1" };
    const entry2: SearchHistoryEntry = { module: "Contacts", id: "contact-1", name: "Contact 1" };

    rememberSearchRecord(key, entry1);
    const result = rememberSearchRecord(key, entry2);

    expect(result).toEqual([entry2, entry1]);
    expect(JSON.parse(localStorage.getItem(key) ?? "[]")).toEqual([entry2, entry1]);
  });

  it("deduplicates an existing entry and moves it to the top", () => {
    const entry1: SearchHistoryEntry = { module: "Leads", id: "lead-1", name: "Lead 1" };
    const entry2: SearchHistoryEntry = { module: "Contacts", id: "contact-1", name: "Contact 1" };
    const entry3: SearchHistoryEntry = { module: "Accounts", id: "acc-1", name: "Account 1" };

    rememberSearchRecord(key, entry1);
    rememberSearchRecord(key, entry2);
    rememberSearchRecord(key, entry3);

    // Re-remember entry1 (which was pushed down to index 2)
    const updated = rememberSearchRecord(key, entry1);
    expect(updated).toEqual([entry1, entry3, entry2]);
    expect(JSON.parse(localStorage.getItem(key) ?? "[]")).toEqual([entry1, entry3, entry2]);
  });

  it("updates the name if an existing record (same module and id) is remembered with a new name", () => {
    const oldEntry: SearchHistoryEntry = { module: "Leads", id: "lead-1", name: "Old Name" };
    const updatedEntry: SearchHistoryEntry = { module: "Leads", id: "lead-1", name: "New Name" };

    rememberSearchRecord(key, oldEntry);
    const result = rememberSearchRecord(key, updatedEntry);

    expect(result).toEqual([updatedEntry]);
    expect(JSON.parse(localStorage.getItem(key) ?? "[]")).toEqual([updatedEntry]);
  });

  it("does not deduplicate records that have the same id but different modules", () => {
    const lead: SearchHistoryEntry = { module: "Leads", id: "record-1", name: "Lead 1" };
    const contact: SearchHistoryEntry = { module: "Contacts", id: "record-1", name: "Contact 1" };

    rememberSearchRecord(key, lead);
    const result = rememberSearchRecord(key, contact);

    expect(result).toEqual([contact, lead]);
  });

  it("caps the history list at 15 items, dropping the oldest when exceeding limit", () => {
    for (let i = 0; i < 15; i++) {
      rememberSearchRecord(key, { module: "Leads", id: `lead-${i}`, name: `Lead ${i}` });
    }

    const initial = readSearchHistory(key);
    expect(initial).toHaveLength(15);
    expect(initial[0]?.id).toBe("lead-14");
    expect(initial[14]?.id).toBe("lead-0");

    const newEntry: SearchHistoryEntry = {
      module: "Contacts",
      id: "contact-new",
      name: "New Contact",
    };
    const updated = rememberSearchRecord(key, newEntry);

    expect(updated).toHaveLength(15);
    expect(updated[0]).toEqual(newEntry);
    expect(updated[14]?.id).toBe("lead-1"); // lead-0 was dropped
    expect(updated.some((entry) => entry.id === "lead-0")).toBe(false);
  });

  it("returns computed next list and does not throw when localStorage.setItem throws", () => {
    const entry: SearchHistoryEntry = { module: "Leads", id: "lead-1", name: "Lead 1" };
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    let result: SearchHistoryEntry[] | undefined;
    expect(() => {
      result = rememberSearchRecord(key, entry);
    }).not.toThrow();
    expect(result).toEqual([entry]);
  });
});
