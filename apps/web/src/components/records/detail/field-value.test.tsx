import { formatRecordAuditDateTime } from "@crm/core/format";
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
    views: { view: true, create: true, edit: true, quickCreate: false },
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
  const auditTimestamp = "2026-03-01T22:30:00Z";
  const format = { locale: "en-US", timeZone: "UTC" };
  const { container } = render(
    <FieldValueView
      field={field("Created_By", "ownerlookup")}
      value="user-1"
      format={format}
      ownerNames={{ "user-1": "Alex Morgan" }}
      auditTimestamp={auditTimestamp}
    />,
  );
  expect(screen.getByText("Alex Morgan")).toBeTruthy();
  const timestamp = container.querySelector(".detail-audit-timestamp");
  expect(timestamp).toBeTruthy();
  expect(timestamp?.textContent).toBe("Sun, 01 Mar 2026 10:30 PM");
  expect(formatRecordAuditDateTime(auditTimestamp, format)).toBe("Sun, 01 Mar 2026 10:30 PM");
});

test("renders common field types for detail rows", () => {
  show(field("Phone", "phone"), "555-0100");
  expect(screen.getByText("555-0100")).toBeTruthy();

  cleanup();
  show(
    field("Lead_Source", "picklist", {
      picklist: [{ storedValue: "web", displayValue: "Web" }],
    }),
    "web",
  );
  expect(screen.getByText("Web")).toBeTruthy();

  cleanup();
  show(field("Owner", "ownerlookup"), "user-1");
  expect(screen.getByText("Alex Morgan")).toBeTruthy();

  cleanup();
  show(field("Employees", "integer"), 42);
  expect(screen.getByText("42")).toBeTruthy();

  cleanup();
  show(field("Revenue", "currency"), 99.5);
  expect(screen.getByText("99.5")).toBeTruthy();

  cleanup();
  show(field("Active", "boolean"), true);
  expect(screen.getByText("true")).toBeTruthy();
});

test("full-width address row uses the multiline layout class", () => {
  const { container } = show(
    field("Address", "textarea"),
    "100 Market St, Springfield, IL 62701, United States",
  );
  expect(container.querySelector(".detail-multiline")).toBeTruthy();
});

test("textarea values preserve line breaks", () => {
  show(field("Description", "textarea"), "Line one\nLine two");
  expect(screen.getByText(/Line one/)).toBeTruthy();
  expect(screen.getByText(/Line two/)).toBeTruthy();
});
