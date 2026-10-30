"use server";

import type { AssignmentRule } from "@crm/core/automation";
import type {
  DefinitionResult,
  OrganizationAddress,
  ReportDefinition,
  ReportInput,
} from "@crm/core/definitions";
import { requireOrgContext } from "@/lib/session";
import { definitionMetadata, definitionPorts } from "./ports";

export async function saveReport(
  orgSlug: string,
  input: ReportInput,
  options: { idempotencyKey: string } | { id: string; expectedRevision: number },
): Promise<DefinitionResult<ReportDefinition>> {
  const ctx = await requireOrgContext(orgSlug);
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
