// @vitest-environment jsdom
import type { ListQuery } from "@crm/core/records";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { readPrintListQuery, writePrintListQuery } from "./print-list-handoff";

const ORG = "acme";
const MOD = "Leads" as const;
const VIEW_ID = "view-abc";

const QUERY: ListQuery = {
  viewId: VIEW_ID,
  page: 1,
  perPage: 20,
};

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("writePrintListQuery / readPrintListQuery round-trip", () => {
  test("(1) write then read with the same viewId returns the query", () => {
    writePrintListQuery(ORG, MOD, QUERY);
    const result = readPrintListQuery(ORG, MOD, VIEW_ID);
    expect(result).toEqual(QUERY);
  });

  test("(2) read with a different viewId returns null", () => {
    writePrintListQuery(ORG, MOD, QUERY);
    const result = readPrintListQuery(ORG, MOD, "view-other");
    expect(result).toBeNull();
  });

  test("(3a) different orgSlug does not interfere", () => {
    writePrintListQuery(ORG, MOD, QUERY);
    const result = readPrintListQuery("other-org", MOD, VIEW_ID);
    expect(result).toBeNull();
  });

  test("(3b) different module key does not interfere", () => {
    writePrintListQuery(ORG, MOD, QUERY);
    const result = readPrintListQuery(ORG, "Contacts" as const, VIEW_ID);
    expect(result).toBeNull();
  });

  test("(4) no prior write returns null", () => {
    const result = readPrintListQuery(ORG, MOD, VIEW_ID);
    expect(result).toBeNull();
  });

  test("(5a) corrupted JSON in storage returns null silently", () => {
    sessionStorage.setItem(`mep:print-list-query:${ORG}:${MOD}`, "not-json{{{");
    const result = readPrintListQuery(ORG, MOD, VIEW_ID);
    expect(result).toBeNull();
  });

  test("(5b) sessionStorage.getItem throwing returns null silently", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    const result = readPrintListQuery(ORG, MOD, VIEW_ID);
    expect(result).toBeNull();
  });

  test("(5c) sessionStorage.setItem throwing does not propagate (write is silent)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => writePrintListQuery(ORG, MOD, QUERY)).not.toThrow();
  });
});
