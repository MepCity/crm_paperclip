import { describe, expect, it } from "vitest";
import { RECORD_FORM_COPY } from "./record-form-copy";

describe("RECORD_FORM_COPY", () => {
  it("provides expected copy strings for form actions and labels", () => {
    expect(RECORD_FORM_COPY.copyAddress).toBe("Copy Address");
    expect(RECORD_FORM_COPY.clearAll).toBe("Clear All");
    expect(RECORD_FORM_COPY.currencyInformation).toBe("Currency information");
    expect(RECORD_FORM_COPY.coordinatesFallback).toBe("Coordinates");
    expect(RECORD_FORM_COPY.longitudeFallback).toBe("Longitude");
  });

  it("contains exactly the expected set of keys", () => {
    const keys = Object.keys(RECORD_FORM_COPY);
    expect(keys.sort()).toEqual([
      "clearAll",
      "coordinatesFallback",
      "copyAddress",
      "currencyInformation",
      "longitudeFallback",
    ]);
  });

  it("has non-empty trimmed string values for every key", () => {
    for (const value of Object.values(RECORD_FORM_COPY)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
      expect(value.trim()).toBe(value);
    }
  });

  it("preserves object shape without missing or undefined properties", () => {
    expect(RECORD_FORM_COPY).toHaveProperty("copyAddress");
    expect(RECORD_FORM_COPY).toHaveProperty("clearAll");
    expect(RECORD_FORM_COPY).toHaveProperty("currencyInformation");
    expect(RECORD_FORM_COPY).toHaveProperty("coordinatesFallback");
    expect(RECORD_FORM_COPY).toHaveProperty("longitudeFallback");
    expect(Object.values(RECORD_FORM_COPY)).not.toContain(undefined);
    expect(Object.values(RECORD_FORM_COPY)).not.toContain(null);
  });
});
