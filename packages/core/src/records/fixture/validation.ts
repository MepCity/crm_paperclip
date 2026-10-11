import { type FieldErrors, ValidationError } from "../../errors";
import type { FieldDefinition, FieldValue, RecordInput } from "../contract";
import { leadsMetadata } from "./metadata";

import { fixtureModules } from "./registry";

const defaultManaged = fixtureModules.Leads!.managedFields;
function valueLength(value: FieldValue): number | undefined {
  if (typeof value === "string") return value.length;
  if (typeof value === "object" && value !== null) return value.id.length;
  if (typeof value !== "number") return undefined;
  // Count numeric digits, excluding sign/decimal separator; expand exponent notation.
  const [coefficient = "", exponentText] = Math.abs(value).toString().split("e");
  if (exponentText === undefined) return coefficient.replace(".", "").length;
  const exponent = Number(exponentText);
  const [integer = "", fraction = ""] = coefficient.split(".");
  const decimalPosition = integer.length + exponent;
  return decimalPosition <= 0
    ? 1 - decimalPosition + integer.length + fraction.length
    : Math.max(decimalPosition, integer.length + fraction.length);
}
export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function acceptsFieldValue(field: FieldDefinition, value: FieldValue): boolean {
  if (value === null) return true;
  switch (field.dataType) {
    case "integer":
      return typeof value === "number" && Number.isSafeInteger(value);
    case "currency":
    case "double":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return typeof value === "string" && isValidDateOnly(value);
    case "datetime":
      return (
        typeof value === "string" &&
        /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value) &&
        Number.isFinite(Date.parse(value))
      );
    case "bigint":
      return typeof value === "string" && /^-?\d+$/.test(value);
    case "lookup":
    case "multi_module_lookup":
      return (
        typeof value === "object" &&
        typeof value.id === "string" &&
        typeof value.module === "string" &&
        (field.dataType !== "lookup" || value.module === field.lookup?.module) &&
        (value.name === undefined || typeof value.name === "string") &&
        Object.keys(value).every((key) => key === "id" || key === "module" || key === "name")
      );
    default:
      return typeof value === "string";
  }
}
export function validateInput(
  input: RecordInput,
  partial: boolean,
  fields = leadsMetadata.fields,
  managed: ReadonlySet<string> = defaultManaged,
): void {
  const errors: FieldErrors = Object.create(null);
  let mandatory = false;
  for (const name of Object.keys(input)) {
    if (!fields.some((field) => field.apiName === name)) errors[name] = ["Unknown field."];
  }
  for (const field of fields) {
    const present = Object.hasOwn(input, field.apiName);
    const value = input[field.apiName];
    if (present && (field.readOnly || managed.has(field.apiName))) {
      errors[field.apiName] = ["This field is system managed."];
      continue;
    }
    if (
      field.required &&
      (!partial || present) &&
      (value == null || (typeof value === "string" && !value.trim()))
    ) {
      mandatory = true;
      errors[field.apiName] = ["This field is required."];
    } else if (present) {
      if (value === undefined || !acceptsFieldValue(field, value))
        errors[field.apiName] = ["Invalid field type."];
      else if (field.maxLength !== undefined && (valueLength(value) ?? 0) > field.maxLength)
        errors[field.apiName] = ["Value is too long."];
      else if (
        field.picklist &&
        value !== null &&
        !field.picklist.some((option) => option.storedValue === value)
      )
        errors[field.apiName] = ["Choose a listed option."];
    }
  }
  if (Object.keys(errors).length)
    throw new ValidationError(errors, undefined, mandatory ? "mandatory" : "invalid");
}
