import { z } from "zod";
import { ValidationError } from "../errors";
import type { Criteria } from "../records/contract";

const id = z.string().min(1);
const dataType = z.enum([
  "multireminder",
  "ALARM",
  "RRULE",
  "autonumber",
  "text",
  "textarea",
  "email",
  "phone",
  "website",
  "picklist",
  "integer",
  "currency",
  "boolean",
  "date",
  "datetime",
  "double",
  "bigint",
  "lookup",
  "ownerlookup",
  "profileimage",
  "multi_module_lookup",
]);
const flags = z.strictObject({
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  quickCreate: z.boolean(),
});
const properties = z.strictObject({
  label: id,
  required: z.boolean(),
  readOnly: z.boolean(),
  maxLength: z.int().positive().optional(),
  picklist: z
    .array(
      z.strictObject({
        displayValue: id,
        storedValue: id,
        stage: z
          .strictObject({
            probability: z.number().min(0).max(100),
            forecastCategory: id,
            category: z.enum(["Open", "Closed Won", "Closed Lost"]),
          })
          .optional(),
      }),
    )
    .optional(),
  views: flags,
});
export const fieldSchema = properties.extend({
  id,
  apiName: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  dataType,
  lifecycle: z.enum(["active", "retired"]),
  unique: z.boolean(),
  massUpdate: z.boolean(),
  acceptsJsonArray: z.boolean().optional(),
  lookup: z.strictObject({ module: id, modules: z.array(id).optional() }).optional(),
});
const layout = z.strictObject({
  id,
  label: id,
  isDefault: z.boolean(),
  sections: z.array(
    z.strictObject({
      id,
      label: id,
      columnCount: z.int().positive(),
      columns: z.array(z.array(id)),
      fields: z.array(id),
    }),
  ),
});
export const comparatorSchema = z.enum([
  "equal",
  "contains",
  "not_contains",
  "less_equal",
  "not_equal",
  "starts_with",
  "ends_with",
  "is_empty",
  "is_not_empty",
  "less_than",
  "greater_than",
  "greater_equal",
  "between",
  "not_between",
]);
// The existing query engine performs type/operator/token validation after ID translation.
const criteria: z.ZodType<Criteria> = z.lazy(() =>
  z.union([
    z.strictObject({ groupOperator: z.enum(["and", "or"]), group: z.array(criteria).min(1) }),
    z.strictObject({
      field: id,
      comparator: comparatorSchema,
      value: z.json(),
    }),
  ]),
);
const view = z.strictObject({
  id,
  name: id,
  systemDefined: z.boolean(),
  isDefault: z.boolean(),
  columns: z.array(id),
  criteria: criteria.nullable(),
  sort: z.strictObject({ field: id, order: z.enum(["asc", "desc"]) }).nullable(),
});
export const baselineSchema = z.strictObject({
  apiName: id,
  version: id,
  singularLabel: id,
  pluralLabel: id,
  fields: z.array(
    fieldSchema.extend({
      customizable: z.array(
        z.enum(["label", "required", "readOnly", "maxLength", "picklist", "views"]),
      ),
      serverValue: z.boolean(),
      systemRequired: z.boolean(),
    }),
  ),
  layouts: z.array(layout),
  views: z.array(view),
  reservedApiNames: z.array(id),
  externalCriteriaFields: z.array(id),
  customFieldTypes: z.array(dataType),
  supportedColumnCounts: z.array(z.int().positive()).min(1),
  capabilities: z.record(id, z.boolean()),
  engineCapabilities: z.record(id, z.boolean()),
});
export const patchSchema = z.strictObject({
  addFields: z.array(fieldSchema).optional(),
  fieldPatches: z
    .record(
      id,
      properties
        .partial()
        .refine((value) => Object.values(value).every((entry) => entry !== undefined)),
    )
    .optional(),
  layouts: z.array(layout).optional(),
  views: z.array(view).optional(),
});
export const snapshotSchema = z.strictObject({
  baselineVersion: id,
  revision: z.int().nonnegative(),
  fields: z.array(fieldSchema),
  fieldPatches: z.record(
    id,
    properties
      .partial()
      .refine((value) => Object.values(value).every((entry) => entry !== undefined)),
  ),
  layouts: z.array(layout).optional(),
  views: z.array(view).optional(),
});
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ValidationError({
      customization: ["Invalid metadata shape or unsupported property."],
    });
  return result.data;
}
