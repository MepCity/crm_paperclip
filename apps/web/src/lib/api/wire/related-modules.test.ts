import { describe, expect, it } from "vitest";
import { decodeRelatedModules, encodeRelatedModules } from "./codec";

describe("related-module wire codec", () => {
  const row = {
    module: "Calls" as const,
    presence: "without" as const,
    criteria: [{ field: "Subject", comparator: "equal" as const, value: "x" }],
  };
  it("round-trips", () => {
    expect(decodeRelatedModules(encodeRelatedModules([row]))).toEqual([row]);
  });
  it("rejects bad shapes and limits", () => {
    expect(() => decodeRelatedModules([{ ...row, module: "Emails" }])).toThrow();
    expect(() => decodeRelatedModules(Array(4).fill(encodeRelatedModules([row])[0]))).toThrow();
    const wire = encodeRelatedModules([row])[0] as ReturnType<typeof encodeRelatedModules>[number];
    expect(() =>
      decodeRelatedModules([{ ...wire, criteria: Array(6).fill(wire.criteria[0]) }]),
    ).toThrow();
  });
});
