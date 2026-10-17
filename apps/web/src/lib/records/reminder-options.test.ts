import { describe, expect, it } from "vitest";
import { REMINDER_OFFSETS, reminderOffsetOf, reminderValue } from "./reminder-options";

describe("reminder-options", () => {
  describe("REMINDER_OFFSETS", () => {
    it("contains all expected reminder offsets with ids and human-readable labels", () => {
      expect(REMINDER_OFFSETS).toEqual([
        { id: "PT0M", label: "At start" },
        { id: "PT5M", label: "5 minutes before" },
        { id: "PT10M", label: "10 minutes before" },
        { id: "PT15M", label: "15 minutes before" },
        { id: "PT30M", label: "30 minutes before" },
        { id: "PT1H", label: "1 hour before" },
        { id: "PT2H", label: "2 hours before" },
        { id: "P1D", label: "1 day before" },
        { id: "P2D", label: "2 days before" },
      ]);
    });
  });

  describe("reminderValue", () => {
    it("formats PT0M without a leading minus sign", () => {
      expect(reminderValue("PT0M")).toEqual([{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=PT0M" }]);
    });

    it("formats non-zero offsets with a leading minus sign", () => {
      expect(reminderValue("PT15M")).toEqual([{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=-PT15M" }]);
      expect(reminderValue("P1D")).toEqual([{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=-P1D" }]);
    });

    it("returns null when offsetId is null or empty", () => {
      expect(reminderValue(null)).toBeNull();
      expect(reminderValue("")).toBeNull();
    });
  });

  describe("reminderOffsetOf", () => {
    it("extracts the offset id from valid ALARM strings", () => {
      expect(reminderOffsetOf([{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=PT0M" }])).toBe("PT0M");
      expect(reminderOffsetOf([{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=-PT10M" }])).toBe("PT10M");
      expect(reminderOffsetOf([{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=-P2D" }])).toBe("P2D");
    });

    it("returns null for null, undefined, non-array, or empty values", () => {
      expect(reminderOffsetOf(null)).toBeNull();
      expect(reminderOffsetOf(undefined)).toBeNull();
      expect(reminderOffsetOf([] as unknown as string)).toBeNull();
      expect(reminderOffsetOf("TRIGGER=-PT10M" as unknown as null)).toBeNull();
      expect(reminderOffsetOf(123 as unknown as null)).toBeNull();
      expect(reminderOffsetOf({} as unknown as null)).toBeNull();
    });

    it("ignores malformed array entries and returns null if no valid offset exists", () => {
      expect(reminderOffsetOf([null, 123, "string", []] as unknown as null)).toBeNull();
      expect(reminderOffsetOf([{ otherKey: "value" }] as unknown as null)).toBeNull();
      expect(reminderOffsetOf([{ ALARM: null }] as unknown as null)).toBeNull();
      expect(reminderOffsetOf([{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=" }])).toBeNull();
    });

    it("returns null for offsets not present in REMINDER_OFFSETS", () => {
      expect(reminderOffsetOf([{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=-PT99M" }])).toBeNull();
      expect(reminderOffsetOf([{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=-P3D" }])).toBeNull();
    });
  });

  describe("round-trip (reminderValue <-> reminderOffsetOf)", () => {
    it("faithfully preserves every defined reminder offset in round-trip", () => {
      for (const offset of REMINDER_OFFSETS) {
        const val = reminderValue(offset.id);
        const resolved = reminderOffsetOf(val);
        expect(resolved).toBe(offset.id);
      }
    });
  });
});
