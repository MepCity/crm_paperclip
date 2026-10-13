import { formatDate, formatDateTime } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { render } from "@/test/render";
import { CellValue } from "./cell-value";

afterEach(cleanup);

function field(
  dataType: FieldDefinition["dataType"],
  extra: Partial<FieldDefinition> = {},
): FieldDefinition {
  return {
    apiName: dataType,
    label: dataType,
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
  dataType: FieldDefinition["dataType"],
  value: FieldValue,
  extra?: Partial<FieldDefinition>,
) {
  return render(
    <CellValue
      field={field(dataType, extra)}
      value={value}
      format={DEFAULT_FORMAT}
      ownerNames={{ "user-1": "Owner One" }}
    />,
  );
}

test("text, phone and an empty value render as plain text or nothing", () => {
  const { rerender } = show("text", "Lead 001");
  expect(screen.getByText("Lead 001").closest("a")).toBeNull();

  rerender(<CellValue field={field("phone")} value="555-0100" format={DEFAULT_FORMAT} />);
  expect(screen.getByText("555-0100").closest("a")).toBeNull();

  rerender(<CellValue field={field("text")} value={null} format={DEFAULT_FORMAT} />);
  expect(screen.queryByText(/.+/)).toBeNull();

  rerender(<CellValue field={field("text")} value="" format={DEFAULT_FORMAT} />);
  expect(screen.queryByRole("link")).toBeNull();
});

test("email is a body-coloured mailto link and the link column uses the row address", () => {
  const { rerender } = render(
    <CellValue field={field("email")} value="lead001@example.org" format={DEFAULT_FORMAT} />,
  );
  const mail = screen.getByRole("link", { name: "lead001@example.org" });
  expect(mail.getAttribute("href")).toBe("mailto:lead001@example.org");
  expect(mail.className).toContain("text-text");
  expect(mail.className).not.toContain("text-primary");

  rerender(
    <CellValue
      field={field("text", { apiName: "Full_Name", label: "Name" })}
      value="Lead 001"
      href="/records/rec-001"
      format={DEFAULT_FORMAT}
    />,
  );
  expect(screen.getByRole("link", { name: "Lead 001" }).getAttribute("href")).toBe(
    "/records/rec-001",
  );

  rerender(
    <CellValue
      field={field("email")}
      value="lead001@example.org"
      href="/records/rec-001"
      format={DEFAULT_FORMAT}
    />,
  );
  expect(screen.getByRole("link", { name: "lead001@example.org" }).getAttribute("href")).toBe(
    "/records/rec-001",
  );
});

test("picklist shows the published display value, otherwise the stored text", () => {
  const picklist = [{ displayValue: "Web", storedValue: "web" }];
  const { rerender } = show("picklist", "web", { picklist });
  expect(screen.getByText("Web")).toBeTruthy();
  expect(screen.queryByText("web")).toBeNull();

  rerender(
    <CellValue field={field("picklist", { picklist })} value="other" format={DEFAULT_FORMAT} />,
  );
  expect(screen.getByText("other")).toBeTruthy();
});

test("ownerlookup shows the mapped name, or the id when the map has no entry", () => {
  const { rerender } = show("ownerlookup", "user-1");
  expect(screen.getByText("Owner One")).toBeTruthy();

  rerender(
    <CellValue
      field={field("ownerlookup")}
      value="user-missing"
      format={DEFAULT_FORMAT}
      ownerNames={{ "user-1": "Owner One" }}
    />,
  );
  expect(screen.getByText("user-missing")).toBeTruthy();
});

test("datetime uses the shared formatter", () => {
  const value = "2026-03-01T08:00:00Z";
  show("datetime", value);
  expect(screen.getByText(formatDateTime(value, DEFAULT_FORMAT))).toBeTruthy();
  expect(screen.queryByText(value)).toBeNull();
});

test("date uses the shared formatter and shows no clock", () => {
  show("date", "2026-02-15");
  expect(screen.getByText(formatDate("2026-02-15", DEFAULT_FORMAT))).toBeTruthy();
  expect(screen.queryByText("2026-02-15")).toBeNull();
});

test("integer, boolean, currency and Created_By match shared field formatting", () => {
  const { rerender } = show("integer", 12_345);
  expect(screen.getByText("12345")).toBeTruthy();

  rerender(<CellValue field={field("boolean")} value={true} format={DEFAULT_FORMAT} />);
  expect(screen.getByText("true")).toBeTruthy();

  rerender(<CellValue field={field("boolean")} value={false} format={DEFAULT_FORMAT} />);
  expect(screen.getByText("false")).toBeTruthy();

  rerender(<CellValue field={field("currency")} value={1200.5} format={DEFAULT_FORMAT} />);
  expect(screen.getByText("1,200.5")).toBeTruthy();

  rerender(
    <CellValue
      field={field("ownerlookup", { apiName: "Created_By", label: "Created By" })}
      value="user-1"
      format={DEFAULT_FORMAT}
      ownerNames={{ "user-1": "Owner One" }}
    />,
  );
  expect(screen.getByText("Owner One")).toBeTruthy();
  expect(screen.queryByText(/Mar 2026/)).toBeNull();
});

test("types outside the list columns stay plain text", () => {
  const { rerender } = show("boolean", true);
  expect(screen.getByText("true").closest("a")).toBeNull();

  rerender(<CellValue field={field("integer")} value={12} format={DEFAULT_FORMAT} />);
  expect(screen.getByText("12").closest("a")).toBeNull();

  rerender(
    <CellValue field={field("website")} value="https://example.org" format={DEFAULT_FORMAT} />,
  );
  expect(screen.getByText("https://example.org").closest("a")).toBeNull();

  rerender(
    <CellValue
      field={field("multi_module_lookup")}
      value={{ module: "Accounts", id: "acc-1" }}
      format={DEFAULT_FORMAT}
    />,
  );
  expect(screen.getByText("acc-1").closest("a")).toBeNull();
});

test("future email controls retain their text and cannot navigate", () => {
  render(
    <CellValue
      field={field("email")}
      value="synthetic@example.test"
      format={DEFAULT_FORMAT}
      laterModule="M10"
    />,
  );
  const link = screen.getByRole("link", { name: "synthetic@example.test" });
  expect(link.getAttribute("data-later-module")).toBe("M10");
  expect(link.getAttribute("aria-disabled")).toBe("true");
});

test("lookup field renders link in list cell (with laterModule for unregistered modules)", () => {
  const { rerender } = render(
    <CellValue
      field={field("lookup", { lookup: { module: "Leads" } })}
      value={{ module: "Leads", id: "lead-1", name: "Lead One" }}
      format={DEFAULT_FORMAT}
    />,
  );
  const registeredLink = screen.getByRole("link", { name: "Lead One" });
  expect(registeredLink.getAttribute("href")).toBe("/tab/Leads/lead-1");
  expect(registeredLink.getAttribute("data-later-module")).toBeNull();

  rerender(
    <CellValue
      field={field("lookup", { lookup: { module: "Accounts" } })}
      value={{ module: "Accounts", id: "acc-1", name: "Acme Corp" }}
      format={DEFAULT_FORMAT}
    />,
  );
  const accountsLink = screen.getByRole("link", { name: "Acme Corp" });
  expect(accountsLink.getAttribute("href")).toBe("/tab/Accounts/acc-1");
  expect(accountsLink.getAttribute("data-later-module")).toBeNull();

  rerender(
    <CellValue
      field={field("lookup", { lookup: { module: "Deals" } })}
      value={{ module: "Deals", id: "deal-1", name: "Big Deal" }}
      format={DEFAULT_FORMAT}
    />,
  );
  const dealsLink = screen.getByRole("link", { name: "Big Deal" });
  expect(dealsLink.getAttribute("href")).toBe("/tab/Deals/deal-1");
  expect(dealsLink.getAttribute("data-later-module")).toBeNull();

  rerender(
    <CellValue
      field={field("lookup", { lookup: { module: "Campaigns" } })}
      value={{ module: "Campaigns", id: "camp-1", name: "Big Campaign" }}
      format={DEFAULT_FORMAT}
    />,
  );
  const laterLink = screen.getByRole("link", { name: "Big Campaign" });
  expect(laterLink.tagName).toBe("SPAN");
  expect(laterLink.hasAttribute("href")).toBe(false);
  expect(laterLink.getAttribute("data-later-module")).toBe("M7");
  expect(laterLink.getAttribute("aria-disabled")).toBe("true");

  rerender(
    <CellValue
      field={field("lookup", { lookup: { module: "Campaigns" } })}
      value={null}
      format={DEFAULT_FORMAT}
    />,
  );
  expect(screen.queryByRole("link")).toBeNull();
});

test("Contacts Account Name links to registered Accounts detail page", () => {
  render(
    <CellValue
      field={field("lookup", {
        apiName: "Account_Name",
        label: "Account Name",
        lookup: { module: "Accounts" },
      })}
      value={{ module: "Accounts", id: "synthetic-account", name: "Synthetic Account" }}
      format={DEFAULT_FORMAT}
    />,
  );
  const link = screen.getByRole("link", { name: "Synthetic Account" });
  expect(link.getAttribute("href")).toBe("/tab/Accounts/synthetic-account");
  expect(link.getAttribute("data-later-module")).toBeNull();
  expect(screen.queryByText("synthetic-account")).toBeNull();
});
