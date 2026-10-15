import { ValidationError } from "@crm/core/errors";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { KanbanSettingsDialog, type KanbanSettingsDialogProps } from "./kanban-settings-dialog";

afterEach(cleanup);
function props(overrides: Partial<KanbanSettingsDialogProps> = {}): KanbanSettingsDialogProps {
  return {
    open: true,
    mode: "edit",
    initial: {
      name: "STAGEVIEW",
      categorizeBy: "Stage",
      aggregateBy: "Amount",
      headerStyle: "mono_color",
      fields: ["Deal_Name", "Stage"],
    },
    categorizeOptions: [
      { value: "Stage", label: "Stage" },
      { value: "Type", label: "Type" },
    ],
    aggregateOptions: [{ value: "Amount", label: "Amount" }],
    headerStyleOptions: [{ value: "mono_color", label: "Mono Color" }],
    fieldOptions: [
      { apiName: "Deal_Name", label: "Deal Name", required: true },
      { apiName: "Stage", label: "Stage" },
      { apiName: "Amount", label: "Amount" },
      { apiName: "Description", label: "Description" },
    ],
    onSave: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    ...overrides,
  };
}
it("fills controls, filters available fields and transfers fields in order", async () => {
  const options = props();
  const user = userEvent.setup();
  render(<KanbanSettingsDialog {...options} />);
  expect(screen.getByRole("dialog", { name: "Kanban View - Settings" })).toBeTruthy();
  const name = screen.getByRole("textbox", { name: "Kanban View Name" });
  await waitFor(() => expect(document.activeElement).toBe(name));
  await user.clear(name);
  await user.type(name, " New view ");
  await user.click(screen.getByRole("button", { name: /Categorize By$/ }));
  await user.click(screen.getByRole("option", { name: "Type" }));
  await user.click(screen.getByRole("button", { name: /Aggregate By$/ }));
  await user.click(screen.getByRole("option", { name: "--None--" }));
  await user.type(screen.getByRole("textbox", { name: "Search available fields" }), "aMo");
  expect(screen.queryByRole("button", { name: "Add Description" })).toBeNull();
  const add = screen.getByRole("button", { name: "Add Amount" });
  add.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("button", { name: "Required Deal Name" }).hasAttribute("disabled")).toBe(
    true,
  );
  await user.click(screen.getByRole("button", { name: "Remove Stage" }));
  expect(within(screen.getByRole("dialog")).queryByText("0")).toBeNull();
  expect(
    within(screen.getByRole("list", { name: "Selected" }))
      .getAllByRole("button")
      .map((button) => button.textContent),
  ).toEqual(["Deal Name*", "Amount"]);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(options.onSave).toHaveBeenCalledWith({
    name: "New view",
    categorizeBy: "Type",
    aggregateBy: null,
    headerStyle: "mono_color",
    fields: ["Deal_Name", "Amount"],
  });
  expect(options.initial.name).toBe("STAGEVIEW");
});
it("shows client and server field errors and a retryable unexpected error", async () => {
  const options = props({
    onSave: vi
      .fn()
      .mockRejectedValueOnce(new ValidationError({ name: ["Already exists"] }))
      .mockRejectedValueOnce(new Error("offline")),
  });
  const user = userEvent.setup();
  render(<KanbanSettingsDialog {...options} />);
  const name = screen.getByRole("textbox", { name: "Kanban View Name" });
  await user.clear(name);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByText("Enter a Kanban view name.")).toBeTruthy();
  expect(options.onSave).not.toHaveBeenCalled();
  await user.type(name, "View");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Already exists")).toBeTruthy();
  expect(name.getAttribute("aria-invalid")).toBe("true");
  await user.type(name, "2");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Unable to save the Kanban view. Try again.")).toBeTruthy();
});
it("locks Save while pending and traps keyboard focus", async () => {
  let finish = () => {};
  const options = props({
    onSave: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    ),
  });
  const user = userEvent.setup();
  render(<KanbanSettingsDialog {...options} />);
  for (let i = 0; i < 15; i++) {
    await user.tab();
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
  }
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(options.onSave).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(false),
  );
});
it("Cancel and Escape discard edits; reopening resets draft; closed dialog is absent", async () => {
  const options = props();
  const user = userEvent.setup();
  const { rerender } = render(<KanbanSettingsDialog {...options} />);
  await user.type(screen.getByRole("textbox", { name: "Kanban View Name" }), " changed");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(options.onCancel).toHaveBeenCalledTimes(1);
  rerender(<KanbanSettingsDialog {...options} open={false} />);
  expect(screen.queryByRole("dialog")).toBeNull();
  rerender(<KanbanSettingsDialog {...options} mode="create" />);
  expect(
    (screen.getByRole("textbox", { name: "Kanban View Name" }) as HTMLInputElement).value,
  ).toBe("STAGEVIEW");
  await user.keyboard("{Escape}");
  expect(options.onCancel).toHaveBeenCalledTimes(2);
  expect(options.onSave).not.toHaveBeenCalled();
});
it("requires grouping and header style and restores required selected fields", async () => {
  const options = props({
    initial: { name: "View", categorizeBy: "", aggregateBy: null, headerStyle: "", fields: [] },
  });
  const user = userEvent.setup();
  render(<KanbanSettingsDialog {...options} />);
  expect(screen.getByRole("button", { name: "Required Deal Name" })).toBeTruthy();
  expect(screen.getByRole("button", { name: /Aggregate By$/ }).textContent).toContain("--None--");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByText("Select a field.")).toBeTruthy();
  expect(screen.getByText("Select a header style.")).toBeTruthy();
  expect(options.onSave).not.toHaveBeenCalled();
});
