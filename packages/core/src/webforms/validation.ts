import { z } from "zod";
import { conditionSchema } from "../approvals/types";
import { ValidationError } from "../errors";
import {
  type EligibleField,
  WEBFORM_MODULES,
  type WebformField,
  type WebformSettings,
} from "./types";

export const webformFieldSchema = z.object({
  fieldApiName: z.string().min(1).max(120),
  label: z.string().min(1).max(120),
  required: z.boolean(),
  hidden: z.boolean(),
  defaultValue: z.unknown().optional(),
  helpText: z.string().max(1000).optional().default(""),
});

export const webformSettingsSchema = z.object({
  buttonLabel: z.string().trim().min(1).max(80).default("Submit"),
  ownerKind: z.enum(["user", "assignment_rule"]).default("user"),
  ownerRef: z.string().default(""),
  notifyOwner: z.boolean().default(false),
  acknowledgement: z
    .discriminatedUnion("kind", [
      z.object({
        kind: z.literal("message"),
        text: z.string().max(2000).default("Thank you for your submission."),
      }),
      z.object({
        kind: z.literal("redirect"),
        url: z.string().url(),
      }),
    ])
    .default({ kind: "message", text: "Thank you for your submission." }),
  challenge: z.boolean().default(false),
  restrictLocations: z.boolean().default(false),
  captureAttribution: z.boolean().default(true),
  approval: z.enum(["none", "all"]).default("none"),
  doubleOptIn: z.boolean().default(false),
});

export const createWebformSchema = z.object({
  name: z.string().trim().min(1).max(120),
  module: z.enum(WEBFORM_MODULES),
});

export const updateDraftSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  fields: z.array(webformFieldSchema).optional(),
  settings: webformSettingsSchema.optional(),
});

export const createLocationSchema = z.object({
  origin: z.string().trim().min(1).max(255),
  label: z.string().trim().max(120).optional().default(""),
});

export const createAutoResponseRuleSchema = z.object({
  module: z.enum(WEBFORM_MODULES),
  name: z.string().trim().min(1).max(120),
  criteria: conditionSchema.default({ kind: "all_records" }),
  templateId: z.string().nullable().optional().default(null),
  position: z.number().int().min(0).optional(),
  active: z.boolean().default(true),
});

export const updateAutoResponseRuleSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  criteria: conditionSchema.optional(),
  templateId: z.string().nullable().optional(),
  position: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const reorderAutoResponseRulesSchema = z.object({
  module: z.enum(WEBFORM_MODULES),
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export const MAX_LOCATIONS_PER_FORM = 20;

export function normalizeOrigin(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new ValidationError({ origin: ["Invalid origin URL"] }, "Invalid origin URL");
  }
  if (url.protocol !== "https:") {
    throw new ValidationError({ origin: ["Origin must use https:"] }, "Origin must use https:");
  }
  // Normalised: https://host[:port] with no path, query, or hash.
  return `${url.protocol}//${url.host.toLowerCase()}`;
}

const SUPPORTED_DATA_TYPES = new Set([
  "text",
  "textarea",
  "email",
  "phone",
  "website",
  "url",
  "integer",
  "double",
  "bigint",
  "number",
  "currency",
  "date",
  "datetime",
  "picklist",
  "multiselectpicklist",
  "multi-picklist",
  "boolean",
  "checkbox",
]);

const SYSTEM_FIELD_NAMES = new Set([
  "id",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "Record_Image",
  "Owner",
]);

export function isFieldEligible(field: {
  apiName: string;
  dataType: string;
  readOnly?: boolean;
  views?: { create?: boolean };
}): boolean {
  if (SYSTEM_FIELD_NAMES.has(field.apiName)) return false;
  if (field.readOnly) return false;
  if (field.views?.create === false) return false;
  return SUPPORTED_DATA_TYPES.has(field.dataType.toLowerCase());
}

export function validateForPublish(options: {
  fields: WebformField[];
  settings: WebformSettings;
  locations: { origin: string }[];
  eligibleFields: EligibleField[];
}): void {
  const fieldMap = new Map(options.fields.map((f) => [f.fieldApiName, f]));

  // 1. All layout-required fields must be present and marked required
  for (const eligible of options.eligibleFields) {
    if (eligible.required) {
      const field = fieldMap.get(eligible.apiName);
      if (!field) {
        throw new ValidationError(
          { fields: [`Required field '${eligible.apiName}' must be present in the form.`] },
          `Required field '${eligible.apiName}' must be present in the form.`,
          "mandatory",
        );
      }
      if (!field.required) {
        throw new ValidationError(
          { fields: [`Required field '${eligible.apiName}' must be marked as required.`] },
          `Required field '${eligible.apiName}' must be marked as required.`,
          "mandatory",
        );
      }
    }
  }

  // 2. Redirect URL must use https: and its origin must be in the location allowlist
  if (options.settings.acknowledgement.kind === "redirect") {
    const redirectUrl = options.settings.acknowledgement.url;
    let parsed: URL;
    try {
      parsed = new URL(redirectUrl);
    } catch {
      throw new ValidationError(
        { redirectUrl: ["Redirect URL is invalid."] },
        "Redirect URL is invalid.",
      );
    }
    if (parsed.protocol !== "https:") {
      throw new ValidationError(
        { redirectUrl: ["Redirect URL must use https:"] },
        "Redirect URL must use https:",
      );
    }
    const redirectOrigin = `${parsed.protocol}//${parsed.host.toLowerCase()}`;
    const allowedOrigins = new Set(options.locations.map((loc) => loc.origin.toLowerCase()));
    if (!allowedOrigins.has(redirectOrigin)) {
      throw new ValidationError(
        {
          redirectUrl: [
            `Redirect URL origin '${redirectOrigin}' is not in the location allowlist.`,
          ],
        },
        `Redirect URL origin '${redirectOrigin}' is not in the location allowlist.`,
      );
    }
  }
}
