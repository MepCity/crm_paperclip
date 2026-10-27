import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ExportHistory } from "./export-history";
import { ImportHistory } from "./import-history";
import type { ExportJob, ImportJob } from "./types";

afterEach(cleanup);
const label = (m: string) => m;
const actor = { id: "u1", name: "Ada" };
function imp(over: Partial<ImportJob> = {}): ImportJob {
  return {
    id: "i1",
    module: "Leads",
    fileName: "leads.csv",
    createdBy: actor,
    createdAt: "2026-10-14T10:00:00Z",
    status: "completed_with_errors",
    counts: { created: 3, updated: 1, skipped: 1, errors: 1 },
    undoable: true,
    rows: [
      { row: 4, outcome: "error", code: "required_missing", field: "Last_Name" },
      { row: 6, outcome: "skipped", code: "duplicate_in_file" },
    ],
    ...over,
  };
}
function exp(over: Partial<ExportJob> = {}): ExportJob {
  return {
    id: "e1",
    module: "Leads",
    scope: "All Leads",
    createdBy: actor,
    createdAt: "2026-10-14T10:00:00Z",
    status: "completed",
    rowCount: 10,
    fileName: "leads.csv",
    ...over,
  };
}
function renderImports(
  jobs: ImportJob[],
  over: { canUndo?: boolean; onUndo?: () => Promise<void> } = {},
) {
  return render(
    <ImportHistory
      jobs={jobs}
      onUndo={over.onUndo ?? (async () => {})}
      canUndo={() => over.canUndo ?? true}
      moduleLabel={label}
    />,
  );
}

test("import history empty state uses the tabbed panel without a retention note", () => {
  renderImports([]);
  expect(screen.getByRole("tab", { name: "Import History" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(within(screen.getByRole("tabpanel")).getByText("No recent imports")).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByText("Import history is kept for 7 days.")).toBeNull();
});

test("status labels", () => {
  renderImports([
    imp({ id: "a", status: "completed" }),
    imp({ id: "b", status: "failed" }),
    imp({ id: "c", status: "undone" }),
    imp({ id: "d" }),
  ]);
  for (const t of ["Completed", "Failed", "Undone", "Completed with errors"]) {
    expect(screen.getAllByText(t).length).toBe(1);
  }
});

test("View Details lists skipped and error rows with readable reasons", async () => {
  const user = userEvent.setup();
  renderImports([imp()]);
  await user.click(screen.getByRole("button", { name: "View Details" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("A required value is missing.")).toBeTruthy();
  expect(within(dialog).getByText("Last_Name")).toBeTruthy();
  expect(within(dialog).getByText("This record appears more than once in the file.")).toBeTruthy();
});

test.each([
  ["not undoable", { undoable: false }, true],
  ["no created rows", { counts: { created: 0, updated: 1, skipped: 0, errors: 0 } }, true],
  ["canUndo false", {}, false],
])("Undo hidden: %s", (_n, over, can) => {
  renderImports([imp(over as Partial<ImportJob>)], { canUndo: can });
  expect(screen.queryByRole("button", { name: "Undo Import" })).toBeNull();
});

test("Undo confirm, cancel and error", async () => {
  const user = userEvent.setup();
  const onUndo = vi.fn().mockRejectedValueOnce(new Error("Nope")).mockResolvedValue(undefined);
  renderImports([imp()], { onUndo });
  await user.click(screen.getByRole("button", { name: "Undo Import" }));
  let dlg = await screen.findByRole("alertdialog");
  expect(within(dlg).getByText(/delete the 3 records added/)).toBeTruthy();
  await user.click(within(dlg).getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect(onUndo).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Undo Import" }));
  dlg = await screen.findByRole("alertdialog");
  await user.click(within(dlg).getByRole("button", { name: "Undo Import" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Nope");
  await user.click(
    within(screen.getByRole("alertdialog")).getByRole("button", { name: "Undo Import" }),
  );
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect(onUndo).toHaveBeenCalledTimes(2);
});

test("export history empty, download, retry", async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  const { unmount } = render(
    <ExportHistory jobs={[]} downloadHref={() => "/x"} onRetry={onRetry} moduleLabel={label} />,
  );
  expect(screen.getByText("No exports in the last 7 days.")).toBeTruthy();
  unmount();
  render(
    <ExportHistory
      jobs={[exp(), exp({ id: "e2", status: "failed", code: "export_too_large" })]}
      downloadHref={(j) => `/dl/${j.id}`}
      onRetry={onRetry}
      moduleLabel={label}
    />,
  );
  const link = screen.getByRole("link", { name: "Download" });
  expect(link.getAttribute("href")).toBe("/dl/e1");
  expect(link.hasAttribute("download")).toBe(true);
  expect(screen.getByText("There are too many records to export.")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "e2" }));
});

test("export module filter", async () => {
  const user = userEvent.setup();
  render(
    <ExportHistory
      jobs={[exp(), exp({ id: "e3", module: "Deals", scope: "Open Deals" })]}
      downloadHref={() => "/x"}
      onRetry={() => {}}
      moduleLabel={label}
    />,
  );
  await user.click(screen.getByRole("button", { name: /Module/ }));
  await user.click(await screen.findByRole("option", { name: "Deals" }));
  expect(screen.queryByText("All Leads")).toBeNull();
  expect(screen.getByText("Open Deals")).toBeTruthy();
});

test("loading state displays skeleton", () => {
  const { unmount } = render(
    <ImportHistory
      jobs={[]}
      loading
      onUndo={async () => {}}
      canUndo={() => true}
      moduleLabel={label}
    />,
  );
  expect(screen.getByRole("status")).toBeTruthy();
  expect(screen.getByText("Loading")).toBeTruthy();
  unmount();

  render(
    <ExportHistory
      jobs={[]}
      loading
      downloadHref={() => "/x"}
      onRetry={() => {}}
      moduleLabel={label}
    />,
  );
  expect(screen.getByRole("status")).toBeTruthy();
  expect(screen.getByText("Loading")).toBeTruthy();
});
