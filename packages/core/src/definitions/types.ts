import type { AssignmentRule, AutomationPort } from "../automation/types";
import type { CustomizationPort } from "../customization/types";
import type { Criteria } from "../records/contract";
import type { OrgContext } from "../tenancy/types";

export type DefinitionCode = "validation" | "forbidden" | "not_found" | "conflict" | "unavailable";
export type DefinitionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: DefinitionCode } };
export interface ReportInput {
  name: string;
  description: string;
  module: string;
  columns: readonly string[];
  criteria: Criteria | null;
  /** Grouping and aggregates are deliberately unsupported by this adapter. */
  grouping: null;
}
export interface ReportDefinition extends ReportInput {
  id: string;
  revision: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}
export interface OrganizationAddress {
  id: string;
  displayName: string;
  address: string;
  status: "unverified";
  createdBy: string;
  createdAt: string;
}
export interface CreateOptions {
  idempotencyKey: string;
}
export interface ReportDefinitionPort {
  list(ctx: OrgContext): Promise<DefinitionResult<readonly ReportDefinition[]>>;
  get(ctx: OrgContext, id: string): Promise<DefinitionResult<ReportDefinition>>;
  create(
    ctx: OrgContext,
    input: ReportInput,
    options: CreateOptions,
  ): Promise<DefinitionResult<ReportDefinition>>;
  update(
    ctx: OrgContext,
    input: ReportInput & { id: string },
    options: { expectedRevision: number },
  ): Promise<DefinitionResult<ReportDefinition>>;
}
/** Writable extension; the existing workflow read projection remains read-only. */
export interface AssignmentDefinitionPort extends AutomationPort {
  createAssignmentShell(
    ctx: OrgContext,
    input: { module: string; name: string; description: string },
    options: CreateOptions,
  ): Promise<DefinitionResult<AssignmentRule>>;
}
export interface OrganizationAddressPort {
  list(ctx: OrgContext): Promise<DefinitionResult<readonly OrganizationAddress[]>>;
  add(
    ctx: OrgContext,
    input: { displayName: string; address: string },
    options: CreateOptions,
  ): Promise<DefinitionResult<OrganizationAddress>>;
}
export type DefinitionFamily =
  | "report_definitions"
  | "assignment_shells"
  | "organization_email_addresses";
export type DefinitionRow = ReportDefinition | AssignmentRule | OrganizationAddress;
/** Internal repository; composition must expose authorized ports, never this raw store. */
export interface DefinitionRepository {
  list(ctx: OrgContext, family: DefinitionFamily): Promise<readonly DefinitionRow[]>;
  get(ctx: OrgContext, family: DefinitionFamily, id: string): Promise<DefinitionRow | null>;
  getByIdempotencyKey(
    ctx: OrgContext,
    family: DefinitionFamily,
    key: string,
  ): Promise<DefinitionRow | null>;
  create(
    ctx: OrgContext,
    family: DefinitionFamily,
    input:
      | ReportInput
      | { module: string; name: string; description: string }
      | { displayName: string; address: string },
    key: string,
  ): Promise<DefinitionRow>;
  updateReport(
    ctx: OrgContext,
    input: ReportInput & { id: string },
    revision: number,
  ): Promise<ReportDefinition>;
}
export interface DefinitionDependencies {
  repository: DefinitionRepository;
  customization: Pick<CustomizationPort, "readEffective">;
  /** Resolved by server authorization, never from client payloads. */
  canManageReports(ctx: OrgContext): Promise<boolean>;
}
