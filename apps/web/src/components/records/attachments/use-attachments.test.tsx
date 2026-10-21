import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const { apiFetch, scope } = vi.hoisted(() => ({ apiFetch: vi.fn(), scope: { org: "org" } }));
vi.mock("@/lib/api/client/fetch", () => ({ apiFetch, CRM_ORG_HEADER: "x-crm-org" }));
vi.mock("@/lib/api/client/provider", () => ({ useOrgSlug: () => scope.org }));

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
  await waitFor(() => expect(result.current.rows).toHaveLength(1));
  expect(result.current.hasMore).toBe(true);
  act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.rows).toHaveLength(2));
  expect(result.current.hasMore).toBe(false);
});

for (const module of ["Cases", "Solutions"] as const) {
  test(`${module}: loads rows and timeline events through the scoped attachment endpoint`, async () => {
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({
      data: [
        {
          id: "attachment-1",
          File_Name: "guide.pdf",
          Size: 20,
          $type: "file",
          Created_Time: "2026-10-01T00:00:00Z",
          Created_By: null,
        },
      ],
      info: { more_records: false },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, unmount } = renderHook(() => useAttachments(module, "record-1"), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(apiFetch).toHaveBeenCalledWith(
      "org",
      `/crm/v2.2/${module}/record-1/Attachments?page=1&per_page=20`,
    );
    expect(result.current.rows[0]?.fileName).toBe("guide.pdf");
    unmount();
    client.clear();
  });

  test(`${module}: reports load errors instead of an empty successful card`, async () => {
    apiFetch.mockReset();
    apiFetch.mockRejectedValue(new Error("unavailable"));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, unmount } = renderHook(() => useAttachments(module, "record-1"), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await waitFor(() => expect(result.current.error).toBe("Could not load attachments."));
    unmount();
    client.clear();
  });
}

test.each(["Cases", "Solutions"] as const)(
  "%s: switching organization does not reuse another tenant's rows",
  async (module) => {
    apiFetch.mockReset();
    apiFetch.mockImplementation(async (org: string) => ({
      data: [
        {
          id: "attachment-1",
          File_Name: `${org}.pdf`,
          Size: 1,
          $type: "file",
          Created_Time: "2026-10-01T00:00:00Z",
          Created_By: null,
        },
      ],
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender, unmount } = renderHook(() => useAttachments(module, "record-1"), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    try {
      await waitFor(() => expect(result.current.rows[0]?.fileName).toBe("org.pdf"));
      scope.org = "other-org";
      rerender();
      expect(result.current.rows).toEqual([]);
      await waitFor(() => expect(result.current.rows[0]?.fileName).toBe("other-org.pdf"));
    } finally {
      scope.org = "org";
      unmount();
      client.clear();
    }
  },
);
