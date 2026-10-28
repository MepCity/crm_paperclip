import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ImportWizard } from "./import-wizard";
import type { ImportJob, ImportPreview, ImportWizardClient } from "./types";

afterEach(cleanup);

const preview: ImportPreview = {
  uploadId: "u1",
  fileName: "a.csv",
  charset: "UTF-8",
  headers: ["Email"],
  sampleRows: [["a@b.test"]],
  rowCount: 1,
  suggestedMapping: [{ column: 0, field: "Email" }],
  fields: [{ apiName: "Email", label: "Email", required: false, type: "email" }],
  matchFields: [
    { field: "Email", label: "Email" },
    { field: "id", label: "Record Id" },
  ],
};

function job(over: Partial<ImportJob> = {}): ImportJob {
  return {
    id: "j",
    module: "Leads",
    fileName: "a.csv",
    createdBy: { id: "u", name: "U" },
    createdAt: "2026-01-01T00:00:00Z",
    status: "completed",
    counts: { created: 2, updated: 1, skipped: 0, errors: 0 },
    undoable: true,
    rows: [],
    ...over,
  };
}

function setup(client: Partial<ImportWizardClient> = {}) {
  const full: ImportWizardClient = {
    sampleCsvUrl: "/sample.csv",
    preview: vi.fn().mockResolvedValue(preview),
    run: vi.fn().mockResolvedValue(job()),
    ...client,
  };
  const onCancel = vi.fn();
  const onDone = vi.fn();
  render(
    <ImportWizard
      module="Leads"
      moduleLabel="Leads"
      client={full}
      onCancel={onCancel}
      onDone={onDone}
      historyHref="/history"
    />,
  );
  return { full, onCancel, onDone };
}

const csv = () => new File(["Email\na@b.test"], "a.csv", { type: "text/csv" });
const input = () => screen.getByTestId("csv-input") as HTMLInputElement;
const next = () => screen.getByRole("button", { name: "Next" });

async function toStep2(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(input(), csv());
  await user.click(next());
  await screen.findByText("How should records be handled?");
}

test("Next is disabled until a file is chosen", async () => {
  const user = userEvent.setup();
  setup();
  expect(next().hasAttribute("disabled") || next().getAttribute("aria-disabled") === "true").toBe(
    true,
  );
  await user.upload(input(), csv());
  expect(next().hasAttribute("disabled")).toBe(false);
});

test("non-CSV file shows an error", async () => {
  const user = userEvent.setup({ applyAccept: false });
  setup();
  await user.upload(input(), new File(["x"], "a.xlsx"));
  expect(screen.getByText("Only CSV files are supported.")).toBeTruthy();
});

test("preview error code is shown readably", async () => {
  const user = userEvent.setup();
  setup({ preview: vi.fn().mockRejectedValue({ code: "file_too_large" }) });
  await user.upload(input(), csv());
  await user.click(next());
  expect(await screen.findByText("File exceeds the 25 MB limit.")).toBeTruthy();
});

test("Notify Email checkbox is disabled for a later module", () => {
  setup();
  const box = screen.getByRole("checkbox", { name: /Notify me by email/ });
  expect(box.getAttribute("data-later-module")).toBe("M10");
});

test("mode change reveals match field and checkbox; Back keeps state; Import sends settings", async () => {
  const user = userEvent.setup();
  const { full } = setup();
  await toStep2(user);
  expect(screen.queryByText("Find existing records by")).toBeNull();
  await user.click(screen.getByRole("radio", { name: "Both" }));
  expect(screen.getByText("Find existing records by")).toBeTruthy();
  const ignore = screen.getByRole("checkbox", { name: /Don't update empty/ }) as HTMLInputElement;
  expect(ignore.checked).toBe(true);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect((screen.getByRole("radio", { name: "Both" }) as HTMLInputElement).checked).toBe(true);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Import" }));
  await screen.findByText("Import completed");
  expect(full.run).toHaveBeenCalledWith("u1", {
    mode: "both",
    matchField: "Email",
    ignoreEmptyOnUpdate: true,
    mapping: preview.suggestedMapping,
    defaults: [],
  });
});

test("summary shows counts and truncates error rows at 50", async () => {
  const user = userEvent.setup();
  const rows = Array.from({ length: 53 }, (_, i) => ({
    row: i + 2,
    outcome: "error" as const,
    code: "invalid_value",
    field: "Email",
  }));
  const { onDone } = setup({
    run: vi.fn().mockResolvedValue(
      job({
        status: "completed_with_errors",
        counts: { created: 2, updated: 1, skipped: 0, errors: 53 },
        rows,
      }),
    ),
  });
  await toStep2(user);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Import" }));
  await screen.findByText("Import completed with errors");
  expect(screen.getByTestId("count-added").textContent).toBe("2");
  expect(screen.getByTestId("count-updated").textContent).toBe("1");
  expect(screen.getAllByRole("row")).toHaveLength(51);
  expect(screen.getByText("and 3 more")).toBeTruthy();
  expect(screen.getByRole("link", { name: "View import history" }).getAttribute("href")).toBe(
    "/history",
  );
  await user.click(screen.getByRole("button", { name: "Done" }));
  expect(onDone).toHaveBeenCalled();
});

test("Cancel with a file asks for confirmation; without a file cancels directly", async () => {
  const user = userEvent.setup();
  const { onCancel } = setup();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  await user.upload(input(), csv());
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(await screen.findByText("Discard this import?")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await user.click(await screen.findByRole("button", { name: "Discard" }));
  await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(2));
});

test("default match field skips the record id entry", async () => {
  const user = userEvent.setup();
  const idFirst = {
    ...preview,
    matchFields: [
      { field: "id", label: "Record Id" },
      { field: "Email", label: "Email" },
    ],
  };
  const { full } = setup({ preview: vi.fn().mockResolvedValue(idFirst) });
  await toStep2(user);
  await user.click(screen.getByRole("radio", { name: "Both" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Import" }));
  await screen.findByText("Import completed");
  expect(vi.mocked(full.run).mock.calls[0]?.[1].matchField).toBe("Email");
});

test("file size uses the decimal 25 MB server budget before preview", async () => {
  const user = userEvent.setup();
  const { full } = setup();
  const file = csv();
  Object.defineProperty(file, "size", { value: 25_000_001, configurable: true });
  await user.upload(input(), file);
  expect(screen.getByRole("alert").textContent).toBe("File exceeds the 25 MB limit.");
  expect(full.preview).not.toHaveBeenCalled();
  Object.defineProperty(file, "size", { value: 25_000_000 });
  await user.upload(input(), file);
  await user.click(next());
  await screen.findByText("How should records be handled?");
  expect(full.preview).toHaveBeenCalledWith(file, "UTF-8");
});

test("a duplicate-header failure explains itself instead of the generic message", async () => {
  const user = userEvent.setup();
  setup({ preview: vi.fn().mockRejectedValue({ code: "malformed_csv" }) });
  await user.upload(input(), csv());
  await user.click(next());
  expect(await screen.findByText("The file is not a valid CSV file.")).toBeTruthy();
  expect(screen.queryByText("Something went wrong. Try again.")).toBeNull();
});

test("summary counts skipped as skipped plus failed and lists values left empty", async () => {
  const user = userEvent.setup();
  setup({
    run: vi.fn().mockResolvedValue(
      job({
        status: "completed_with_errors",
        counts: { created: 10, updated: 0, skipped: 2, errors: 1, warnings: 1 },
        rows: [
          { row: 3, outcome: "skipped", code: "already_exists" },
          { row: 4, outcome: "error", code: "required_missing", field: "Last_Name" },
          { row: 5, outcome: "warning", code: "value_cleared", field: "Billing_State" },
        ],
      }),
    ),
  });
  await toStep2(user);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Import" }));
  await screen.findByText("Import completed with errors");
  expect(screen.getByTestId("count-skipped").textContent).toBe("3");
  expect(screen.getByTestId("count-failed").textContent).toBe("1");
  expect(screen.getByTestId("count-warnings").textContent).toBe("1");
  expect(screen.getByText("Rows imported with a value left empty")).toBeTruthy();
  expect(screen.getByText("Billing_State")).toBeTruthy();
});

test("steps run in the documented order: upload, record handling, field mapping", () => {
  setup();
  const steps = screen.getAllByRole("listitem").map((item) => item.textContent);
  expect(steps).toEqual(["1. Upload File", "2. Record Handling", "3. Field Mapping"]);
});
