import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { render } from "@/test/render";
import { EMPTY_FIELD_DISPLAY } from "../field-format";
import { FieldValueView } from "./field-value";

afterEach(cleanup);

function field(
  apiName: string,
  dataType: FieldDefinition["dataType"],
  extra: Partial<FieldDefinition> = {},
): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType,
    required: false,
    readOnly: false,
    unique: false,
    ...extra,
  };
}

function show(
  definition: FieldDefinition,
  value: FieldValue,
  options?: { auditTimestamp?: string },
) {
  return render(
    <FieldValueView
      field={definition}
      value={value}
      format={DEFAULT_FORMAT}
      ownerNames={{ "user-1": "Alex Morgan" }}
      auditTimestamp={options?.auditTimestamp}
    />,
  );
}

test("empty text, picklist and boolean values render an em dash", () => {
  show(field("text", "text"), null);
  expect(screen.getByText(EMPTY_FIELD_DISPLAY)).toBeTruthy();

  cleanup();
  show(
    field("pick", "picklist", {
      picklist: [{ storedValue: "x", displayValue: "-None-" }],
    }),
    "",
  );
  expect(screen.getByText(EMPTY_FIELD_DISPLAY)).toBeTruthy();

  cleanup();
  show(field("flag", "boolean"), false);
  expect(screen.getByText(EMPTY_FIELD_DISPLAY)).toBeTruthy();
});

test("email and website values use links", () => {
  show(field("Email", "email"), "lead001@example.org");
  const mail = screen.getByRole("link", { name: "lead001@example.org" });
  expect(mail.getAttribute("href")).toBe("mailto:lead001@example.org");

  cleanup();
  show(field("Website", "website"), "example.org");
  const site = screen.getByRole("link", { name: "example.org" });
  expect(site.getAttribute("href")).toBe("https://example.org");
});

test("Created_By renders user and audit timestamp on two lines", () => {
  show(field("Created_By", "ownerlookup"), "user-1", {
    auditTimestamp: "2026-03-01T22:30:00Z",
  });
  expect(screen.getByText("Alex Morgan")).toBeTruthy();
  expect(screen.getByText(/Mar 02, 2026/)).toBeTruthy();
});

test("textarea values preserve line breaks", () => {
  show(field("Description", "textarea"), "Line one\nLine two");
  expect(screen.getByText(/Line one/)).toBeTruthy();
  expect(screen.getByText(/Line two/)).toBeTruthy();
});
