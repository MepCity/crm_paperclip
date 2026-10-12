import type { ModuleMetadata, RecordService } from "@crm/core/records";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { SelectRecordDialog } from "./select-record-dialog";

afterEach(cleanup);

function createMockService(): RecordService {
  const metadata: ModuleMetadata = {
    apiName: "Contacts",
    singularLabel: "Contact",
    pluralLabel: "Contacts",
    businessCardFields: [],
    fields: [
      {
        apiName: "Full_Name",
        label: "Contact Name",
        dataType: "text",
        required: true,
        readOnly: false,
        unique: false,
        massUpdate: false,
        views: { view: true, create: true, edit: true, quickCreate: false },
      },
      {
        apiName: "Email",
        label: "Email",
        dataType: "email",
        required: false,
        readOnly: false,
        unique: false,
        massUpdate: false,
        views: { view: true, create: true, edit: true, quickCreate: false },
      },
    ],
    layout: [],
  };

  const records = [
    { id: "c-1", fields: { Full_Name: "Alice Smith", Email: "alice@example.test" } },
    { id: "c-2", fields: { Full_Name: "Bob Jones", Email: "bob@example.test" } },
  ];

  return {
    getModule: vi.fn().mockResolvedValue(metadata),
    listViews: vi
      .fn()
      .mockResolvedValue([
        { id: "all", name: "All Contacts", isDefault: true, columns: ["Full_Name", "Email"] },
      ]),
    list: vi.fn().mockImplementation((_module, params) => {
      const filtered = params?.search
        ? records.filter((r) =>
            (r.fields.Full_Name as string).toLowerCase().includes(params.search.toLowerCase()),
          )
        : records;
      return Promise.resolve({ records: filtered, moreRecords: false });
    }),
    count: vi.fn().mockImplementation((_module, params) => {
      const filtered = params?.search
        ? records.filter((r) =>
            (r.fields.Full_Name as string).toLowerCase().includes(params.search.toLowerCase()),
          )
        : records;
      return Promise.resolve(filtered.length);
    }),
  } as unknown as RecordService;
}

test("renders dialog, loads records, selects row, and returns reference on Done", async () => {
  const user = userEvent.setup();
  const service = createMockService();
  const onDone = vi.fn();
  const onCancel = vi.fn();

  render(
    <SelectRecordDialog
      module="Contacts"
      selectedId="c-1"
      recordService={service}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );

  // Assert title after metadata loads
  await waitFor(() => {
    expect(screen.getByText("Choose Contact")).toBeTruthy();
  });

  // Search input is focused
  const searchInput = screen.getByRole("textbox", { name: "Search" });
  expect(document.activeElement).toBe(searchInput);

  // Wait for records to load
  await waitFor(() => {
    expect(screen.getByRole("radio", { name: "Alice Smith" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Bob Jones" })).toBeTruthy();
  });

  const doneButton = screen.getByRole("button", { name: "Done" }) as HTMLButtonElement;
  expect(doneButton.disabled).toBe(true);

  // Click Bob Jones radio
  await user.click(screen.getByRole("radio", { name: "Bob Jones" }));
  expect(doneButton.disabled).toBe(false);

  // Click Done
  await user.click(doneButton);
  expect(onDone).toHaveBeenCalledWith({
    module: "Contacts",
    id: "c-2",
    name: "Bob Jones",
  });
});

test("Cancel button closes dialog without calling onDone", async () => {
  const user = userEvent.setup();
  const service = createMockService();
  const onDone = vi.fn();
  const onCancel = vi.fn();

  render(
    <SelectRecordDialog
      module="Contacts"
      recordService={service}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onCancel).toHaveBeenCalled();
  expect(onDone).not.toHaveBeenCalled();
});

test("searching filters records by query", async () => {
  const user = userEvent.setup();
  const service = createMockService();

  render(
    <SelectRecordDialog
      module="Contacts"
      recordService={service}
      onDone={() => {}}
      onCancel={() => {}}
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole("radio", { name: "Alice Smith" })).toBeTruthy();
  });

  const searchInput = screen.getByRole("textbox", { name: "Search" });
  await user.type(searchInput, "Bob");

  await waitFor(() => {
    expect(screen.queryByRole("radio", { name: "Alice Smith" })).toBeNull();
    expect(screen.getByRole("radio", { name: "Bob Jones" })).toBeTruthy();
  });
});
