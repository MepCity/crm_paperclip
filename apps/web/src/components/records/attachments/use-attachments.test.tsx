import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/api/client/fetch", () => ({ apiFetch, CRM_ORG_HEADER: "x-crm-org" }));
vi.mock("@/lib/api/client/provider", () => ({ useOrgSlug: () => "org" }));

import {
  BUDGET_MESSAGE,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  useAttachments,
  withinBudget,
} from "./use-attachments";

test("budget allows 10 files and 100 MB combined", () => {
  const ten = Array.from({ length: MAX_FILES }, () => ({ size: MAX_TOTAL_BYTES / MAX_FILES }));
  expect(withinBudget(ten)).toBe(true);
});

test("budget rejects an eleventh file or one byte over", () => {
  expect(withinBudget(Array.from({ length: MAX_FILES + 1 }, () => ({ size: 1 })))).toBe(false);
  expect(withinBudget([{ size: MAX_TOTAL_BYTES }, { size: 1 }])).toBe(false);
});

test("budget toast text matches the reference wording", () => {
  expect(BUDGET_MESSAGE).toBe(
    "You can attach up to 10 files with a total size of 100 MB at a time.",
  );
});

test("events grow after loadMore (timeline covers only loaded pages)", async () => {
  const item = (n: number) => ({
    id: `a${n}`,
    File_Name: `f${n}.pdf`,
    Size: 1,
    $type: "file",
    Created_Time: "2026-10-01T00:00:00Z",
    Created_By: null,
  });
  apiFetch.mockImplementation(async (_org: string, path: string) =>
    path.includes("page=1")
      ? { data: [item(1)], info: { more_records: true } }
      : { data: [item(2)], info: { more_records: false } },
  );
  const client = new QueryClient();
  const { result } = renderHook(() => useAttachments("Leads", "lead-1"), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  await waitFor(() => expect(result.current.events).toHaveLength(1));
  expect(result.current.hasMore).toBe(true);
  act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.events).toHaveLength(2));
  expect(result.current.hasMore).toBe(false);
});
