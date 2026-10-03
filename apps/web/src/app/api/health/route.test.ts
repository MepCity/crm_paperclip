import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ outcome: "ok" as "ok" | "down" }));

vi.mock("@crm/core", () => ({
  checkHealth: async () => {
    if (state.outcome === "down") throw new Error("ECONNREFUSED");
    return { status: "ok", postgresVersion: "18.4", postgresMajor: 18 };
  },
}));

const { GET } = await import("./route");

describe("GET /api/health", () => {
  beforeEach(() => {
    state.outcome = "ok";
  });

  it("returns 200 and ok when the database answers", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("returns 503 when the database is unreachable", async () => {
    state.outcome = "down";
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });
});
