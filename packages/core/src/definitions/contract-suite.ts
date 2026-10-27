import { describe, expect, it } from "vitest";
import type { OrgContext } from "../tenancy/types";
import { createDefinitionPorts } from "./service";
import type { DefinitionDependencies, DefinitionResult, ReportInput } from "./types";

export const context: OrgContext = {
  orgId: "00000000-0000-7000-8000-000000000001",
  orgSlug: "synthetic",
  orgName: "Synthetic",
  userId: "synthetic-admin",
  role: "admin",
};
export const otherContext = { ...context, orgId: "00000000-0000-7000-8000-000000000002" };
export function unwrap<T>(result: DefinitionResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}
export const reportInput: ReportInput = {
  name: "Synthetic report",
  description: "Configuration only",
  module: "Leads",
  columns: ["Last_Name"],
  criteria: null,
  grouping: null,
};
export function definitionContract(label: string, setup: () => Promise<DefinitionDependencies>) {
  describe(label, () => {
    it("creates, retries and reads the same tenant rows for all three families", async () => {
      const ports = createDefinitionPorts(await setup());
      const r = unwrap(
        await ports.reports.create(context, reportInput, { idempotencyKey: "report" }),
      );
      expect(
        unwrap(await ports.reports.create(context, reportInput, { idempotencyKey: "report" })),
      ).toEqual(r);
      expect(unwrap(await ports.reports.get(context, r.id))).toEqual(r);
      expect(unwrap(await ports.reports.list(context))).toContainEqual(r);
      const a = unwrap(
        await ports.automation.createAssignmentShell(context, reportInputAsShell(), {
          idempotencyKey: "assignment",
        }),
      );
      expect(a).toMatchObject({ enabled: false, entries: [], fallback: null, revision: "1" });
      expect(
        unwrap(
          await ports.automation.createAssignmentShell(context, reportInputAsShell(), {
            idempotencyKey: "assignment",
          }),
        ),
      ).toEqual(a);
      expect(await ports.automation.get(context, { kind: "assignment", id: a.id })).toEqual({
        ok: true,
        value: a,
      });
      expect(await ports.automation.list(context, { kind: "assignment", limit: 10 })).toMatchObject(
        { ok: true, value: { items: [a] } },
      );
      const input = { displayName: "Synthetic sender", address: "SENDER@EXAMPLE.TEST" };
      const mail = unwrap(
        await ports.organizationAddresses.add(context, input, { idempotencyKey: "address" }),
      );
      expect(mail).toMatchObject({ address: "sender@example.test", status: "unverified" });
      expect(
        unwrap(
          await ports.organizationAddresses.add(context, input, { idempotencyKey: "address" }),
        ),
      ).toEqual(mail);
      expect(unwrap(await ports.organizationAddresses.list(context))).toContainEqual(mail);
      for (const c of [otherContext]) {
        expect(await ports.reports.get(c, r.id)).toEqual({
          ok: false,
          error: { code: "not_found" },
        });
        expect(
          await ports.reports.update(c, { ...reportInput, id: r.id }, { expectedRevision: 1 }),
        ).toEqual({ ok: false, error: { code: "not_found" } });
        expect(await ports.automation.get(c, { kind: "assignment", id: a.id })).toEqual({
          ok: false,
          error: { code: "not_found" },
        });
        expect(unwrap(await ports.organizationAddresses.list(c))).toEqual([]);
        expect(
          unwrap(await ports.reports.create(c, reportInput, { idempotencyKey: "report" })).id,
        ).not.toBe(r.id);
      }
    });
    it("enforces tenant-scoped names, address normalization and revision CAS", async () => {
      const p = createDefinitionPorts(await setup());
      const input = { ...reportInput, name: "Unique report" };
      const r = unwrap(await p.reports.create(context, input, { idempotencyKey: "unique-r" }));
      expect(
        await p.reports.create(
          context,
          { ...input, name: input.name.toUpperCase() },
          { idempotencyKey: "duplicate-r" },
        ),
      ).toEqual({ ok: false, error: { code: "conflict" } });
      const next = unwrap(
        await p.reports.update(
          context,
          { ...input, id: r.id, name: "Renamed" },
          { expectedRevision: 1 },
        ),
      );
      expect(next).toMatchObject({
        revision: 2,
        createdBy: context.userId,
        updatedBy: context.userId,
      });
      expect(
        await p.reports.update(context, { ...input, id: r.id }, { expectedRevision: 1 }),
      ).toEqual({ ok: false, error: { code: "conflict" } });
      const assignment = { ...reportInputAsShell(), name: "Unique assignment" };
      unwrap(
        await p.automation.createAssignmentShell(context, assignment, {
          idempotencyKey: "unique-a",
        }),
      );
      expect(
        await p.automation.createAssignmentShell(
          context,
          { ...assignment, name: assignment.name.toUpperCase() },
          { idempotencyKey: "duplicate-a" },
        ),
      ).toEqual({ ok: false, error: { code: "conflict" } });
      unwrap(
        await p.organizationAddresses.add(
          context,
          { displayName: "Unique", address: "UNIQUE@example.test" },
          { idempotencyKey: "unique-mail" },
        ),
      );
      expect(
        await p.organizationAddresses.add(
          context,
          { displayName: "Duplicate", address: "unique@example.test" },
          { idempotencyKey: "duplicate-mail" },
        ),
      ).toEqual({ ok: false, error: { code: "conflict" } });
    });
    it("returns the original create after metadata changes and rejects unauthorized retries", async () => {
      const deps = await setup();
      const p = createDefinitionPorts(deps);
      const original = unwrap(
        await p.reports.create(context, reportInput, { idempotencyKey: "retry" }),
      );
      const unavailable = createDefinitionPorts({
        ...deps,
        customization: {
          readEffective: async () => {
            throw new Error("metadata unavailable");
          },
        },
      });
      expect(
        unwrap(await unavailable.reports.create(context, reportInput, { idempotencyKey: "retry" })),
      ).toEqual(original);
      expect(
        await unavailable.reports.create({ ...context, role: "member" }, reportInput, {
          idempotencyKey: "retry",
        }),
      ).toEqual({ ok: false, error: { code: "forbidden" } });
    });
    it("paginates assignments with an actor, module and tenant scoped cursor", async () => {
      const p = createDefinitionPorts(await setup());
      for (let i = 0; i < 3; i++)
        unwrap(
          await p.automation.createAssignmentShell(
            context,
            { module: "Leads", name: `Paged ${i}`, description: "" },
            { idempotencyKey: `page-${i}` },
          ),
        );
      const first = await p.automation.list(context, {
        kind: "assignment",
        module: "Leads",
        limit: 2,
      });
      if (!first.ok || !first.value.nextCursor) throw new Error("Missing next cursor");
      const second = await p.automation.list(context, {
        kind: "assignment",
        module: "Leads",
        limit: 2,
        cursor: first.value.nextCursor,
      });
      expect(second).toMatchObject({
        ok: true,
        value: { items: expect.any(Array), nextCursor: null },
      });
      if (!second.ok) throw new Error("Missing second page");
      expect([...first.value.items, ...second.value.items]).toHaveLength(3);
      expect(new Set([...first.value.items, ...second.value.items].map((r) => r.id)).size).toBe(3);
      for (const ctx of [otherContext, { ...context, userId: "other-user" }])
        expect(
          await p.automation.list(ctx, {
            kind: "assignment",
            module: "Leads",
            limit: 2,
            cursor: first.value.nextCursor,
          }),
        ).toEqual({ ok: false, error: { code: "invalid_query" } });
      expect(
        await p.automation.list(context, {
          kind: "assignment",
          module: "Contacts",
          limit: 2,
          cursor: first.value.nextCursor,
        }),
      ).toEqual({ ok: false, error: { code: "invalid_query" } });
    });
    it("denies members and only permits the report-manage capability for reports", async () => {
      const deps = await setup();
      const p = createDefinitionPorts(deps);
      const member = { ...context, role: "member" as const };
      expect(await p.reports.create(member, reportInput, { idempotencyKey: "denied" })).toEqual({
        ok: false,
        error: { code: "forbidden" },
      });
      expect(
        await p.automation.createAssignmentShell(member, reportInputAsShell(), {
          idempotencyKey: "denied",
        }),
      ).toEqual({ ok: false, error: { code: "forbidden" } });
      expect(
        await p.organizationAddresses.add(
          member,
          { displayName: "Denied", address: "deny@example.test" },
          { idempotencyKey: "denied" },
        ),
      ).toEqual({ ok: false, error: { code: "forbidden" } });
      expect(await p.organizationAddresses.list(member)).toEqual({
        ok: false,
        error: { code: "forbidden" },
      });
      const permitted = createDefinitionPorts({ ...deps, canManageReports: async () => true });
      unwrap(
        await permitted.reports.create(
          member,
          { ...reportInput, name: "Managed report" },
          { idempotencyKey: "managed" },
        ),
      );
    });
    it("rejects unknown fields, wrong criteria types, grouping and aggregate payloads", async () => {
      const p = createDefinitionPorts(await setup());
      const inputs = [
        { ...reportInput, columns: ["Unknown_Field"] },
        { ...reportInput, columns: ["Last_Name", "Last_Name"] },
        { ...reportInput, criteria: { field: "Last_Name", comparator: "equal", value: 12 } },
        { ...reportInput, criteria: { field: "Unknown_Field", comparator: "equal", value: "x" } },
        { ...reportInput, criteria: { field: "Last_Name", comparator: "arbitrary", value: "x" } },
        { ...reportInput, criteria: { groupOperator: "and", group: [null] } },
        { ...reportInput, grouping: ["Last_Name"] },
        { ...reportInput, aggregates: ["count"] },
      ];
      for (const input of inputs)
        expect(
          await p.reports.create(context, input as ReportInput, { idempotencyKey: "invalid" }),
        ).toEqual({ ok: false, error: { code: "validation" } });
      unwrap(
        await p.reports.create(
          context,
          {
            ...reportInput,
            name: "Typed report",
            criteria: { field: "Last_Name", comparator: "contains", value: "Synthetic" },
          },
          { idempotencyKey: "typed" },
        ),
      );
    });
  });
}
function reportInputAsShell() {
  return { module: "Leads", name: "Synthetic assignment", description: "Inactive shell" };
}
