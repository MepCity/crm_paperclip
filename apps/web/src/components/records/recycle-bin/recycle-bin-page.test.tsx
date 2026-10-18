import { randomUUID } from "node:crypto";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import type { BinActions } from "./contracts";
import { initialBinSearch } from "./contracts";
import { RecycleBinPage } from "./recycle-bin-page";

const entries = Array.from({ length: 31 }, (_, index) => ({
  id: `entry-${index}`,
  recordId: `record-${index}`,
  module: "Leads",
  name: `Example ${index}`,
  deletedBy: "Demo Admin",
  deletedAt: "2026-10-17T01:00:00Z",
  expiresAt: "2026-12-16T01:00:00Z",
}));
function setup(overrides: Partial<BinActions> = {}) {
  const actions: BinActions = {
    list: vi.fn<BinActions["list"]>(async (_search, page) => ({
      status: "success",
      entries: entries.slice((page - 1) * 30, page * 30),
      total: entries.length,
    })),
    mutate: vi.fn<BinActions["mutate"]>(async () => ({ status: "success" })),
    ...overrides,
  };
  render(<RecycleBinPage actions={actions} />);
  return { actions, user: userEvent.setup() };
}
afterEach(cleanup);
const select = (name: string) => screen.getByRole("checkbox", { name });
async function loaded() {
  await screen.findByText("Example 0");
}

test("RB-06/09/10: selection invokes restore with entry IDs and reloads", async () => {
  const { user, actions } = setup();
  await loaded();
  await user.click(select("Select Example 0"));
  await user.click(screen.getByRole("button", { name: "Restore" }));
  await waitFor(() => expect(actions.mutate).toHaveBeenCalledWith("restore", ["entry-0"]));
  await screen.findByText("Selected records restored.");
  expect((select("Select Example 0") as HTMLInputElement).checked).toBe(false);
});

test("RB-07: delete requires confirmation; cancel does not mutate; failed deletion remains retryable", async () => {
  const { user, actions } = setup({
    mutate: vi
      .fn()
      .mockResolvedValueOnce({ status: "error", message: "Permission denied." })
      .mockResolvedValue({ status: "success" }),
  });
  await loaded();
  await user.click(select("Select Example 0"));
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(actions.mutate).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(screen.getByRole("button", { name: "Delete permanently" }));
  const dialog = await screen.findByRole("alertdialog");
  expect(within(dialog).getByText("Permission denied.")).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Delete permanently" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect(actions.mutate).toHaveBeenLastCalledWith("delete", ["entry-0"]);
});

test("RB-08: Empty explicitly covers other pages and current-search exclusions with no selected IDs", async () => {
  const { user, actions } = setup();
  await loaded();
  await user.click(screen.getByRole("button", { name: "Empty Recycle Bin" }));
  expect(
    screen.getByText(/including other pages and records outside the current search/),
  ).toBeTruthy();
  expect(actions.mutate).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Delete permanently" }));
  await waitFor(() => expect(actions.mutate).toHaveBeenCalledWith("empty", []));
});

test("paging delegates page/perPage and clears page selection", async () => {
  const { user, actions } = setup();
  await loaded();
  await user.click(select("Select all records"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText("Example 30");
  expect(actions.list).toHaveBeenLastCalledWith(initialBinSearch, 2, 30);
  expect(screen.getByText("Displaying 31 to 31 of 31")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Restore" }));
  expect(screen.getByText("Select at least one record.")).toBeTruthy();
  expect(actions.mutate).not.toHaveBeenCalled();
});

test("RB-11/13–22: inline operator/value rows submit criteria and preserve the draft", async () => {
  const { user, actions } = setup();
  await loaded();
  await user.click(screen.getByRole("button", { name: "Search" }));
  for (const name of [
    "Name operator",
    "Type operator",
    "Deleted By operator",
    "Deleted Time operator",
    "Type search",
  ])
    expect(screen.getByRole("button", { name: new RegExp(name) })).toBeTruthy();
  expect(
    (screen.getByRole("textbox", { name: "Deleted Time time" }) as HTMLInputElement).value,
  ).toBe("01:00");
  await user.type(screen.getByRole("textbox", { name: "Name search" }), "Example");
  await user.type(screen.getByRole("textbox", { name: "Deleted By search" }), "Demo");
  await user.click(screen.getByRole("button", { name: /Deleted By operator/ }));
  await user.click(screen.getByRole("option", { name: "is" }));
  await user.click(screen.getByRole("button", { name: /Type search/ }));
  await user.click(screen.getByRole("option", { name: "Contacts" }));
  await user.type(screen.getByRole("textbox", { name: "Deleted Time date" }), "17.10.2026");
  const searchButtons = screen.getAllByRole("button", { name: "Search" });
  await user.click(searchButtons[1] as HTMLElement);
  await waitFor(() =>
    expect(actions.list).toHaveBeenLastCalledWith(
      {
        ...initialBinSearch,
        name: "Example",
        module: "Contacts",
        deletedBy: "Demo",
        deletedByOperator: "is",
        date: "17.10.2026",
      },
      1,
      30,
    ),
  );
  expect((screen.getByRole("textbox", { name: "Name search" }) as HTMLInputElement).value).toBe(
    "Example",
  );
});

test("failed reads show an error and Retry recovers", async () => {
  const { user } = setup({
    list: vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ status: "success", entries: [], total: 0 }),
  });
  await screen.findByText("Unable to load the Recycle Bin. Try again.");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(screen.getByText("No deleted records.")).toBeTruthy();
});

test("fixture integration: restoring through the page makes the original record appear in its module list", async () => {
  const records = createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "demo",
    orgName: "Demo",
    role: "admin",
    userId: "test-admin",
  });
  const record = await records.create("Leads", {
    Last_Name: "Recovery Example",
    Company: "Example",
  });
  const view = (await records.listViews("Leads")).find((item) => item.id === "all-leads");
  if (!view) throw new Error("Missing all-records view");
  const query = { viewId: view.id, page: 1, perPage: 100 };
  await records.delete("Leads", [record.id]);
  expect((await records.list("Leads", query)).records.some((row) => row.id === record.id)).toBe(
    false,
  );
  const { user } = setup({
    list: async (_search, page, perPage) => ({
      status: "success",
      ...(await records.recycleBin.list({ page, perPage })),
    }),
    mutate: async (action, ids) => {
      if (action === "restore") await records.recycleBin.restore(ids);
      return { status: "success" };
    },
  });
  await screen.findByText("Recovery Example");
  await user.click(select("Select Recovery Example"));
  await user.click(screen.getByRole("button", { name: "Restore" }));
  await screen.findByText("Selected records restored.");
  expect(
    (await records.list("Leads", query)).records.find((row) => row.id === record.id)?.fields
      .Last_Name,
  ).toBe("Recovery Example");
  await screen.findByText("No deleted records.");
});

test("pending restore locks selection/actions and rejects duplicate presses", async () => {
  let finish: ((value: { status: "success" }) => void) | undefined;
  const { user, actions } = setup({
    mutate: vi.fn<BinActions["mutate"]>(
      () =>
        new Promise<{ status: "success" }>((resolve) => {
          finish = resolve;
        }),
    ),
  });
  await loaded();
  await user.click(select("Select Example 0"));
  const restore = screen.getByRole("button", { name: "Restore" });
  await user.click(restore);
  expect((restore as HTMLButtonElement).disabled).toBe(true);
  expect((select("Select Example 0") as HTMLInputElement).disabled).toBe(true);
  await user.click(restore);
  expect(actions.mutate).toHaveBeenCalledTimes(1);
  finish?.({ status: "success" });
  await screen.findByText("Selected records restored.");
});

test("deleting the last row of a later page reloads a valid page", async () => {
  let deleted = false;
  const { user, actions } = setup({
    list: vi.fn(async (_search, page) => ({
      status: "success" as const,
      entries: deleted ? [] : entries.slice((page - 1) * 30, page * 30),
      total: deleted ? 0 : 31,
    })),
    mutate: vi.fn(async () => {
      deleted = true;
      return { status: "success" as const };
    }),
  });
  await loaded();
  await user.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText("Example 30");
  await user.click(select("Select Example 30"));
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(screen.getByRole("button", { name: "Delete permanently" }));
  await waitFor(() => expect(actions.list).toHaveBeenLastCalledWith(initialBinSearch, 1, 30));
  expect(screen.getByText("Displaying 0 to 0 of 0")).toBeTruthy();
});
