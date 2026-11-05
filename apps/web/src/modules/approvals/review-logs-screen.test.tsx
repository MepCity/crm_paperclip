import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import * as api from "./api";
import { ReviewLogsScreen } from "./review-logs-screen";

vi.mock("./api", () => ({
  fetchHistoryMeta: vi.fn(),
  fetchHistory: vi.fn(),
}));

describe("ReviewLogsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.fetchHistoryMeta).mockResolvedValue({
      types: ["review"],
      actions: ["submitted", "approved", "rejected"],
      modules: ["Deals", "Leads"],
      users: [{ id: "usr-1", name: "Zeynep Kaya" }],
    });

    vi.mocked(api.fetchHistory).mockResolvedValue({
      items: [
        {
          id: "hist-1",
          requestId: "req-1",
          recordId: "deal-1",
          recordLabel: "Satış Sözleşmesi 2026",
          module: "Deals",
          processName: "İnceleme Süreci",
          step: 1,
          action: "approved",
          actor: { id: "usr-1", name: "Zeynep Kaya" },
          target: null,
          comment: "Veriler doğrulandı",
          actedAt: "2026-11-05T08:15:00Z",
          kind: "review",
        },
      ],
      nextCursor: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders back link, filter buttons and history records", async () => {
    render(<ReviewLogsScreen orgSlug="test-org" />);

    expect(screen.getByText("Gözden Geçirme Geçmişi")).toBeTruthy();

    const backLink = screen.getByRole("link", { name: "Gözden geçirilecek kayıtlara dön" });
    expect(backLink.getAttribute("href")).toBe("/crm/test-org/tab/Approvals");

    await waitFor(() => {
      expect(api.fetchHistoryMeta).toHaveBeenCalledWith("test-org", "review");
      expect(api.fetchHistory).toHaveBeenCalled();
    });

    // Verify record in table
    expect(screen.getByText("Satış Sözleşmesi 2026")).toBeTruthy();
    expect(screen.getByText("İnceleme Süreci")).toBeTruthy();
    expect(screen.getByText("Adım 1")).toBeTruthy();
    expect(screen.getByText("Onaylandı")).toBeTruthy();
    expect(screen.getByText("Zeynep Kaya")).toBeTruthy();
    expect(screen.getByText("Veriler doğrulandı")).toBeTruthy();
  });
});
