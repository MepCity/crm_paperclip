import type { FieldValue, ModuleRecordReference } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  addParticipant,
  MEETING_PARTICIPANTS_MAX,
  participantEntries,
  participantValue,
} from "./meeting-participants";

const asValue = (value: unknown) => value as FieldValue;

describe("participantEntries", () => {
  it("returns [] for non-array values", () => {
    expect(participantEntries(undefined)).toEqual([]);
    expect(participantEntries(null)).toEqual([]);
    expect(participantEntries(asValue("text"))).toEqual([]);
    expect(participantEntries(asValue({ type: "contact", id: "1" }))).toEqual([]);
  });

  it("skips invalid items", () => {
    const value = asValue([
      null,
      "x",
      [],
      { type: "contact" },
      { type: "contact", id: 5 },
      { type: "contact", id: "ok" },
    ]);
    expect(participantEntries(value)).toEqual([{ module: "Contacts", id: "ok" }]);
  });

  it("maps contact and lead types and skips unknown types", () => {
    const value = asValue([
      { type: "contact", id: "c1" },
      { type: "lead", id: "l1" },
      { type: "user", id: "u1" },
    ]);
    expect(participantEntries(value)).toEqual([
      { module: "Contacts", id: "c1" },
      { module: "Leads", id: "l1" },
    ]);
  });

  it("carries name only when it is a string", () => {
    const value = asValue([
      { type: "contact", id: "c1", name: "Ada" },
      { type: "lead", id: "l1", name: 3 },
    ]);
    expect(participantEntries(value)).toEqual([
      { module: "Contacts", id: "c1", name: "Ada" },
      { module: "Leads", id: "l1" },
    ]);
  });
});

describe("participantValue", () => {
  it("returns null for an empty list", () => {
    expect(participantValue([])).toBeNull();
  });

  it("maps Leads to lead and other modules to contact", () => {
    expect(
      participantValue([
        { module: "Leads", id: "l1", name: "Lee" },
        { module: "Contacts", id: "c1", name: "Ada" },
        { module: "Other", id: "o1", name: "Zed" },
      ]),
    ).toEqual([
      { type: "lead", id: "l1", name: "Lee", email: null },
      { type: "contact", id: "c1", name: "Ada", email: null },
      { type: "contact", id: "o1", name: "Zed", email: null },
    ]);
  });

  it("falls back to the id when name is missing", () => {
    expect(participantValue([{ module: "Contacts", id: "c9" }])).toEqual([
      { type: "contact", id: "c9", name: "c9", email: null },
    ]);
  });
});

describe("addParticipant", () => {
  const a: ModuleRecordReference = { module: "Contacts", id: "1" };

  it("appends a new participant at the end", () => {
    const b: ModuleRecordReference = { module: "Leads", id: "1" };
    expect(addParticipant([a], b)).toEqual([a, b]);
  });

  it("does not add the same module and id twice", () => {
    const current = [a];
    const result = addParticipant(current, { ...a, name: "Again" });
    expect(result).toEqual([a]);
    expect(result).not.toBe(current);
  });

  it("copies the list unchanged at the limit", () => {
    const current = Array.from({ length: MEETING_PARTICIPANTS_MAX }, (_, i) => ({
      module: "Contacts",
      id: `c${i}`,
    }));
    const result = addParticipant(current, { module: "Leads", id: "new" });
    expect(result).toEqual(current);
    expect(result).not.toBe(current);
  });
});
