import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { ExportDialog } from "./export-dialog";
import type { ExportDialogProps, ExportJob } from "./types";

const job: ExportJob = {
  id: "e1",
  module: "Leads",
  scope: "All Leads",
  createdBy: { id: "u", name: "U" },
  createdAt: "2026-10-15T00:00:00Z",
  status: "completed",
  rowCount: 2,
  fileName: "leads.csv",
};
const fields = Array.from({ length: 25 }, (_, i) => ({ apiName: `F${i}`, label: `Field ${i}` }));

function setup(overrides: Partial<ExportDialogProps> = {}) {
  const onExport = vi.fn().mockResolvedValue(job);
  const onOpenChange = vi.fn();
  render(
    <ToastProvider>
      <ExportDialog
        open
        onOpenChange={onOpenChange}
        module="Leads"
        moduleLabel="Leads"
        views={[
          { id: "v1", name: "All Leads" },
          { id: "v2", name: "My Leads" },
        ]}
        fields={fields}
        onExport={onExport}
        historyHref="/history"
        {...overrides}
      />
    </ToastProvider>,
  );
  return { onExport, onOpenChange, user: userEvent.setup() };
}

afterEach(cleanup);

test("exports the first view with all fields by default", async () => {
  const { onExport, user, onOpenChange } = setup();
  expect(screen.getByText("Export Leads")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Export" }));
  await waitFor(() =>
    expect(onExport).toHaveBeenCalledWith({ module: "Leads", viewId: "v1", fields: "all" }),
  );
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  expect(await screen.findByText("Export completed")).toBeTruthy();
});

test("uses defaultViewId", async () => {
  const { onExport, user } = setup({ defaultViewId: "v2" });
  await user.click(screen.getByRole("button", { name: "Export" }));
  await waitFor(() => expect(onExport.mock.calls[0][0].viewId).toBe("v2"));
});

test("selected records hide the view picker and send ids", async () => {
  const { onExport, user } = setup({ selectedIds: ["a", "b"] });
  expect(screen.getByText("Selected records (2)")).toBeTruthy();
  expect(screen.queryByText("Select view")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Export" }));
  await waitFor(() =>
    expect(onExport).toHaveBeenCalledWith({ module: "Leads", ids: ["a", "b"], fields: "all" }),
  );
});

test("choose fields disables Export until something is picked and caps at 200", async () => {
  const { onExport, user } = setup();
  await user.click(screen.getByRole("radio", { name: "Choose fields" }));
  const exportButton = screen.getByRole("button", { name: "Export" });
  expect(
    exportButton.hasAttribute("disabled") || exportButton.getAttribute("aria-disabled") === "true",
  ).toBe(true);
  expect(screen.getByText("0 of 200")).toBeTruthy();
  await user.click(screen.getByRole("checkbox", { name: "Field 0" }));
  expect(screen.getByText("1 of 200")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Export" }));
  await waitFor(() => expect(onExport.mock.calls[0][0].fields).toEqual({ include: ["F0"] }));
});

test("limit: 20 excluded then remaining options are disabled", async () => {
  const { user } = setup();
  await user.click(screen.getByRole("radio", { name: "Exclude fields" }));
  for (let i = 0; i < 20; i++)
    await user.click(screen.getByRole("checkbox", { name: `Field ${i}` }));
  expect(screen.getByText("20 of 20")).toBeTruthy();
  const next = screen.getByRole("checkbox", { name: "Field 20" }) as HTMLInputElement;
  expect(next.disabled).toBe(true);
});

test("exclude mode sends exclude list; Export stays enabled when empty", async () => {
  const { onExport, user } = setup();
  await user.click(screen.getByRole("radio", { name: "Exclude fields" }));
  await user.click(screen.getByRole("checkbox", { name: "Field 3" }));
  await user.click(screen.getByRole("button", { name: "Export" }));
  await waitFor(() => expect(onExport.mock.calls[0][0].fields).toEqual({ exclude: ["F3"] }));
});

test("shows the mapped error and stays open", async () => {
  const onExport = vi.fn().mockRejectedValue({ code: "export_too_large" });
  const { user, onOpenChange } = setup({ onExport });
  await user.click(screen.getByRole("button", { name: "Export" }));
  expect(
    await screen.findByText("Too many records to export (limit 30,000). Narrow the view."),
  ).toBeTruthy();
  expect(onOpenChange).not.toHaveBeenCalledWith(false);
  expect(screen.getByText("Export Leads")).toBeTruthy();
});

test("XLSX is disabled and Cancel closes", async () => {
  const { user, onOpenChange } = setup();
  expect(screen.getByText("XLSX").getAttribute("aria-disabled")).toBe("true");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
