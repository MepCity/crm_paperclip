import { expect, test } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { formatFieldValue } from "./field-format";

const format = DEFAULT_FORMAT;

function textField(apiName: string, dataType: "text" | "integer" | "currency" | "boolean") {
  return {
    apiName,
    label: apiName,
    dataType,
    required: false,
    readOnly: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
  };
}

test("integer and boolean match list cell string rendering", () => {
  const integer = formatFieldValue(textField("n", "integer"), 12_345, {}, format);
  expect(integer).toEqual({ kind: "text", text: "12345" });
  const boolean = formatFieldValue(textField("b", "boolean"), true, {}, format);
  expect(boolean).toEqual({ kind: "text", text: "true" });
});

test("currency uses a supplied code and plain numbers otherwise", () => {
  const field = textField("amount", "currency");
  const plain = formatFieldValue(field, 1200.5, {}, format);
  expect(plain.kind).toBe("text");
  if (plain.kind === "text") {
    expect(plain.text).toBe("1,200.5");
  }

  const usd = formatFieldValue(field, 1200.5, {}, format, { currencyCode: "USD" });
  expect(usd.kind).toBe("text");
  if (usd.kind === "text") {
    expect(usd.text).toContain("1,200.50");
    expect(usd.text).toContain("$");
  }
});
