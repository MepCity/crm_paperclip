"use server";

import type { AssignmentRule } from "@crm/core/automation";
import type {
  DefinitionResult,
  OrganizationAddress,
  ReportDefinition,
  ReportInput,
} from "@crm/core/definitions";
import { ForbiddenError } from "@crm/core/errors";
import { requireActionPermission } from "@/lib/access/action-guard";
import { requireOrgContext } from "@/lib/session";
import { definitionMetadata, definitionPorts } from "./ports";

const forbidden = { ok: false, error: { code: "forbidden" } } as const;

/** Profile gate (ADR 0017 §7.1): `false` when the profile refuses the declaration. */
async function passes(check: Promise<void>): Promise<boolean> {
  try {
    await check;
    return true;
  } catch (error) {
    if (error instanceof ForbiddenError) return false;
    throw error;
  }
}

export async function saveReport(
  orgSlug: string,
  input: ReportInput,
  options: { idempotencyKey: string } | { id: string; expectedRevision: number },
): Promise<DefinitionResult<ReportDefinition>> {
  const ctx = await requireOrgContext(orgSlug);
  if (!(await passes(requireActionPermission(ctx, { feature: "reports", action: "manage" }))))
    return forbidden;
  try {
    const { reports } = await definitionPorts();
    return "id" in options
      ? reports.update(
          ctx,
          { ...input, id: options.id },
          { expectedRevision: options.expectedRevision },
        )
      : reports.create(ctx, input, options);
  } catch {
    return { ok: false, error: { code: "unavailable" } };
  }
}

export async function createAssignment(
  orgSlug: string,
  input: { module: string; name: string; description: string },
  idempotencyKey: string,
): Promise<DefinitionResult<AssignmentRule>> {
  const ctx = await requireOrgContext(orgSlug);
  if (!(await passes(requireActionPermission(ctx, { admin: "manageAutomation" }))))
    return forbidden;
  try {
    return (await definitionPorts()).automation.createAssignmentShell(ctx, input, {
      idempotencyKey,
    });
  } catch {
    return { ok: false, error: { code: "unavailable" } };
  }
}

export async function addOrganizationAddress(
  orgSlug: string,
  input: { displayName: string; address: string },
  idempotencyKey: string,
): Promise<DefinitionResult<OrganizationAddress>> {
  const ctx = await requireOrgContext(orgSlug);
  if (!(await passes(requireActionPermission(ctx, { admin: "emailSettings" })))) return forbidden;
  try {
    return (await definitionPorts()).organizationAddresses.add(ctx, input, {
      idempotencyKey,
    });
  } catch {
    return { ok: false, error: { code: "unavailable" } };
  }
}

export async function reportFields(orgSlug: string, module: string) {
  const ctx = await requireOrgContext(orgSlug);
  if (!(await passes(requireActionPermission(ctx, { feature: "reports", action: "manage" }))))
    return forbidden;
  try {
    const { getRecordService } = await import("@/lib/records");
    return { ok: true as const, value: (await getRecordService(ctx).getModule(module)).fields };
  } catch {
    return { ok: false as const, error: { code: "unavailable" as const } };
  }
}

export async function runReport(
  orgSlug: string,
  input: ReportInput,
): Promise<DefinitionResult<import("@/modules/reports/port").ReportDetail>> {
  const ctx = await requireOrgContext(orgSlug);
  if (!(await passes(requireActionPermission(ctx, { feature: "reports", action: "view" }))))
    return forbidden;
  try {
    const { validateReportDefinition } = await import("@crm/core/definitions");
    const { getRecordService } = await import("@/lib/records");
    const { executeReport } = await import("@/modules/reports/record-port");
    const validated = await validateReportDefinition(definitionMetadata(), ctx, input);
    return { ok: true as const, value: await executeReport(getRecordService(ctx), validated) };
  } catch (error) {
    const code =
      error && typeof error === "object" && "definitionCode" in error ? error.definitionCode : null;
    return { ok: false, error: { code: code === "validation" ? "validation" : "unavailable" } };
  }
}
