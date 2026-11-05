import { describe, expect, it } from "vitest";
import { matchesCondition } from "./criteria";
import { createProcessSchema } from "./types";

const fields = {
  Amount: 2000000,
  Stage: "Negotiation",
  Account_Name: { id: "9", name: "Acme" },
  Note: null,
};

describe("approval criteria", () => {
  it("matches all records and comparators", () => {
    expect(matchesCondition(fields, { kind: "all_records" })).toBe(true);
    const crit = (field: string, comparator: never, value: never) =>
      matchesCondition(fields, { kind: "criteria", criteria: { field, comparator, value } });
    expect(crit("Amount", "greater_than" as never, 1000000 as never)).toBe(true);
    expect(crit("Amount", "less_than" as never, 1000000 as never)).toBe(false);
    expect(crit("Stage", "equal" as never, "negotiation" as never)).toBe(true);
    expect(crit("Stage", "starts_with" as never, "Neg" as never)).toBe(true);
    expect(crit("Account_Name", "equal" as never, "9" as never)).toBe(true);
    expect(crit("Note", "is_empty" as never, null as never)).toBe(true);
    expect(crit("Amount", "between" as never, [1, 3000000] as never)).toBe(true);
  });

  it("combines groups with and/or", () => {
    const group = (groupOperator: "and" | "or") =>
      matchesCondition(fields, {
        kind: "criteria",
        criteria: {
          groupOperator,
          group: [
            { field: "Stage", comparator: "equal", value: "Won" },
            { field: "Amount", comparator: "greater_than", value: 1 },
          ],
        },
      });
    expect(group("and")).toBe(false);
    expect(group("or")).toBe(true);
  });

  it("never matches date tokens, which the engine does not evaluate", () => {
    expect(
      matchesCondition(fields, {
        kind: "criteria",
        criteria: {
          field: "Amount",
          comparator: "equal",
          value: { token: "PERIOD", name: "today" } as never,
        },
      }),
    ).toBe(false);
  });
});

describe("process schema", () => {
  const base = {
    name: "P",
    module: "Deals",
    trigger: "create" as const,
    steps: [
      { name: "S", approvers: { kind: "users" as const, refs: ["u"] }, rule: "any" as const },
    ],
  };
  it("accepts one to five steps and defaults the rest", () => {
    const parsed = createProcessSchema.parse(base);
    expect(parsed.criteria).toEqual({ kind: "all_records" });
    expect(parsed.onApprove).toEqual([]);
    expect(createProcessSchema.safeParse({ ...base, steps: [] }).success).toBe(false);
    expect(
      createProcessSchema.safeParse({ ...base, steps: Array(6).fill(base.steps[0]) }).success,
    ).toBe(false);
  });
  it("requires approvers unless the owner's manager is chosen", () => {
    const step = (kind: "users" | "record_owner_manager", refs: string[]) => ({
      ...base,
      steps: [{ name: "S", approvers: { kind, refs }, rule: "all" as const }],
    });
    expect(createProcessSchema.safeParse(step("users", [])).success).toBe(false);
    expect(createProcessSchema.safeParse(step("record_owner_manager", [])).success).toBe(true);
  });
  it("only allows field updates as on-approve actions", () => {
    expect(
      createProcessSchema.safeParse({
        ...base,
        onApprove: [{ kind: "webhook", field: "Stage", value: "x" }],
      }).success,
    ).toBe(false);
  });
});
