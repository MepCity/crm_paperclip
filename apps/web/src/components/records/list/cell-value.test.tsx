import { formatDateTime } from "@crm/core/format";
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
      field={field("lookup")}
      value={{ module: "Accounts", id: "acc-1" }}
      format={DEFAULT_FORMAT}
    />,
  );
  expect(screen.getByText("acc-1").closest("a")).toBeNull();
});
