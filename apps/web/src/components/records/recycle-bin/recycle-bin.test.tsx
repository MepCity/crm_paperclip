import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { RecycleBin, type RecycleBinProps, type RecycleBinRow } from "./recycle-bin";

afterEach(cleanup);
const rows: RecycleBinRow[] = [
  {
    id: "one",
    name: "Sample lead",
    type: "Leads",
    deletedBy: "Demo User",
    deletedTime: "Oct 15, 2026",
  },
  {
    id: "two",
    name: "Sample note",
    type: "Notes",
    deletedBy: "Demo Editor",
    deletedTime: "Oct 14, 2026",
  },
];
function setup(overrides: Partial<RecycleBinProps> = {}) {
  const props = {
    rows,
    onRestore: vi.fn(),
    onDelete: vi.fn(),
    onEmpty: vi.fn(),
    onHelp: vi.fn(),
    ...overrides,
  };
  const view = render(<RecycleBin {...props} />);
  return { ...view, props, user: userEvent.setup() };
}
const checkbox = (name: string) => screen.getByRole("checkbox", { name }) as HTMLInputElement;

test("RB-05–RB-12: renders policy, controls, range, columns and independent scrolling", async () => {
  const { user, props } = setup();
  expect(screen.getByRole("heading", { name: "Recycle Bin" })).toBeTruthy();
  for (const text of [
    /60 days/,
    /administrator profile/,
    /appropriate permissions/,
    /Mass restore excludes/,
  ])
    expect(screen.getByText(text)).toBeTruthy();
  for (const name of ["Restore", "Delete", "Empty Recycle Bin", "Search"])
    expect((screen.getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(false);
  await user.click(screen.getByRole("button", { name: "Help" }));
  expect(props.onHelp).toHaveBeenCalledOnce();
  expect(screen.getByText("Displaying 1 to 2 of 2")).toBeTruthy();
  const table = screen.getByRole("table", { name: "Recycle Bin records" });
  for (const name of ["Name", "Type", "Deleted By", "Deleted Time"])
    expect(within(table).getByRole("columnheader", { name })).toBeTruthy();
  expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  expect(screen.getAllByRole("checkbox").every((node) => !(node as HTMLInputElement).checked)).toBe(
    true,
  );
  const scroll = screen.getByRole("region", { name: "Deleted records" });
  expect(scroll.className).toContain("overflow-auto");
  expect(scroll.tabIndex).toBe(0);
  await user.click(screen.getByRole("button", { name: "Search" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("row and select-all selection toggle; callbacks receive selected ids in row order", async () => {
  const { user, props } = setup();
  await user.click(checkbox("Select Sample note"));
  expect(checkbox("Select all records").checked).toBe(false);
  for (const name of ["Restore", "Delete", "Empty Recycle Bin"])
    await user.click(screen.getByRole("button", { name }));
  for (const callback of [props.onRestore, props.onDelete, props.onEmpty])
    expect(callback).toHaveBeenLastCalledWith(["two"]);
  await user.click(checkbox("Select all records"));
  expect(screen.getAllByRole("checkbox").every((node) => (node as HTMLInputElement).checked)).toBe(
    true,
  );
  await user.click(screen.getByRole("button", { name: "Restore" }));
  expect(props.onRestore).toHaveBeenLastCalledWith(["one", "two"]);
  await user.click(checkbox("Select Sample lead"));
  expect(checkbox("Select all records").checked).toBe(false);
  await user.click(checkbox("Select all records"));
  await user.click(checkbox("Select all records"));
  expect(screen.getAllByRole("checkbox").every((node) => !(node as HTMLInputElement).checked)).toBe(
    true,
  );
});

test("callbacks exclude rows removed by the caller", async () => {
  const { user, props, rerender } = setup();
  await user.click(checkbox("Select all records"));
  rerender(<RecycleBin {...props} rows={rows.slice(1)} />);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(props.onDelete).toHaveBeenCalledWith(["two"]);
});

test("unobserved empty state uses a neutral message and callbacks receive empty selection", async () => {
  const { user, props } = setup({ rows: [] });
  expect(screen.getByText("No deleted records.")).toBeTruthy();
  expect(screen.getByText("Displaying 0 to 0 of 0")).toBeTruthy();
  expect(checkbox("Select all records").checked).toBe(false);
  for (const name of ["Restore", "Delete", "Empty Recycle Bin"])
    await user.click(screen.getByRole("button", { name }));
  for (const callback of [props.onRestore, props.onDelete, props.onEmpty])
    expect(callback).toHaveBeenCalledWith([]);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("row selection works with the keyboard", async () => {
  const { user } = setup();
  checkbox("Select Sample lead").focus();
  await user.keyboard(" ");
  expect(checkbox("Select Sample lead").checked).toBe(true);
});
