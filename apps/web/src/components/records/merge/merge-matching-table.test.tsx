import type { FieldDefinition, RecordData } from "@crm/core/records";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MergeMatchingTable } from "./merge-matching-table";

afterEach(cleanup);

const format = { locale: "en-US", timeZone: "Europe/Istanbul" };

const nameColumn: FieldDefinition = {
  apiName: "Full_Name",
  label: "Contact Name",
  dataType: "text",
  required: true,
  readOnly: false,
  unique: false,
  massUpdate: false,
  views: { view: true, create: true, edit: true, quickCreate: true },
};

const emailColumn: FieldDefinition = {
  apiName: "Email",
  label: "Email",
  dataType: "email",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
};

const records: RecordData[] = [
  { id: "10", fields: { Full_Name: "Record 10", Email: "r10@test.org" } },
  { id: "20", fields: { Full_Name: "Record 20", Email: "r20@test.org" } },
  { id: "30", fields: { Full_Name: "Record 30", Email: "r30@test.org" } },
  { id: "40", fields: { Full_Name: "Record 40", Email: "r40@test.org" } },
];

describe("MergeMatchingTable", () => {
  it("renders empty state message when records array is empty", () => {
    render(
      <MergeMatchingTable
        records={[]}
        columns={[nameColumn]}
        linkField="Full_Name"
        selectedIds={new Set(["10"])}
        anchorId="10"
        maxSelected={3}
        ownerNames={{}}
        format={format}
        emptyMessage="No records found."
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("No records found.")).toBeTruthy();
  });

  it("keeps anchor record selected and disabled from unchecking", () => {
    render(
      <MergeMatchingTable
        records={records.slice(0, 2)}
        columns={[nameColumn, emailColumn]}
        linkField="Full_Name"
        selectedIds={new Set(["10"])}
        anchorId="10"
        maxSelected={3}
        ownerNames={{}}
        format={format}
        emptyMessage="No records found."
        onToggle={vi.fn()}
      />,
    );

    const anchorInput = screen.getByRole("checkbox", { name: "Record 10" }) as HTMLInputElement;
    const secondInput = screen.getByRole("checkbox", { name: "Record 20" }) as HTMLInputElement;

    // Anchor record (id: 10) is checked & disabled
    expect(anchorInput.checked).toBe(true);
    expect(anchorInput.disabled).toBe(true);

    // Second record (id: 20) is not checked & enabled
    expect(secondInput.checked).toBe(false);
    expect(secondInput.disabled).toBe(false);
  });

  it("calls onToggle when an unselected row is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <MergeMatchingTable
        records={records.slice(0, 2)}
        columns={[nameColumn, emailColumn]}
        linkField="Full_Name"
        selectedIds={new Set(["10"])}
        anchorId="10"
        maxSelected={3}
        ownerNames={{}}
        format={format}
        emptyMessage="No records found."
        onToggle={onToggle}
      />,
    );

    const secondInput = screen.getByRole("checkbox", { name: "Record 20" }) as HTMLInputElement;
    await user.click(secondInput);
    expect(onToggle).toHaveBeenCalledWith("20", true);
  });

  it("enforces max 3 selected records by disabling unselected checkboxes when cap is reached", () => {
    render(
      <MergeMatchingTable
        records={records}
        columns={[nameColumn, emailColumn]}
        linkField="Full_Name"
        selectedIds={new Set(["10", "20", "30"])}
        anchorId="10"
        maxSelected={3}
        ownerNames={{}}
        format={format}
        emptyMessage="No records found."
        onToggle={vi.fn()}
      />,
    );

    const input1 = screen.getByRole("checkbox", { name: "Record 10" }) as HTMLInputElement;
    const input2 = screen.getByRole("checkbox", { name: "Record 20" }) as HTMLInputElement;
    const input3 = screen.getByRole("checkbox", { name: "Record 30" }) as HTMLInputElement;
    const input4 = screen.getByRole("checkbox", { name: "Record 40" }) as HTMLInputElement;

    // Anchor (10): checked & disabled
    expect(input1.checked).toBe(true);
    expect(input1.disabled).toBe(true);

    // Selected 20: checked & enabled
    expect(input2.checked).toBe(true);
    expect(input2.disabled).toBe(false);

    // Selected 30: checked & enabled
    expect(input3.checked).toBe(true);
    expect(input3.disabled).toBe(false);

    // Unselected 40: not checked & disabled because cap (3) is reached
    expect(input4.checked).toBe(false);
    expect(input4.disabled).toBe(true);
  });
});
