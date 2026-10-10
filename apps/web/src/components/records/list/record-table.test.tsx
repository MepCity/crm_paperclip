import type { FieldDefinition, RecordData } from "@crm/core/records";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { render } from "@/test/render";
import { RecordTable, type RecordTableProps } from "./record-table";

afterEach(cleanup);

const columns: FieldDefinition[] = [
  {
    apiName: "Full_Name",
    views: { view: true, create: false, edit: false, quickCreate: false },
    label: "Name",
    dataType: "text",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
  },
  {
    apiName: "Email",
    views: { view: true, create: true, edit: true, quickCreate: true },
    label: "Email",
    dataType: "email",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
  },
  {
    apiName: "Company",
    views: { view: true, create: true, edit: true, quickCreate: true },
    label: "Company",
    dataType: "text",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
  },
];

function record(id: string, name: string, email: string | null = `${id}@example.org`): RecordData {
  return { id, fields: { Full_Name: name, Email: email, Company: "Example Co" } };
}

function Harness({
  records,
  emptyMessage = "No records found.",
  wrapText = false,
  settings,
  alphabet,
  footer,
}: {
  records: readonly RecordData[];
  emptyMessage?: string;
  wrapText?: boolean;
  settings?: RecordTableProps["settings"];
  alphabet?: RecordTableProps["alphabet"];
  footer?: Partial<RecordTableProps["footer"]>;
}) {
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  return (
    <RecordTable
      columns={columns}
      records={records}
      linkField="Full_Name"
      rowHref={(item) => `/records/${item.id}`}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      alphabet={alphabet}
      wrapText={wrapText}
      emptyMessage={emptyMessage}
      settings={settings}
      format={DEFAULT_FORMAT}
      footer={{
        total: records.length,
        page: 1,
        pageSize: 10,
        recordCount: records.length,
        moreRecords: false,
        previousHref: null,
        nextHref: null,
        ...footer,
      }}
    />
  );
}

function control() {
  return screen.getByRole("button", { name: "Filter by first letter" });
}

test("exposes the table, column headers and row links", () => {
  render(
    <Harness records={[record("rec-001", "Lead 001"), record("rec-002", "Lead 002", null)]} />,
  );

  expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
  expect(screen.queryByRole("region", { name: "Records" })).toBeNull();
  expect(document.querySelector("[data-part=row] [data-part=settings]")).toBeNull();
  expect(document.querySelector("[data-part=settings]")?.textContent).toBe("");
  expect(screen.queryByText("View settings")).toBeNull();
  expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "Email" })).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "Company" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Lead 001" }).getAttribute("href")).toBe(
    "/records/rec-001",
  );
  expect(screen.getByRole("link", { name: "rec-001@example.org" }).getAttribute("href")).toBe(
    "mailto:rec-001@example.org",
  );
  for (const company of screen.getAllByText("Example Co")) {
    expect(company.closest("a")).toBeNull();
  }
  expect(screen.queryByRole("link", { name: "Lead 002" })?.getAttribute("href")).toBe(
    "/records/rec-002",
  );
});

test("selects the page from the header box and one row from its box, including the keyboard", async () => {
  const user = userEvent.setup();
  render(<Harness records={[record("rec-001", "Lead 001"), record("rec-002", "Lead 002")]} />);

  const header = screen.getByRole("checkbox", {
    name: "Select all rows on this page",
  }) as HTMLInputElement;
  const first = screen.getByRole("checkbox", { name: "Select Lead 001" }) as HTMLInputElement;
  const second = screen.getByRole("checkbox", { name: "Select Lead 002" }) as HTMLInputElement;
  expect(header.checked).toBe(false);

  header.focus();
  await user.keyboard(" ");
  expect(header.checked).toBe(true);
  expect(first.checked).toBe(true);
  expect(second.checked).toBe(true);

  await user.keyboard(" ");
  expect(header.checked).toBe(false);
  expect(first.checked).toBe(false);
  expect(second.checked).toBe(false);

  await user.tab();
  expect(document.activeElement).toBe(first);
  await user.keyboard(" ");
  expect(first.checked).toBe(true);
  expect(second.checked).toBe(false);
  expect(header.checked).toBe(false);

  await user.click(second);
  expect(header.checked).toBe(true);
});

test("empty state keeps the header and footer, drops the badge and checkboxes, and names the scroller", () => {
  render(<Harness records={[]} emptyMessage="No records found." />);

  expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
  expect(screen.getByRole("region", { name: "Records" })).toBeTruthy();
  expect(screen.getByText("Total Records")).toBeTruthy();
  expect(screen.getByText("0")).toBeTruthy();
  expect(screen.getByText("No records found.")).toBeTruthy();
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(document.querySelector("[data-part=badge]")).toBeNull();
  expect(document.querySelector("[data-part=range]")).toBeNull();
  expect(document.querySelector("[data-part=previous]")).toBeNull();
  expect(document.querySelectorAll("[data-part=header] [data-part=leading]")).toHaveLength(2);
  const emptyBand = document.querySelector("[data-part=empty]");
  expect(emptyBand?.textContent).toBe("No records found.");
  expect(emptyBand?.closest("table")).toBeNull();
  expect(emptyBand?.parentElement?.getAttribute("data-part")).toBe("card");
  const scroller = document.querySelector("[data-part=card] .overflow-x-auto");
  expect(scroller?.getAttribute("tabindex")).toBe("0");
  expect(scroller?.getAttribute("aria-label")).toBe("Records");
});

test("link cells take the cell's wrap mode instead of forcing their own", () => {
  render(<Harness records={[record("rec-001", "Lead 001")]} wrapText={false} />);
  const truncated = document.querySelector("[data-part=row] [data-part=value]");
  expect(truncated?.className).toContain("truncate");
  const link = truncated?.querySelector("a");
  expect(link?.className).not.toContain("whitespace-normal");
  expect(link?.className).not.toContain("inline-block");
  cleanup();

  render(<Harness records={[record("rec-001", "Lead 001")]} wrapText />);
  const wrapped = document.querySelector("[data-part=row] [data-part=value]");
  expect(wrapped?.className).toContain("whitespace-normal");
  expect(wrapped?.querySelector("a")?.className).toContain("break-words");
});

test("renders the settings slot and keeps selection off the rest of the page", async () => {
  const user = userEvent.setup();
  render(<Harness records={[record("rec-001", "Lead 001")]} settings={<span>Columns</span>} />);

  expect(screen.getByText("Columns")).toBeTruthy();
  expect(screen.queryByRole("columnheader", { name: "View settings" })).toBeNull();
  await user.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
  expect(screen.queryByRole("toolbar")).toBeNull();
});

test("no alphabetical control without the alphabet prop", () => {
  render(<Harness records={[record("rec-001", "Lead 001")]} />);
  expect(screen.queryByRole("button", { name: "Filter by first letter" })).toBeNull();
});

test("the alphabetical control sits in the link column header and keeps its name", () => {
  render(
    <Harness
      records={[record("rec-001", "Lead 001")]}
      alphabet={{ value: null, onChange: vi.fn() }}
    />,
  );
  const headers = screen.getAllByRole("columnheader");
  const withControl = headers.filter((header) =>
    within(header).queryByRole("button", { name: "Filter by first letter" }),
  );
  expect(withControl).toHaveLength(1);
  expect(withControl[0]?.getAttribute("aria-label")).toBe("Name");
  expect(control().textContent).toBe("All");
});

test("the alphabetical control shows the chosen letter", () => {
  render(
    <Harness
      records={[record("rec-001", "Lead 001")]}
      alphabet={{ value: "R", onChange: vi.fn() }}
    />,
  );
  expect(control().textContent).toBe("R");
});

test("picking a letter in the list reports it, All reports null, and the list closes", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <Harness records={[record("rec-001", "Lead 001")]} alphabet={{ value: null, onChange }} />,
  );
  await user.click(control());
  const list = await screen.findByRole("listbox", { name: "Filter by first letter choices" });
  expect(within(list).getAllByRole("option")).toHaveLength(27);
  await user.click(within(list).getByRole("option", { name: "B" }));
  expect(onChange).toHaveBeenCalledWith("B");
  expect(screen.queryByRole("listbox")).toBeNull();

  await user.click(control());
  const reopened = await screen.findByRole("listbox", { name: "Filter by first letter choices" });
  await user.click(within(reopened).getByRole("option", { name: "All" }));
  expect(onChange).toHaveBeenLastCalledWith(null);
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("the empty view keeps the alphabetical control in its header", () => {
  render(<Harness records={[]} alphabet={{ value: "C", onChange: vi.fn() }} />);
  expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
  expect(control().textContent).toBe("C");
});
