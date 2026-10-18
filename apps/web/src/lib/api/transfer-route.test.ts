import { beforeEach, describe, expect, it, vi } from "vitest";

const ctx = { userId: "user-1", organizationId: "org-1" };
const service = { tag: "transfer" };
let members = [{ userId: "user-1", name: "Ada" }];
let options: {
  authorize: (c: typeof ctx) => Promise<void>;
  listActors: (c: typeof ctx) => Promise<unknown>;
};
const createTransferService = vi.fn((opts: typeof options) => {
  options = opts;
  return service;
});

vi.mock("@crm/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@crm/core")>()),
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
  requireOrgContext: vi.fn(async () => ctx),
  listMembers: vi.fn(async () => members),
  createTransferService: (opts: typeof options) => createTransferService(opts),
}));
vi.mock("@/lib/records", () => ({ getRecordService: vi.fn() }));

import { ForbiddenError, ValidationError } from "@crm/core/errors";
import { getTransferService, transferRoute } from "./transfer-route";
import type { TransferOperation } from "./wire/transfer";

const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;
const global = globalThis as { __crmTransferService?: unknown };

function get(url: string, headers: Record<string, string> = {}) {
  return new Request(`${origin}${url}`, { method: "GET", headers });
}

describe("getTransferService", () => {
  beforeEach(() => {
    delete global.__crmTransferService;
    createTransferService.mockClear();
    members = [{ userId: "user-1", name: "Ada" }];
  });

  it("creates the service once and reuses it", () => {
    expect(getTransferService()).toBe(service);
    expect(getTransferService()).toBe(service);
    expect(createTransferService).toHaveBeenCalledTimes(1);
  });

  it("authorizes members and rejects non-members with ForbiddenError", async () => {
    getTransferService();
    await expect(options.authorize(ctx)).resolves.toBeUndefined();
    members = [{ userId: "other", name: "Bob" }];
    await expect(options.authorize(ctx)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lists actors as id and name", async () => {
    getTransferService();
    expect(await options.listActors(ctx)).toEqual([{ id: "user-1", name: "Ada" }]);
  });
});

describe("transferRoute", () => {
  beforeEach(() => {
    delete global.__crmTransferService;
    members = [{ userId: "user-1", name: "Ada" }];
  });

  it("runs the operation with the transfer service and returns 200 JSON", async () => {
    const run = vi.fn(async () => ({ ok: true }));
    const response = await transferRoute({ run } as unknown as TransferOperation)(
      get("/x", { "X-CRM-ORG": "acme" }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect((run.mock.calls[0] as unknown[])[0]).toBe(service);
  });

  it("maps an AppError from the operation to its error status", async () => {
    const run = vi.fn(async () => {
      throw new ValidationError({ file: ["Invalid"] });
    });
    const response = await transferRoute({ run } as unknown as TransferOperation)(
      get("/x", { "X-CRM-ORG": "acme" }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).status).toBe("error");
  });

  it("requires the org header unless orgFromQuery is set", async () => {
    const run = vi.fn(async () => ({ ok: true }));
    const route = transferRoute({ run } as unknown as TransferOperation);
    expect((await route(get("/x?org=acme"), { params: Promise.resolve({}) })).status).toBe(400);
    const viaQuery = transferRoute({ run } as unknown as TransferOperation, {
      orgFromQuery: true,
    });
    expect((await viaQuery(get("/x?org=acme"), { params: Promise.resolve({}) })).status).toBe(200);
  });
});
