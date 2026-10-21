import { ValidationError } from "@crm/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ctx = { userId: "user-1", organizationId: "org-1" };
const members = [{ userId: "user-1", name: "Ada" }];
const records = { tag: "records" };

vi.mock("@crm/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@crm/core")>()),
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
  requireOrgContext: vi.fn(async () => ctx),
  listMembers: vi.fn(async () => members),
}));
vi.mock("@/lib/records", () => ({ getRecordService: vi.fn(() => records) }));

import { getSession } from "@crm/core";
import { getRecordService } from "@/lib/records";
import { operationRoute } from "./operation-route";
import { type Operation, operations } from "./wire/operations";

const origin = "http://crm.test";

vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/db");
vi.stubEnv("APP_URL", origin);
vi.stubEnv("APP_SECRET", "x".repeat(40));

function post(headers: Record<string, string> = { "X-CRM-ORG": "acme", Origin: origin }) {
  return new Request(`${origin}/crm/v2.2/Leads/actions/count`, { method: "POST", headers });
}

describe("operationRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs the operation with scoped services and returns its body as 200 JSON", async () => {
    const run = vi.fn(async () => ({ body: { count: 3 } }));
    const response = await operationRoute({ run } as unknown as Operation)(post(), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ count: 3 });
    const [services, input] = run.mock.calls[0] as unknown as [
      { records: unknown; members: () => Promise<unknown> },
      { ctx: unknown },
    ];
    expect(services.records).toBe(records);
    expect(await services.members()).toEqual(members);
    expect(input.ctx).toBe(ctx);
  });

  it.each(["documents", "Documents", "DOCUMENTS"])(
    "rejects %s before creating record services",
    async (module) => {
      const run = vi.fn();
      const response = await operationRoute({ run } as unknown as Operation)(post(), {
        params: Promise.resolve({ module }),
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ code: "not_found", status: "error" });
      expect(getRecordService).not.toHaveBeenCalled();
      expect(run).not.toHaveBeenCalled();
    },
  );

  it("maps an AppError thrown by the operation to its error body", async () => {
    const run = vi.fn(async () => {
      throw new ValidationError({ name: ["Required"] });
    });
    const response = await operationRoute({ run } as unknown as Operation)(post(), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.status).toBe("error");
    expect(Object.keys(body).sort()).toEqual(["code", "details", "message", "status"]);
  });

  it.each([
    ["fourth row", Array(4).fill({ module: "Calls", presence: "with", criteria: [] })],
    [
      "sixth child criterion",
      [
        {
          module: "Calls",
          presence: "with",
          criteria: Array(6).fill({ field: "Subject", comparator: "equal", value: "x" }),
        },
      ],
    ],
  ])("answers a %s with the existing HTTP 400 error shape", async (_label, relatedModules) => {
    const request = new Request(`${origin}/crm/v2.2/Cases/actions/count?cvid=all-cases`, {
      method: "POST",
      headers: { "X-CRM-ORG": "acme", Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ related_modules: relatedModules }),
    });
    const response = await operationRoute(operations.count)(request, {
      params: Promise.resolve({ module: "Cases" }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.status).toBe("error");
    expect(Object.keys(body).sort()).toEqual(["code", "details", "message", "status"]);
    expect(body.details.fields.relatedModules).toEqual([expect.any(String)]);
  });

  it("rejects a missing organization header before running the operation", async () => {
    const run = vi.fn();
    const response = await operationRoute({ run } as unknown as Operation)(
      post({ Origin: origin }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(400);
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request with 401", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const run = vi.fn();
    const response = await operationRoute({ run } as unknown as Operation)(post(), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });
});
