import type { ExportJob, ImportJob, TransferModule } from "@crm/core";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ExportHistoryScreen, ImportHistoryScreen } from "./transfer-screens";

const state = vi.hoisted(() => ({
  data: undefined as ImportJob[] | ExportJob[] | undefined,
  isLoading: false,
  isError: true,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/lib/api/client/provider", () => ({ useOrgSlug: () => "test-org" }));
vi.mock("@/lib/api/client/hooks", () => ({
  useTransferClient: () => ({ exportDownloadUrl: (id: string) => `/exports/${id}` }),
  useImportHistory: () => state,
  useExportHistory: () => state,
}));
afterEach(() => {
  cleanup();
  state.data = undefined;
  state.isError = true;
});

test.each([
  { Screen: ImportHistoryScreen, label: "Import", empty: "No imports in the last 7 days." },
  { Screen: ExportHistoryScreen, label: "Export", empty: "No exports in the last 7 days." },
])(
  "$label history does not present a failed request as empty history",
  ({ Screen, label, empty }) => {
    render(<Screen />);
    expect(screen.getByRole("alert").textContent).toBe(
      `${label} history could not be loaded. Try again.`,
    );
    expect(screen.queryByText(empty)).toBeNull();
  },
);

const activityModules: { module: TransferModule; label: string }[] = [
  { module: "Tasks", label: "Tasks" },
  { module: "Calls", label: "Calls" },
  { module: "Events", label: "Meetings" },
];

test.each(activityModules)("import history labels $module as $label", ({ module, label }) => {
  state.isError = false;
  state.data = [
    {
      id: "import-1",
      module,
      fileName: "activities.csv",
      createdBy: { id: "user-1", name: "Test User" },
      createdAt: "2026-10-14T10:00:00Z",
      status: "completed",
      counts: { created: 1, updated: 0, skipped: 0, errors: 0 },
      undoable: false,
      rows: [],
    },
  ];
  render(<ImportHistoryScreen />);
  expect(screen.getByRole("cell", { name: label })).toBeTruthy();
});

test.each(activityModules)("export history labels $module as $label", ({ module, label }) => {
  state.isError = false;
  state.data = [
    {
      id: "export-1",
      module,
      fileName: "activities.csv",
      scope: "Selected records",
      createdBy: { id: "user-1", name: "Test User" },
      createdAt: "2026-10-14T10:00:00Z",
      status: "completed",
      rowCount: 1,
    },
  ];
  render(<ExportHistoryScreen />);
  expect(screen.getByRole("cell", { name: label })).toBeTruthy();
});
