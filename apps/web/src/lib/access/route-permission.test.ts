import { describe, expect, it } from "vitest";
import { enforceRoutePermission } from "./route-permission";

const deny = (): never => {
  throw new Error("denied");
};

describe("enforceRoutePermission", () => {
  it("lets exempt declarations through without a gate", () => {
    expect(() => enforceRoutePermission({ public: "health" }, undefined, deny)).not.toThrow();
    expect(() => enforceRoutePermission({ memberOnly: "chat" }, undefined, deny)).not.toThrow();
  });
  it("denies a profile declaration when the gate is missing or refuses", () => {
    const p = { module: "Leads", action: "view" } as const;
    expect(() => enforceRoutePermission(p, undefined, deny)).toThrow("denied");
    expect(() => enforceRoutePermission(p, () => false, deny)).toThrow("denied");
    expect(() => enforceRoutePermission(p, () => true, deny)).not.toThrow();
  });
});
