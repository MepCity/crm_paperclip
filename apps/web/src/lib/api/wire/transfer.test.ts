import type { OrgContext, TransferService } from "@crm/core";
import { describe, expect, it, vi } from "vitest";
import { TRANSFER_MODULES, type TransferInput, transferOperations, transferPath } from "./transfer";

const ctx = { orgId: "o" } as OrgContext;
const service = {
  runImport: vi.fn(async (..._args: unknown[]) => ({ ok: true })),
  runExport: vi.fn(async (..._args: unknown[]) => ({ ok: true })),
} as unknown as TransferService;
const input = (params: Record<string, string>, body?: unknown): TransferInput => ({
  ctx,
  params,
  query: {},
  request: new Request("https://example.test/x", {
    method: "POST",
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  }),
});
const settings = {
  mode: "add",
  ignoreEmptyOnUpdate: false,
  mapping: [{ column: 0, field: "Last_Name" }],
  defaults: [],
};

describe("transferPath", () => {
  it("substitutes and encodes params", () => {
    expect(transferPath("/a/{module}/b/{id}", { module: "Leads", id: "x/y" })).toBe(
      "/a/Leads/b/x%2Fy",
    );
    expect(transferPath("/a/{id}")).toBe("/a/");
  });
});

describe("transferOperations", () => {
  it("declares methods and paths", () => {
    expect(transferOperations.runImport.method).toBe("POST");
    expect(transferOperations.sampleCsv.method).toBe("GET");
    expect(transferOperations.getImport.path).toBe("/crm/v9/settings/imports/{importId}");
    expect(TRANSFER_MODULES).toEqual(["Leads", "Contacts", "Accounts", "Deals"]);
  });
  it("rejects an unknown module", async () => {
    await expect(
      transferOperations.runImport.run(service, input({ module: "Nope" }, {})),
    ).rejects.toMatchObject({ fieldErrors: { module: expect.anything() } });
  });
  it("accepts a valid import request", async () => {
    await transferOperations.runImport.run(
      service,
      input({ module: "Leads" }, { uploadId: "u1", settings }),
    );
    expect(service.runImport).toHaveBeenCalledWith(ctx, "Leads", "u1", settings);
  });
  it("rejects missing body, bad JSON and bad field types", async () => {
    const run = (body?: unknown) =>
      transferOperations.runImport.run(service, input({ module: "Leads" }, body));
    await expect(run()).rejects.toMatchObject({ fieldErrors: { data: expect.anything() } });
    await expect(run("{oops")).rejects.toMatchObject({ fieldErrors: { data: expect.anything() } });
    await expect(run({ settings })).rejects.toMatchObject({
      fieldErrors: { uploadId: expect.anything() },
    });
    await expect(run({ uploadId: 5, settings })).rejects.toMatchObject({
      fieldErrors: { uploadId: expect.anything() },
    });
    await expect(
      run({ uploadId: "u", settings: { ...settings, mode: "x" } }),
    ).rejects.toMatchObject({
      fieldErrors: { mode: expect.anything() },
    });
    await expect(
      run({ uploadId: "u", settings: { ...settings, ignoreEmptyOnUpdate: "no" } }),
    ).rejects.toMatchObject({ fieldErrors: { ignoreEmptyOnUpdate: expect.anything() } });
    await expect(
      run({ uploadId: "u", settings: { ...settings, mapping: [{ column: -1, field: null }] } }),
    ).rejects.toMatchObject({ fieldErrors: { mapping: expect.anything() } });
  });
  it("decodes export field selections", async () => {
    const run = (body: unknown) =>
      transferOperations.runExport.run(service, input({ module: "Leads" }, body));
    await run({ fields: "all" });
    await run({ fields: { include: ["Email"] }, ids: ["1"] });
    expect(service.runExport).toHaveBeenLastCalledWith(ctx, {
      module: "Leads",
      ids: ["1"],
      fields: { include: ["Email"] },
    });
    await expect(run({ fields: { include: [], exclude: [] } })).rejects.toMatchObject({
      fieldErrors: { fields: expect.anything() },
    });
    await expect(run({ fields: "all", ids: [1] })).rejects.toMatchObject({
      fieldErrors: { ids: expect.anything() },
    });
  });
});
