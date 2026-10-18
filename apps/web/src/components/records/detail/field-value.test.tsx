import { formatDate, formatRecordAuditDateTime } from "@crm/core/format";
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
    massUpdate: false,
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

test("date shows the formatted calendar day in a detail row", () => {
  show(field("Date_of_Birth", "date"), "2026-02-15");
  expect(screen.getByText(formatDate("2026-02-15", DEFAULT_FORMAT))).toBeTruthy();
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

test("lookup field links to registered target module detail page", () => {
  show(field("Parent_Lead", "lookup", { lookup: { module: "Leads" } }), {
    module: "Leads",
    id: "lead-123",
    name: "Jane Doe",
  });
  const link = screen.getByRole("link", { name: "Jane Doe" });
  expect(link.getAttribute("href")).toBe("/tab/Leads/lead-123");
  expect(link.getAttribute("data-later-module")).toBeNull();
});

test("lookup field links to registered Accounts detail page", () => {
  show(field("Account_Name", "lookup", { lookup: { module: "Accounts" } }), {
    module: "Accounts",
    id: "acc-123",
    name: "Acme Corp",
  });
  const link = screen.getByRole("link", { name: "Acme Corp" });
  expect(link.getAttribute("href")).toBe("/tab/Accounts/acc-123");
  expect(link.getAttribute("data-later-module")).toBeNull();
});

test("lookup field links to registered Deals detail page", () => {
  show(field("Deal_Name", "lookup", { lookup: { module: "Deals" } }), {
    module: "Deals",
    id: "deal-123",
    name: "Big Deal",
  });
  const link = screen.getByRole("link", { name: "Big Deal" });
  expect(link.getAttribute("href")).toBe("/tab/Deals/deal-123");
  expect(link.getAttribute("data-later-module")).toBeNull();
});

test("lookup field links to registered Campaigns detail page", () => {
  show(field("Campaign_Source", "lookup", { lookup: { module: "Campaigns" } }), {
    module: "Campaigns",
    id: "camp-123",
    name: "Acme Campaign",
  });
  const link = screen.getByRole("link", { name: "Acme Campaign" });
  expect(link.getAttribute("href")).toBe("/tab/Campaigns/camp-123");
  expect(link.getAttribute("data-later-module")).toBeNull();
});

test("lookup field attaches laterModule to unregistered target link", () => {
  show(field("Doc_Ref", "lookup", { lookup: { module: "Documents" } }), {
    module: "Documents",
    id: "doc-123",
    name: "Acme Doc",
  });
  const link = screen.getByRole("link", { name: "Acme Doc" });
  expect(link.tagName).toBe("SPAN");
  expect(link.hasAttribute("href")).toBe(false);
  expect(link.getAttribute("aria-disabled")).toBe("true");
  expect(link.getAttribute("data-later-module")).toBe("M9");
});

test("empty lookup field renders an em dash", () => {
  show(field("Account_Name", "lookup", { lookup: { module: "Accounts" } }), null);
  expect(screen.getByText(EMPTY_FIELD_DISPLAY)).toBeTruthy();

  cleanup();
  show(field("Account_Name", "lookup", { lookup: { module: "Accounts" } }), {
    module: "Accounts",
    id: "acc-123",
    name: "   ",
  });
  expect(screen.getByText(EMPTY_FIELD_DISPLAY)).toBeTruthy();
});
