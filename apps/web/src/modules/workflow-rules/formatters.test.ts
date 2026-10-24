import type { ActionKind, Condition, Timing, Trigger } from "@crm/core/automation";
import type { Comparator, Criteria, CriteriaValue } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  formatActionKind,
  formatComparator,
  formatCondition,
  formatCriteria,
  formatCriteriaValue,
  formatTiming,
  formatTrigger,
} from "./formatters";

describe("formatTrigger", () => {
  it.each<[Trigger, string]>([
    [{ kind: "record", on: "create" }, "On record creation"],
    [{ kind: "record", on: "edit" }, "On record edit"],
    [{ kind: "record", on: "create_or_edit" }, "On record creation or edit"],
    [{ kind: "record", on: "delete" }, "On record deletion"],
    [{ kind: "record", on: "custom_event" as unknown as "create" }, "Record event (custom_event)"],
  ])("formats record trigger %j as %s", (trigger, expected) => {
    expect(formatTrigger(trigger)).toBe(expected);
  });

  it("formats field_change trigger with single field", () => {
    expect(formatTrigger({ kind: "field_change", fields: ["Status"] })).toBe(
      "When fields change: Status",
    );
  });

  it("formats field_change trigger with multiple fields", () => {
    expect(formatTrigger({ kind: "field_change", fields: ["Status", "Stage", "Amount"] })).toBe(
      "When fields change: Status, Stage, Amount",
    );
  });

  it("formats field_change trigger with empty fields list", () => {
    expect(formatTrigger({ kind: "field_change", fields: [] })).toBe("When fields change: ");
  });

  it("formats date trigger", () => {
    expect(
      formatTrigger({
        kind: "date",
        field: "Close_Date",
        timezone: "America/New_York",
      }),
    ).toBe("Date field: Close_Date (America/New_York)");
  });

  it("formats unknown trigger with fallback", () => {
    expect(formatTrigger({ kind: "unknown_kind" } as unknown as Trigger)).toBe("Unknown trigger");
  });
});

describe("formatComparator", () => {
  it.each<[Comparator | (string & {}), string]>([
    ["equal", "equals"],
    ["not_equal", "does not equal"],
    ["contains", "contains"],
    ["not_contains", "does not contain"],
    ["starts_with", "starts with"],
    ["ends_with", "ends with"],
    ["greater_than", ">"],
    ["less_than", "<"],
    ["greater_equal", ">="],
    ["less_equal", "<="],
    ["is_empty", "is empty"],
    ["is_not_empty", "is not empty"],
    ["between", "between"],
    ["not_between", "not between"],
    ["custom_op" as unknown as Comparator, "custom_op"],
  ])("formats %s as %s", (comparator, expected) => {
    expect(formatComparator(comparator as Comparator)).toBe(expected);
  });
});

describe("formatCriteriaValue", () => {
  // QUESTION: null and undefined both format as '""', which is indistinguishable from an empty string value "".
  it("formats null and undefined as empty quoted string", () => {
    expect(formatCriteriaValue(null as unknown as CriteriaValue)).toBe('""');
    expect(formatCriteriaValue(undefined as unknown as CriteriaValue)).toBe('""');
  });

  it("formats strings wrapped in double quotes", () => {
    expect(formatCriteriaValue("hello")).toBe('"hello"');
    expect(formatCriteriaValue("")).toBe('""');
    expect(formatCriteriaValue("Lead 123")).toBe('"Lead 123"');
  });

  it("formats numbers without quotes", () => {
    expect(formatCriteriaValue(0)).toBe("0");
    expect(formatCriteriaValue(42)).toBe("42");
    expect(formatCriteriaValue(-15.5)).toBe("-15.5");
  });

  it("formats booleans without quotes", () => {
    expect(formatCriteriaValue(true)).toBe("true");
    expect(formatCriteriaValue(false)).toBe("false");
  });

  it("formats arrays of values recursively", () => {
    expect(formatCriteriaValue([])).toBe("[]");
    expect(formatCriteriaValue(["Open", "Contacted"])).toBe('["Open", "Contacted"]');
    expect(formatCriteriaValue([1, 2, 3])).toBe("[1, 2, 3]");
    expect(formatCriteriaValue([null, "test"])).toBe('["", "test"]');
  });

  it("formats nested arrays", () => {
    expect(formatCriteriaValue([["nested"] as unknown as string])).toBe('[["nested"]]');
  });

  // QUESTION: CriteriaToken with extra metadata (e.g. offset or name) only formats ${token}, ignoring extra fields.
  // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token string description
  it("formats criteria tokens as ${token}", () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token string assertion
    expect(formatCriteriaValue({ token: "CURRENTUSER" })).toBe("${CURRENTUSER}");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token string assertion
    expect(formatCriteriaValue({ token: "TODAY" })).toBe("${TODAY}");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token string assertion
    expect(formatCriteriaValue({ token: "AGEINDAYS", offset: 10 })).toBe("${AGEINDAYS}");
  });

  it("formats non-token objects falling through to String(value)", () => {
    expect(formatCriteriaValue({ other: 123 } as unknown as CriteriaValue)).toBe("[object Object]");
  });
});

describe("formatCriteria", () => {
  it("formats a leaf field criteria", () => {
    expect(
      formatCriteria({
        field: "Lead_Source",
        comparator: "equal",
        value: "Web",
      }),
    ).toBe('Lead_Source equals "Web"');
  });

  it("formats criteria with numeric comparator and value", () => {
    expect(
      formatCriteria({
        field: "Amount",
        comparator: "greater_than",
        value: 1000,
      }),
    ).toBe("Amount > 1000");
  });

  it("formats AND group criteria", () => {
    expect(
      formatCriteria({
        groupOperator: "and",
        group: [
          { field: "Stage", comparator: "equal", value: "Closed Won" },
          { field: "Amount", comparator: "greater_than", value: 1000 },
        ],
      }),
    ).toBe('(Stage equals "Closed Won" AND Amount > 1000)');
  });

  it("formats OR group criteria", () => {
    expect(
      formatCriteria({
        groupOperator: "or",
        group: [
          { field: "Rating", comparator: "equal", value: "Hot" },
          { field: "Rating", comparator: "equal", value: "Warm" },
        ],
      }),
    ).toBe('(Rating equals "Hot" OR Rating equals "Warm")');
  });

  it("formats nested group criteria", () => {
    expect(
      formatCriteria({
        groupOperator: "or",
        group: [
          {
            groupOperator: "and",
            group: [
              { field: "A", comparator: "equal", value: 1 },
              { field: "B", comparator: "equal", value: 2 },
            ],
          },
          { field: "C", comparator: "equal", value: 3 },
        ],
      }),
    ).toBe("((A equals 1 AND B equals 2) OR C equals 3)");
  });

  it("formats unknown criteria with fallback", () => {
    expect(formatCriteria({} as unknown as Criteria)).toBe("Unknown criteria");
  });
});

describe("formatCondition", () => {
  it("formats all_records condition", () => {
    expect(formatCondition({ kind: "all_records" })).toBe("All records");
  });

  it("formats criteria condition", () => {
    expect(
      formatCondition({
        kind: "criteria",
        criteria: {
          field: "Lead_Source",
          comparator: "equal",
          value: "Web",
        },
      }),
    ).toBe('Lead_Source equals "Web"');
  });

  it("formats unknown condition with fallback", () => {
    expect(formatCondition({ kind: "custom" } as unknown as Condition)).toBe("Unknown condition");
  });
});

describe("formatTiming", () => {
  describe("event_relative", () => {
    it("formats offset 0 as at the time of event", () => {
      expect(formatTiming({ kind: "event_relative", offsetSeconds: 0 })).toBe(
        "At the time of event",
      );
    });

    it.each<[number, string]>([
      [86400, "1 day after event"],
      [172800, "2 days after event"],
      [-86400, "1 day before event"],
      [-259200, "3 days before event"],
    ])("formats day offset %d as %s", (offsetSeconds, expected) => {
      expect(formatTiming({ kind: "event_relative", offsetSeconds })).toBe(expected);
    });

    it.each<[number, string]>([
      [3600, "1 hour after event"],
      [7200, "2 hours after event"],
      [-3600, "1 hour before event"],
      [-14400, "4 hours before event"],
    ])("formats hour offset %d as %s", (offsetSeconds, expected) => {
      expect(formatTiming({ kind: "event_relative", offsetSeconds })).toBe(expected);
    });

    // QUESTION: formatTiming formats seconds with literal "second(s)" instead of singular/plural day/hour distinction.
    it.each<[number, string]>([
      [1, "1 second(s) after event"],
      [45, "45 second(s) after event"],
      [-1, "1 second(s) before event"],
      [-90, "90 second(s) before event"],
    ])("formats seconds offset %d as %s", (offsetSeconds, expected) => {
      expect(formatTiming({ kind: "event_relative", offsetSeconds })).toBe(expected);
    });
  });

  describe("field_relative", () => {
    it("formats offset 0 as on field (timezone)", () => {
      expect(
        formatTiming({
          kind: "field_relative",
          field: "Due_Date",
          offsetSeconds: 0,
          timezone: "UTC",
        }),
      ).toBe("On Due_Date (UTC)");
    });

    it.each<[number, string]>([
      [86400, "1 day after Renewal_Date (UTC)"],
      [172800, "2 days after Renewal_Date (UTC)"],
      [-86400, "1 day before Renewal_Date (UTC)"],
      [-2592000, "30 days before Renewal_Date (UTC)"],
    ])("formats day offset %d as %s", (offsetSeconds, expected) => {
      expect(
        formatTiming({
          kind: "field_relative",
          field: "Renewal_Date",
          offsetSeconds,
          timezone: "UTC",
        }),
      ).toBe(expected);
    });

    it.each<[number, string]>([
      [3600, "1 hour after Due_Date (America/New_York)"],
      [7200, "2 hours after Due_Date (America/New_York)"],
      [-3600, "1 hour before Due_Date (America/New_York)"],
      [-10800, "3 hours before Due_Date (America/New_York)"],
    ])("formats hour offset %d as %s", (offsetSeconds, expected) => {
      expect(
        formatTiming({
          kind: "field_relative",
          field: "Due_Date",
          offsetSeconds,
          timezone: "America/New_York",
        }),
      ).toBe(expected);
    });

    it.each<[number, string]>([
      [1, "1 second(s) after Sched_Time (UTC)"],
      [30, "30 second(s) after Sched_Time (UTC)"],
      [-1, "1 second(s) before Sched_Time (UTC)"],
      [-15, "15 second(s) before Sched_Time (UTC)"],
    ])("formats seconds offset %d as %s", (offsetSeconds, expected) => {
      expect(
        formatTiming({
          kind: "field_relative",
          field: "Sched_Time",
          offsetSeconds,
          timezone: "UTC",
        }),
      ).toBe(expected);
    });
  });

  it("formats unknown timing with fallback", () => {
    expect(formatTiming({ kind: "unknown_timing" } as unknown as Timing)).toBe("Unknown timing");
  });
});

describe("formatActionKind", () => {
  it.each<[ActionKind | (string & {}), string]>([
    ["notification", "Email Notification"],
    ["activity", "Task / Activity"],
    ["field_update", "Field Update"],
    ["webhook", "Webhook"],
    ["function", "Custom Function"],
    ["record_create", "Create Record"],
    ["conversion", "Conversion"],
    ["unknown_action" as unknown as ActionKind, "unknown_action"],
  ])("formats %s as %s", (kind, expected) => {
    expect(formatActionKind(kind as ActionKind)).toBe(expected);
  });
});
