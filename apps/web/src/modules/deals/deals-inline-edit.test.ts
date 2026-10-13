import { expect, test } from "vitest";
import { isDealInlineEditable } from "./deals-inline-edit";
import { dealField } from "./test-metadata";

test("prevents inline editing of Expected Revenue while allowing ordinary editable fields", () => {
  expect(
    isDealInlineEditable(
      dealField("Amount", {
        dataType: "currency",
        views: { edit: true, view: true, create: true, quickCreate: true },
      }),
    ),
  ).toBe(true);

  expect(
    isDealInlineEditable(
      dealField("Expected_Revenue", {
        dataType: "currency",
        readOnly: true,
        views: { edit: true, view: true, create: true, quickCreate: true },
      }),
    ),
  ).toBe(false);

  expect(
    isDealInlineEditable(
      dealField("Expected_Revenue", {
        dataType: "currency",
        views: { edit: true, view: true, create: true, quickCreate: true },
      }),
    ),
  ).toBe(false);

  expect(
    isDealInlineEditable(
      dealField("Deal_Name", {
        views: { edit: true, view: true, create: true, quickCreate: true },
      }),
    ),
  ).toBe(true);

  expect(
    isDealInlineEditable(
      dealField("Created_Time", {
        views: { edit: true, view: true, create: true, quickCreate: true },
      }),
    ),
  ).toBe(false);
});
