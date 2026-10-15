import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ExportHistoryScreen, ImportHistoryScreen } from "./transfer-screens";

const state = vi.hoisted(() => ({ data: undefined, isLoading: false, isError: true }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/lib/api/client/provider", () => ({ useOrgSlug: () => "test-org" }));
vi.mock("@/lib/api/client/hooks", () => ({
  useTransferClient: () => ({}),
  useImportHistory: () => state,
  useExportHistory: () => state,
}));
afterEach(cleanup);

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
