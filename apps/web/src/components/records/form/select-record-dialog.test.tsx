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
      {
        apiName: "Phone",
        label: "Phone",
        dataType: "phone",
        required: false,
        readOnly: false,
        unique: false,
        massUpdate: false,
        views: { view: true, create: true, edit: true, quickCreate: false },
      },
      {
        apiName: "Owner",
        label: "Contact Owner",
        dataType: "ownerlookup",
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
    {
      id: "c-1",
      fields: {
        Full_Name: "Alice Smith",
        Email: "alice@example.test",
        Phone: "555-0100",
        Owner: "u-1",
      },
    },
    {
      id: "c-2",
      fields: {
        Full_Name: "Bob Jones",
        Email: "bob@example.test",
        Phone: "555-0101",
        Owner: "u-2",
      },
    },
  ];

  return {
    getModule: vi.fn().mockResolvedValue(metadata),
    listViews: vi.fn().mockResolvedValue([
      {
        id: "all",
        name: "All Contacts",
        isDefault: true,
        columns: ["Full_Name", "Email", "Phone", "Owner"],
      },
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

test("observed chrome paints the reference picker and keeps the footer actions out", async () => {
  const user = userEvent.setup();
  const service = createMockService();
  const onDone = vi.fn();
  const onCancel = vi.fn();

  render(
    <SelectRecordDialog
      module="Contacts"
      recordService={service}
      chrome="observed"
      recordHref={(id) => `/crm/test-org/tab/Contacts/${id}`}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole("radio", { name: "Alice Smith" })).toBeTruthy();
  });

  // AF-11.2: the search field is named after the record column.
  expect(screen.getByRole("textbox", { name: "Search by Contact Name" })).toBeTruthy();
  // AF-11.5–AF-11.12: every text header carries its own column-options mark.
  expect(screen.getByRole("button", { name: "Contact Name column options" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Email column options" })).toBeTruthy();
  // AF-11.14/AF-11.15: the name cell is a record link.
  const link = screen.getByRole("link", { name: "Alice Smith" });
  expect(link.getAttribute("href")).toBe("/crm/test-org/tab/Contacts/c-1");
  // AF-11.17/AF-11.18: pagination is a pair of footer arrows.
  expect(screen.getByRole("button", { name: "Previous" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
  // The observed picker paints no footer actions and no selection summary.
  expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  expect(screen.queryByText("Selected Contact:")).toBeNull();

  // AF-11.1: the header cross dismisses without writing a value.
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(onCancel).toHaveBeenCalled();
  expect(onDone).not.toHaveBeenCalled();
});

/**
 * A caller may name the observed picker's search field after its own lookup column, which is what
 * the Deals Contact Name picker needs; without an override the record column label still wins.
 */
test("observed chrome takes the search label from the caller when one is given", async () => {
  const service = createMockService();

  render(
    <SelectRecordDialog
      module="Contacts"
      recordService={service}
      chrome="observed"
      searchLabel="Search by Contact Name"
      title="Choose Contact"
      onDone={() => {}}
      onCancel={() => {}}
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole("radio", { name: "Alice Smith" })).toBeTruthy();
  });
  expect(screen.getByRole("dialog", { name: "Choose Contact" })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Search by Contact Name" })).toBeTruthy();
  expect(screen.getByPlaceholderText("Search by Contact Name")).toBeTruthy();
});

test("observed chrome applies a row selection at once", async () => {
  const user = userEvent.setup();
  const service = createMockService();
  const onDone = vi.fn();

  render(
    <SelectRecordDialog
      module="Contacts"
      recordService={service}
      chrome="observed"
      onDone={onDone}
      onCancel={() => {}}
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole("radio", { name: "Bob Jones" })).toBeTruthy();
  });
  await user.click(screen.getByRole("radio", { name: "Bob Jones" }));
  expect(onDone).toHaveBeenCalledWith({ module: "Contacts", id: "c-2", name: "Bob Jones" });
});

test("observed chrome paints the unexercised picker controls without handlers", async () => {
  const user = userEvent.setup();
  const service = createMockService();
  const onDone = vi.fn();
  const onCancel = vi.fn();

  render(
    <SelectRecordDialog
      module="Contacts"
      recordService={service}
      chrome="observed"
      onDone={onDone}
      onCancel={onCancel}
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole("radio", { name: "Alice Smith" })).toBeTruthy();
  });

  // AF-11.3, AF-11.4, AF-11.13: their actions were never exercised in the reference capture.
  for (const name of ["New Contact", "Table columns", "Filter"]) {
    await user.click(screen.getByRole("button", { name }));
  }
  expect(onDone).not.toHaveBeenCalled();
  expect(onCancel).not.toHaveBeenCalled();
  expect(screen.getByRole("radio", { name: "Alice Smith" })).toBeTruthy();
});

test("interim chrome keeps the summary and paints no picker-only marks", async () => {
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
  expect(screen.getByText("Selected Contact:")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  expect(screen.queryByRole("button", { name: "New Contact" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
  expect(screen.queryByText("Search by Contact Name")).toBeNull();
  // AF-11.16 belongs to the observed picker only.
  expect(screen.queryByRole("button", { name: "Phone" })).toBeNull();
});

test("observed picker resolves the owner column to the member name and marks a phone cell", async () => {
  const service = createMockService();

  render(
    <SelectRecordDialog
      module="Contacts"
      recordService={service}
      chrome="observed"
      ownerNames={{ "u-1": "Owner One", "u-2": "Owner Two" }}
      onDone={() => {}}
      onCancel={() => {}}
    />,
  );

  await waitFor(
    () => {
      expect(screen.getByRole("radio", { name: "Alice Smith" })).toBeTruthy();
    },
    { timeout: 5000 },
  );
  expect(screen.getByText("Owner One")).toBeTruthy();
  expect(screen.queryByText("u-1")).toBeNull();
  // AF-11.16: one handset per populated phone cell, inert until Activities (M5).
  const handsets = screen.getAllByRole("button", { name: /^Phone$/ });
  expect(handsets).toHaveLength(2);
  expect(handsets[0]?.getAttribute("data-later-module")).toBe("M5");
  expect(handsets[0]?.getAttribute("aria-disabled")).toBe("true");
});

test("switches between the offered modules inside the picker and lists the chosen one", async () => {
  const user = userEvent.setup();
  const service = createMockService();

  render(
    <SelectRecordDialog
      module="Contacts"
      modules={["Contacts", "Leads"]}
      recordService={service}
      onDone={vi.fn()}
      onCancel={vi.fn()}
    />,
  );

  await waitFor(() => expect(screen.getByRole("radio", { name: "Alice Smith" })).toBeTruthy());
  await user.click(screen.getByRole("button", { name: /Module/ }));
  await user.click(await screen.findByRole("option", { name: "Leads" }));
  await waitFor(() => expect(service.list).toHaveBeenCalledWith("Leads", expect.anything()));
});

test("multiple selection toggles rows, preserves named references through search, and returns an array", async () => {
  const user = userEvent.setup();
  const onDone = vi.fn();
  render(
    <SelectRecordDialog
      module="Contacts"
      selection="multiple"
      recordService={createMockService()}
      onDone={onDone}
      onCancel={vi.fn()}
    />,
  );
  const alice = await screen.findByRole("checkbox", { name: "Alice Smith" });
  const done = screen.getByRole("button", { name: "Done" }) as HTMLButtonElement;
  expect(done.disabled).toBe(true);
  await user.click(alice);
  await user.click(alice);
  expect(done.disabled).toBe(true);
  await user.click(alice);
  await user.type(screen.getByRole("textbox", { name: "Search" }), "Bob");
  await waitFor(() => expect(screen.queryByRole("checkbox", { name: "Alice Smith" })).toBeNull());
  await user.click(screen.getByRole("checkbox", { name: "Bob Jones" }));
  expect(screen.getByText("2 selected")).toBeTruthy();
  await user.click(done);
  expect(onDone).toHaveBeenCalledWith([
    { module: "Contacts", id: "c-1", name: "Alice Smith" },
    { module: "Contacts", id: "c-2", name: "Bob Jones" },
  ]);
});

test("multiple select-all selects and clears only the visible page", async () => {
  const user = userEvent.setup();
  render(
    <SelectRecordDialog
      module="Contacts"
      selection="multiple"
      selectedIds={["off-page"]}
      recordService={createMockService()}
      onDone={vi.fn()}
      onCancel={vi.fn()}
    />,
  );
  await screen.findByRole("checkbox", { name: "Alice Smith" });
  await user.click(screen.getByRole("checkbox", { name: "Select all on this page" }));
  expect(screen.getByText("3 selected")).toBeTruthy();
  await user.click(screen.getByRole("checkbox", { name: "Select all on this page" }));
  expect(screen.getByText("1 selected")).toBeTruthy();
});

test("multiple selection survives pagination and works from the keyboard", async () => {
  const service = createMockService();
  vi.mocked(service.list).mockImplementation(async (_module, query) => ({
    records:
      query.page === 2
        ? [{ id: "c-2", fields: { Full_Name: "Second page" } }]
        : [{ id: "c-1", fields: { Full_Name: "First page" } }],
    moreRecords: query.page !== 2,
    page: query.page,
    perPage: query.perPage,
    sort: { field: "Full_Name", order: "asc" },
  }));
  const user = userEvent.setup();
  const onDone = vi.fn();
  render(
    <SelectRecordDialog
      module="Contacts"
      selection="multiple"
      recordService={service}
      onDone={onDone}
      onCancel={vi.fn()}
    />,
  );
  const first = await screen.findByRole("checkbox", { name: "First page" });
  first.focus();
  await user.keyboard(" ");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(await screen.findByRole("checkbox", { name: "Second page" }));
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(
    ((await screen.findByRole("checkbox", { name: "First page" })) as HTMLInputElement).checked,
  ).toBe(true);
  await user.click(screen.getByRole("button", { name: "Done" }));
  expect(onDone).toHaveBeenCalledWith([
    { module: "Contacts", id: "c-1", name: "First page" },
    { module: "Contacts", id: "c-2", name: "Second page" },
  ]);
});

test("initial multiple selection resolves record names and retains them after searching", async () => {
  const user = userEvent.setup();
  const onDone = vi.fn();
  render(
    <SelectRecordDialog
      module="Contacts"
      selection="multiple"
      selectedIds={["c-1"]}
      recordService={createMockService()}
      onDone={onDone}
      onCancel={vi.fn()}
    />,
  );
  await screen.findByRole("checkbox", { name: "Alice Smith" });
  await user.type(screen.getByRole("textbox", { name: "Search" }), "Bob");
  await waitFor(() => expect(screen.queryByRole("checkbox", { name: "Alice Smith" })).toBeNull());
  await user.click(screen.getByRole("button", { name: "Done" }));
  expect(onDone).toHaveBeenCalledWith([{ module: "Contacts", id: "c-1", name: "Alice Smith" }]);
});
