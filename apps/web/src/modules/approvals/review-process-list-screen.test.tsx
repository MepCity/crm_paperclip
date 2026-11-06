import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import * as api from "./api";
import { ReviewProcessListScreen } from "./review-process-list-screen";

import type { ApprovalProcess } from "./types";

vi.mock("./api", () => ({
  fetchReviewProcesses: vi.fn(),
  updateReviewProcess: vi.fn(),
  deleteReviewProcess: vi.fn(),
}));

describe("ReviewProcessListScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders §4.2 empty state when no review processes exist", async () => {
    vi.mocked(api.fetchReviewProcesses).mockResolvedValue([]);

    render(<ReviewProcessListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(api.fetchReviewProcesses).toHaveBeenCalledWith("test-org");
    });

    // Headings from reference capture §4.2
    expect(screen.getByRole("heading", { name: "Gözden Geçirme Süreçleri" })).toBeTruthy();
    expect(screen.getByText("Bilgilerin El ile Gözden Geçirilmesi")).toBeTruthy();
    expect(screen.getByText("Bilgi Toplamayı İyileştir")).toBeTruthy();
    expect(
      screen.getByText(
        "Kuruluş, gönderilen bilgilerin el ile alana göre doğrulanmasını gerektirir.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Yeni Süreç Oluştur" })).toBeTruthy();
  });

  it("renders table with processes and allows active toggling and delete", async () => {
    const user = userEvent.setup();

    vi.mocked(api.fetchReviewProcesses).mockResolvedValue([
      {
        id: "rev-proc-1",
        kind: "review",
        name: "Müşteri Bilgi Kontrolü",
        module: "Deals",
        trigger: "create_or_edit",
        active: true,
        criteria: { kind: "all_records" },
        steps: [
          {
            name: "İnceleme Adımı",
            approvers: { kind: "roles", refs: ["admin"] },
            rule: "any",
          },
        ],
        reviewFields: ["Amount", "Stage"],
        onApprove: [],
        onReject: [],
        position: 1,
        createdAt: "2026-11-05T08:00:00Z",
        updatedAt: "2026-11-05T08:00:00Z",
      },
    ]);
    vi.mocked(api.updateReviewProcess).mockResolvedValue({
      id: "rev-proc-1",
    } as unknown as ApprovalProcess);
    vi.mocked(api.deleteReviewProcess).mockResolvedValue(undefined);

    render(<ReviewProcessListScreen orgSlug="test-org" />);

    await screen.findByText("Müşteri Bilgi Kontrolü");
    expect(screen.getByText("Deals")).toBeTruthy();
    expect(screen.getByText("Oluştur veya Düzenle")).toBeTruthy();

    // Toggle active
    const switchEl = screen.getByRole("switch");
    await user.click(switchEl);
    expect(api.updateReviewProcess).toHaveBeenCalledWith("test-org", "rev-proc-1", {
      active: false,
    });

    // Delete dialog
    const deleteBtn = screen.getByRole("button", { name: "Sil" });
    await user.click(deleteBtn);

    expect(screen.getByText("Gözden Geçirme Sürecini Sil")).toBeTruthy();
    const confirmDeleteBtn = screen.getByRole("button", { name: "Sil" });
    await user.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(api.deleteReviewProcess).toHaveBeenCalledWith("test-org", "rev-proc-1");
    });
  });
});
