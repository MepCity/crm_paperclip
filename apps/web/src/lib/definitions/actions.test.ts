import {
  administratorPermissions,
  buildAccessSnapshot,
  standardPermissions,
} from "@crm/core/access";
import { ForbiddenError } from "@crm/core/errors";
import { beforeEach, expect, it, vi } from "vitest";
import { permissionAllows, type RoutePermission } from "@/lib/access/route-permission";
import {
  addOrganizationAddress,
  createAssignment,
  reportFields,
  runReport,
  saveReport,
} from "./actions";

const { requireContext, permission, ports, create, update, add, shell } = vi.hoisted(() => ({
  requireContext: vi.fn(),
  permission: vi.fn(),
  ports: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  add: vi.fn(),
  shell: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireOrgContext: requireContext }));
vi.mock("@/lib/access/action-guard", () => ({ requireActionPermission: permission }));
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
  permission.mockResolvedValue(undefined);
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
it("checks the profile permission of each action before touching persistence", async () => {
  permission.mockRejectedValue(new ForbiddenError(undefined, "permission_denied"));
  const denied = { ok: false, error: { code: "forbidden" } };
  expect(await saveReport("selected-org", input, { idempotencyKey: "retry" })).toEqual(denied);
  expect(
    await createAssignment(
      "selected-org",
      { module: "Leads", name: "Shell", description: "" },
      "k",
    ),
  ).toEqual(denied);
  expect(
    await addOrganizationAddress(
      "selected-org",
      { displayName: "S", address: "s@example.test" },
      "k",
    ),
  ).toEqual(denied);
  expect(await reportFields("selected-org", "Leads")).toEqual(denied);
  expect(await runReport("selected-org", input)).toEqual(denied);
  expect(ports).not.toHaveBeenCalled();
  expect(permission.mock.calls.map(([, declared]) => declared)).toEqual([
    { feature: "reports", action: "manage" },
    { admin: "manageAutomation" },
    { admin: "emailSettings" },
    { feature: "reports", action: "manage" },
    {
      allOf: [
        { feature: "reports", action: "view" },
        { module: "Leads", action: "view" },
      ],
    },
  ]);
});
it("runs a report only on a module the caller's profile can view (MEP-1516)", async () => {
  await runReport("selected-org", { ...input, module: "DealHistory" }).catch(() => undefined);
  const declared = permission.mock.calls.at(-1)?.[1] as RoutePermission;
  const permissions = standardPermissions();
  permissions.modules.Deals = { view: false, create: false, edit: false, delete: false };
  const snapshot = (kind: "standard" | "administrator") =>
    buildAccessSnapshot({
      orgId: "o",
      userId: "u",
      version: 1,
      profile: {
        id: "p",
        kind,
        permissions: kind === "administrator" ? administratorPermissions() : permissions,
      },
      fieldRows: [],
      roles: [{ id: "r", name: "CEO", parentRoleId: null, shareWithPeers: false }],
      members: [{ userId: "u", roleId: "r", profileId: "p" }],
      groupMembers: [],
      defaults: [],
      rules: [],
    });
  // A module outside the catalogue (DealHistory) is never reachable for a non-administrator.
  expect(permissionAllows(snapshot("standard"), declared)).toBe(false);
  expect(permissionAllows(snapshot("administrator"), declared)).toBe(true);
  const deals = {
    allOf: [
      { feature: "reports", action: "view" },
      { module: "Deals", action: "view" },
    ],
  } as const;
  expect(permissionAllows(snapshot("standard"), deals)).toBe(false);
  expect(
    permissionAllows(snapshot("standard"), {
      ...deals,
      allOf: [deals.allOf[0], { module: "Leads", action: "view" }],
    }),
  ).toBe(true);
  // A non-string module from a direct server-action call is denied, not treated as a wildcard.
  permission.mockClear();
  await runReport("selected-org", { ...input, module: 42 as unknown as string }).catch(
    () => undefined,
  );
  const odd = permission.mock.calls.at(-1)?.[1] as RoutePermission;
  expect(permissionAllows(snapshot("standard"), odd)).toBe(false);
});
it("does not swallow non-permission failures of the profile gate", async () => {
  permission.mockRejectedValue(new Error("snapshot unavailable"));
  await expect(saveReport("selected-org", input, { idempotencyKey: "retry" })).rejects.toThrow(
    "snapshot unavailable",
  );
});
