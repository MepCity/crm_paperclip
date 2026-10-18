import { formatDate, formatDateTime } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import * as moduleRegistry from "@/modules/registry";
import { render } from "@/test/render";
import { CellValue } from "./cell-value";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

test("currency cell carries the supplied currency code", () => {
  const { container } = render(
    <CellValue
      field={field("currency")}
      value={31800}
      format={DEFAULT_FORMAT}
      currencyCode="TRY"
    />,
  );
  expect(container.textContent).toBe("TRY\u00A031,800.00");
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

  // Exercise the unregistered state explicitly, independent of shipped modules.
  const resolve = moduleRegistry.resolveModuleScreenByApiName;
  vi.spyOn(moduleRegistry, "resolveModuleScreenByApiName").mockImplementation(
    (apiName, definitions) => (apiName === "Cases" ? undefined : resolve(apiName, definitions)),
  );
  rerender(
    <CellValue
      field={field("lookup", { lookup: { module: "Cases" } })}
      value={{ module: "Cases", id: "case-1", name: "Big Case" }}
      format={DEFAULT_FORMAT}
    />,
  );
  const casesLink = screen.getByRole("link", { name: "Big Case" });
  expect(casesLink.getAttribute("href")).toBe("/tab/Cases/case-1");
  expect(casesLink.getAttribute("data-later-module")).toBeNull();

  rerender(
    <CellValue
      field={field("lookup", { lookup: { module: "Documents" } })}
      value={{ module: "Documents", id: "doc-1", name: "Big Doc" }}
      format={DEFAULT_FORMAT}
    />,
  );
  const laterLink = screen.getByRole("link", { name: "Big Doc" });
  expect(laterLink.tagName).toBe("SPAN");
  expect(laterLink.hasAttribute("href")).toBe(false);
  expect(laterLink.getAttribute("data-later-module")).toBe("M9");
  expect(laterLink.getAttribute("aria-disabled")).toBe("true");

  rerender(
    <CellValue
      field={field("lookup", { lookup: { module: "Documents" } })}
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

test("Related To pictogram only draws when asked, by the related module", () => {
  const related = field("lookup", { apiName: "What_Id", label: "Related To" });
  const account = { module: "Accounts", id: "a1", name: "Acme" };
  const { container, rerender } = render(
    <CellValue field={related} value={account} format={DEFAULT_FORMAT} numericDates />,
  );
  expect(container.querySelector("[data-part=related-pictogram]")).toBeNull();

  rerender(
    <CellValue field={related} value={account} format={DEFAULT_FORMAT} relatedToPictogram />,
  );
  const building = container.querySelector("[data-part=related-pictogram]");
  expect(building).toBeTruthy();

  rerender(
    <CellValue
      field={related}
      value={{ module: "Deals", id: "d1", name: "Big" }}
      format={DEFAULT_FORMAT}
      relatedToPictogram
    />,
  );
  const generic = container.querySelector("[data-part=related-pictogram]");
  expect(generic).toBeTruthy();
  expect(generic?.innerHTML).not.toBe(building?.innerHTML);

  rerender(<CellValue field={related} value={null} format={DEFAULT_FORMAT} relatedToPictogram />);
  expect(container.querySelector("[data-part=related-pictogram]")).toBeNull();
});

test("numeric dates show date and time, or only the date on all-day rows", () => {
  const start = field("datetime");
  const { rerender } = render(
    <CellValue field={start} value="2026-03-01T14:05:00Z" format={DEFAULT_FORMAT} numericDates />,
  );
  expect(screen.getByText(/^01\.03\.2026 \d{1,2}:05 (AM|PM)$/)).toBeTruthy();
  rerender(
    <CellValue
      field={start}
      value="2026-03-01T14:05:00Z"
      format={DEFAULT_FORMAT}
      numericDates
      dateOnly
    />,
  );
  expect(screen.getByText("01.03.2026")).toBeTruthy();
});

for (const module of ["Cases", "Solutions"]) {
  test(`${module} lookup links to its registered detail page`, () => {
    show("lookup", { module, id: "record-1", name: "Support record" }, { lookup: { module } });
    const link = screen.getByRole("link", { name: "Support record" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe(`/tab/${module}/record-1`);
    expect(link.hasAttribute("data-later-module")).toBe(false);
  });
}
