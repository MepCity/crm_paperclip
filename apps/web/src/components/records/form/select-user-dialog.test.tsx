import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { SelectUserDialog, type SelectUserRecord } from "./select-user-dialog";

afterEach(cleanup);

const users: SelectUserRecord[] = [
  { id: "a", name: "Alpha User", email: "alpha@example.test", role: "Admin" },
  { id: "b", name: "Beta User", email: "beta@example.test" },
  { id: "c", name: "Gamma User", email: "gamma@example.test", profile: "Standard" },
];

const labels = {
  title: "Select User",
  searchLabel: "Search Users",
  searchPlaceholder: "Search Users",
  selectedUserLabel: "Selected User:",
  selectColumnLabel: "Select",
  columnUserName: "User Name",
  columnRole: "Role",
  columnEmail: "Email",
  columnProfile: "Profile",
  cancelLabel: "Cancel",
  doneLabel: "Done",
};

function renderDialog(selectedId = "a", onDone = vi.fn(), onCancel = vi.fn()) {
  render(
    <SelectUserDialog
      {...labels}
      users={users}
      selectedId={selectedId}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );
  return { onDone, onCancel };
}

test("opens with search focused and Done disabled until selection changes", async () => {
  const user = userEvent.setup();
  renderDialog("a");
  expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Search Users" }));
  const done = screen.getByRole("button", { name: "Done" }) as HTMLButtonElement;
  expect(done.disabled).toBe(true);
  await user.click(screen.getByRole("radio", { name: "Beta User" }));
  expect(done.disabled).toBe(false);
});

test("Done calls onDone with the chosen id", async () => {
  const user = userEvent.setup();
  const onDone = vi.fn();
  renderDialog("a", onDone);
  await user.click(screen.getByRole("radio", { name: "Beta User" }));
  await user.click(screen.getByRole("button", { name: "Done" }));
  expect(onDone).toHaveBeenCalledWith("b");
});

test("Cancel and Escape close without onDone", async () => {
  const user = userEvent.setup();
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderDialog("a", onDone, onCancel);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onCancel).toHaveBeenCalled();
  expect(onDone).not.toHaveBeenCalled();

  onCancel.mockClear();
  renderDialog("a", onDone, onCancel);
  await user.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalled();
  expect(onDone).not.toHaveBeenCalled();
});

test("backdrop click does not call onCancel", async () => {
  const onCancel = vi.fn();
  renderDialog("a", vi.fn(), onCancel);
  const overlay = document.querySelector(".top-aligned-modal-overlay");
  expect(overlay).toBeTruthy();
  overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onCancel).not.toHaveBeenCalled();
});

test("keyboard moves radio selection within the group", async () => {
  const user = userEvent.setup();
  renderDialog("a");
  const alpha = screen.getByRole("radio", { name: "Alpha User" }) as HTMLInputElement;
  const beta = screen.getByRole("radio", { name: "Beta User" }) as HTMLInputElement;
  await user.click(screen.getByRole("textbox", { name: "Search Users" }));
  alpha.focus();
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(beta);
  expect(beta.checked).toBe(true);
});

test("search filters by name or email and shows an empty table when nothing matches", async () => {
  const user = userEvent.setup();
  renderDialog("a");
  const search = screen.getByRole("textbox", { name: "Search Users" });
  await user.type(search, "gamma");
  expect(screen.getByRole("radio", { name: "Gamma User" })).toBeTruthy();
  expect(screen.queryByRole("radio", { name: "Alpha User" })).toBeNull();
  await user.clear(search);
  await user.type(search, "beta@");
  expect(screen.getByRole("radio", { name: "Beta User" })).toBeTruthy();
  await user.clear(search);
  await user.type(search, "zzz");
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
});

test("empty role and profile cells stay blank", () => {
  renderDialog("b");
  const row = screen.getByRole("radio", { name: "Beta User" }).closest("tr");
  expect(row?.textContent).not.toContain("undefined");
  const cells = row?.querySelectorAll("td") ?? [];
  expect(cells[3]?.textContent).toBe("");
  expect(cells[5]?.textContent).toBe("");
});

test("keeps focus inside the dialog while open", async () => {
  const user = userEvent.setup();
  renderDialog("a");
  const dialog = screen.getByRole("dialog");
  expect(dialog.contains(document.activeElement)).toBe(true);
  await user.tab();
  expect(dialog.contains(document.activeElement)).toBe(true);
});

test("returns focus to the previously focused control on close", async () => {
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.textContent = "Open owner picker";
  document.body.append(trigger);
  trigger.focus();

  const view = render(
    <SelectUserDialog
      {...labels}
      users={users}
      selectedId="a"
      onDone={vi.fn()}
      onCancel={vi.fn()}
    />,
  );
  view.unmount();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  trigger.remove();
});
