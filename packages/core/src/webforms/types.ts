import type { ProcessCondition } from "../approvals/types";
import type { PicklistOption } from "../records/contract";

export const WEBFORM_MODULES = ["Leads", "Contacts", "Cases"] as const;
export type WebformModule = (typeof WEBFORM_MODULES)[number];

export const WEBFORM_STATUSES = ["draft", "active", "inactive"] as const;
export type WebformStatus = (typeof WEBFORM_STATUSES)[number];

export const WEBFORM_VERSION_STATES = ["draft", "published", "superseded"] as const;
export type WebformVersionState = (typeof WEBFORM_VERSION_STATES)[number];

export interface WebformField {
  fieldApiName: string;
  label: string;
  required: boolean;
  hidden: boolean;
  defaultValue?: unknown;
  helpText?: string;
}

export interface WebformSettings {
  buttonLabel: string;
  ownerKind: "user" | "assignment_rule";
  ownerRef: string;
  notifyOwner: boolean;
  acknowledgement: { kind: "message"; text: string } | { kind: "redirect"; url: string };
  challenge: boolean;
  restrictLocations: boolean;
  captureAttribution: boolean;
  approval: "none" | "all";
  doubleOptIn: boolean;
}

export interface WebformLocation {
  organizationId: string;
  formId: string;
  origin: string;
  label: string;
  createdAt: string;
}

export interface WebformVersion {
  id: string;
  organizationId: string;
  formId: string;
  number: number;
  state: WebformVersionState;
  fields: WebformField[];
  settings: WebformSettings;
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string;
}

export interface Webform {
  id: string;
  organizationId: string;
  name: string;
  module: WebformModule;
  status: WebformStatus;
  draftVersionId: string | null;
  publishedVersionId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface WebformDetail extends Webform {
  draftVersion: WebformVersion | null;
  publishedVersion: WebformVersion | null;
  locations: WebformLocation[];
  hasActivePublicKey: boolean;
}

export interface WebformAutoResponseRule {
  id: string;
  organizationId: string;
  module: WebformModule;
  name: string;
  criteria: ProcessCondition;
  templateId: string | null;
  position: number;
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface EligibleField {
  apiName: string;
  label: string;
  dataType: string;
  required: boolean;
  readOnly?: boolean;
  picklistOptions?: readonly PicklistOption[];
}
