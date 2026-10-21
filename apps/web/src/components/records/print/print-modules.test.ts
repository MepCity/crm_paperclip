import type { ModuleApiName } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  PRINT_LIST_MODULES,
  PRINT_PREVIEW_MODULES,
  supportsListPrint,
  supportsRecordPrint,
} from "./print-modules";

const UNLISTED = "Campaigns" as ModuleApiName;

describe("print-modules", () => {
  it("supportsRecordPrint is true for every preview module", () => {
    for (const module of PRINT_PREVIEW_MODULES) {
      expect(supportsRecordPrint(module)).toBe(true);
    }
  });

  it("supportsListPrint is true for every list module", () => {
    for (const module of PRINT_LIST_MODULES) {
      expect(supportsListPrint(module)).toBe(true);
    }
  });

  it("returns false for a module outside both lists", () => {
    expect(PRINT_PREVIEW_MODULES).not.toContain(UNLISTED);
    expect(PRINT_LIST_MODULES).not.toContain(UNLISTED);
    expect(supportsRecordPrint(UNLISTED)).toBe(false);
    expect(supportsListPrint(UNLISTED)).toBe(false);
  });

  it("has no duplicate modules in either list", () => {
    expect(new Set(PRINT_PREVIEW_MODULES).size).toBe(PRINT_PREVIEW_MODULES.length);
    expect(new Set(PRINT_LIST_MODULES).size).toBe(PRINT_LIST_MODULES.length);
  });

  it("pins the relation between list and preview modules", () => {
    const shared = PRINT_LIST_MODULES.filter((m) => PRINT_PREVIEW_MODULES.includes(m));
    expect(shared).toEqual(["Leads", "Contacts", "Accounts"]);
    // Deals: record print only (the reference Deals list has no Print View entry).
    expect(supportsRecordPrint("Deals")).toBe(true);
    expect(supportsListPrint("Deals")).toBe(false);
    // Cases: list print only.
    expect(supportsListPrint("Cases")).toBe(true);
    expect(supportsRecordPrint("Cases")).toBe(false);
  });
});
