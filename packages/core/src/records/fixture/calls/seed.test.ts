import { describe, expect, it } from "vitest";
import { fixtureModules } from "../registry";
import { callsMetadataSource } from "./metadata";
import { callsPicklists } from "./picklists";
import { fullName, generateFixtureCalls } from "./seed";

const now = new Date("2026-02-01T12:00:00.000Z");

describe("prepared Calls seed", () => {
  it("is deterministic at Tasks scale, with every exported field", () => {
    const calls = generateFixtureCalls(68, now);
    expect(calls).toHaveLength(250);
    expect(calls).toEqual(generateFixtureCalls(68, now));
    expect(new Set(calls.map((call) => call.id)).size).toBe(250);
    for (const call of calls) {
      expect(Object.keys(call.fields)).toEqual(
        callsMetadataSource.fields.map((field) => field.apiName),
      );
      expect(call.fields.id).toBe(call.id);
      expect(fullName(call.fields)).toBe(call.fields.Subject);
    }
  });

  it("covers every picklist value and both link shapes", () => {
    const calls = generateFixtureCalls(68, now);
    for (const name of Object.keys(callsPicklists)) {
      const seen = new Set(calls.map((call) => call.fields[name]));
      for (const option of callsPicklists[name] ?? [])
        expect(seen.has(option.storedValue)).toBe(true);
    }
    expect(calls.some((call) => call.fields.Who_Id && !call.fields.What_Id)).toBe(true);
    expect(calls.some((call) => call.fields.What_Id && !call.fields.Who_Id)).toBe(true);
  });

  it.each(["Leads", "Contacts", "Accounts", "Deals"])(
    "references existing synthetic %s records and leaves records without calls",
    (module) => {
      const targets = fixtureModules[module]?.generateSeed(now) ?? [];
      const targetIds = new Set(targets.map((record) => record.id));
      const counts = new Map<string, number>();
      for (const call of generateFixtureCalls(68, now)) {
        for (const name of ["Who_Id", "What_Id"]) {
          const value = call.fields[name];
          if (typeof value !== "object" || value === null || value.module !== module) continue;
          expect(targetIds.has(value.id as string)).toBe(true);
          counts.set(value.id as string, (counts.get(value.id as string) ?? 0) + 1);
        }
      }
      expect([...counts.values()].some((count) => count > 1)).toBe(true);
      expect(targets.some((record) => !counts.has(record.id))).toBe(true);
    },
  );
});
