import { z } from "zod";
import { fieldSchema, layoutSchema, propertiesSchema, viewSchema } from "./schema";

const id = z.string().min(1);
const propertyPatch = propertiesSchema
  .partial()
  .refine(
    (value) =>
      Object.keys(value).length > 0 && Object.values(value).every((entry) => entry !== undefined),
  );
const field = fieldSchema
  .omit({ id: true, lifecycle: true, lookup: true, acceptsJsonArray: true })
  .extend({
    dataType: z.enum([
      "text",
      "textarea",
      "email",
      "phone",
      "website",
      "picklist",
      "integer",
      "currency",
      "double",
      "bigint",
      "boolean",
      "date",
      "datetime",
    ]),
  });
const layout = { layout: layoutSchema.optional() };
export const customizationCommandSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("field.create"), field, ...layout }),
  z.strictObject({
    type: z.literal("field.patch"),
    fieldId: id,
    properties: propertyPatch,
    ...layout,
  }),
  z.strictObject({ type: z.literal("field.retire"), fieldId: id, ...layout }),
  z.strictObject({ type: z.literal("field.restore"), fieldId: id, ...layout }),
  z.strictObject({
    type: z.literal("module.patch"),
    properties: z
      .strictObject({
        singularLabel: id.optional(),
        pluralLabel: id.optional(),
        defaultLayoutId: id.optional(),
      })
      .refine(
        (value) =>
          Object.keys(value).length > 0 &&
          Object.values(value).every((entry) => entry !== undefined),
      ),
  }),
  z.strictObject({ type: z.literal("layout.patch"), layout: layoutSchema }),
  z.strictObject({
    type: z.literal("view.create"),
    view: viewSchema.extend({ systemDefined: z.literal(false), isDefault: z.literal(false) }),
  }),
  z.strictObject({
    type: z.literal("view.patch"),
    view: viewSchema.extend({ systemDefined: z.literal(false), isDefault: z.literal(false) }),
  }),
  z.strictObject({ type: z.literal("view.delete") }),
]);
export const customizationRequestSchema = z.strictObject({
  expectedRevision: z.string().regex(/^[A-Za-z0-9._:-]{1,64}$/),
  command: customizationCommandSchema,
});
export type CustomizationCommand = z.infer<typeof customizationCommandSchema>;
export type CustomizationRequest = z.infer<typeof customizationRequestSchema>;
