import { afterEach, expect, it, vi } from "vitest";

const { createDb, tenant, end, repository } = vi.hoisted(() => ({
  createDb: vi.fn(),
  tenant: vi.fn(),
  end: vi.fn(),
  repository: vi.fn(),
}));
vi.mock("@crm/db", () => ({ createDb }));
vi.mock("@crm/db/tenancy", () => ({ createTenantDatabase: tenant }));
vi.mock("@crm/db/definitions", () => ({ createPostgresDefinitionRepository: repository }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.resetAllMocks();
});
it("does not fall back to the identity connection when CRM persistence is missing", async () => {
  vi.stubEnv("CRM_DATABASE_URL", "");
  vi.stubEnv("DATABASE_URL", "postgres://owner@localhost/identity");
  const { getPersistentDefinitionPorts } = await import("./runtime");
  await expect(getPersistentDefinitionPorts()).rejects.toThrow("unavailable");
  expect(createDb).not.toHaveBeenCalled();
});
it("rejects unsafe runtime catalogs, closes the failed pool and retries only after configuration is usable", async () => {
  vi.stubEnv("CRM_DATABASE_URL", "postgres://crm_app@localhost/runtime");
  createDb.mockReturnValue({ $client: { end } });
  tenant.mockRejectedValueOnce(new Error("Unsafe runtime"));
  const { getPersistentDefinitionPorts } = await import("./runtime");
  await expect(getPersistentDefinitionPorts()).rejects.toThrow("Unsafe runtime");
  expect(end).toHaveBeenCalledTimes(1);
  tenant.mockResolvedValue({ withOrg: vi.fn() });
  repository.mockReturnValue({ list: vi.fn(async () => []) });
  const ports = await getPersistentDefinitionPorts();
  const ctx = {
    orgId: "org",
    orgSlug: "sample",
    orgName: "Sample",
    userId: "member",
    role: "member" as const,
  };
  expect(
    await ports.reports.create(
      ctx,
      {
        name: "Forbidden",
        description: "",
        module: "Leads",
        columns: ["Last_Name"],
        criteria: null,
        grouping: null,
      },
      { idempotencyKey: "retry" },
    ),
  ).toEqual({ ok: false, error: { code: "forbidden" } });
  expect(createDb).toHaveBeenCalledTimes(2);
  expect(createDb).toHaveBeenLastCalledWith("postgres://crm_app@localhost/runtime");
});
