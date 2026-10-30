import { beforeEach, expect, it, vi } from "vitest";
import { addOrganizationAddress, createAssignment, saveReport } from "./actions";

const { requireContext, ports, create, update, add, shell } = vi.hoisted(() => ({
  requireContext: vi.fn(),
  ports: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  add: vi.fn(),
  shell: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireOrgContext: requireContext }));
vi.mock("./ports", () => ({ definitionPorts: ports, definitionMetadata: vi.fn() }));
const ctx = { orgId: "server-tenant", userId: "server-actor", role: "admin" };
const input = {
  module: "Leads",
  name: "Review",
  description: "",
  columns: ["Last_Name"],
  criteria: null,
  grouping: null,
} as const;
beforeEach(() => {
  vi.clearAllMocks();
  requireContext.mockResolvedValue(ctx);
  ports.mockResolvedValue({
    reports: { create, update },
    organizationAddresses: { add },
    automation: { createAssignmentShell: shell },
  });
  for (const fn of [create, update, add, shell])
    fn.mockResolvedValue({ ok: true, value: { id: "saved" } });
});
it("resolves the session tenant for each write and retains idempotency / CAS options", async () => {
  await saveReport("selected-org", input, { idempotencyKey: "retry" });
  expect(requireContext).toHaveBeenCalledWith("selected-org");
  expect(create).toHaveBeenCalledWith(ctx, input, { idempotencyKey: "retry" });
  await saveReport("selected-org", input, { id: "existing", expectedRevision: 7 });
  expect(update).toHaveBeenCalledWith(ctx, { ...input, id: "existing" }, { expectedRevision: 7 });
  const address = { displayName: "Support", address: "support@example.test" };
  await addOrganizationAddress("selected-org", address, "address-retry");
  expect(add).toHaveBeenCalledWith(ctx, address, { idempotencyKey: "address-retry" });
  const assignment = { module: "Leads", name: "Shell", description: "" };
  await createAssignment("selected-org", assignment, "shell-retry");
  expect(shell).toHaveBeenCalledWith(ctx, assignment, { idempotencyKey: "shell-retry" });
});
it("fails closed on unavailable persistence and preserves typed authorization failures", async () => {
  ports.mockRejectedValue(new Error("private database details"));
  expect(await saveReport("selected-org", input, { idempotencyKey: "retry" })).toEqual({
    ok: false,
    error: { code: "unavailable" },
  });
  ports.mockResolvedValue({ organizationAddresses: { add } });
  add.mockResolvedValue({ ok: false, error: { code: "forbidden" } });
  expect(
    await addOrganizationAddress(
      "selected-org",
      { displayName: "Support", address: "support@example.test" },
      "retry",
    ),
  ).toEqual({ ok: false, error: { code: "forbidden" } });
});
it("does not access persistence when membership authentication fails", async () => {
  requireContext.mockRejectedValue(new Error("Unauthenticated"));
  await expect(
    createAssignment("foreign-org", { module: "Leads", name: "Shell", description: "" }, "retry"),
  ).rejects.toThrow("Unauthenticated");
  expect(ports).not.toHaveBeenCalled();
});
