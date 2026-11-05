import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import * as api from "./api";
import { ApprovalProcessListScreen } from "./approval-process-list-screen";

vi.mock("./api", () => ({
  fetchApprovalProcesses: vi.fn(),
  updateApprovalProcess: vi.fn(),
  deleteApprovalProcess: vi.fn(),
  reorderApprovalProcesses: vi.fn(),
}));

describe("ApprovalProcessListScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state when no approval processes exist", async () => {
    vi.mocked(api.fetchApprovalProcesses).mockResolvedValue([]);

    render(<ApprovalProcessListScreen orgSlug="test-org" />);

    await screen.findByText("Onay işlemi yapılandırmanız yok");
    expect(screen.getAllByRole("link", { name: "+ Onay İşlemi Ekle" })).toHaveLength(1);
    expect(screen.queryByText("Eylemler")).toBeNull();
  });

  it("renders table with approval processes and handles reorder dialog", async () => {
    const user = userEvent.setup();

    vi.mocked(api.fetchApprovalProcesses).mockResolvedValue([
      {
        id: "appr-1",
        kind: "approval",
        name: "Standart Satış Onayı",
        module: "Deals",
        trigger: "create",
        active: true,
        criteria: { kind: "all_records" },
        steps: [
          {
            name: "Yönetici Adımı",
            approvers: { kind: "roles", refs: ["admin"] },
            rule: "any",
          },
        ],
        reviewFields: [],
        onApprove: [],
        onReject: [],
        position: 1,
        createdAt: "2026-11-05T08:00:00Z",
        updatedAt: "2026-11-05T08:00:00Z",
      },
      {
        id: "appr-2",
        kind: "approval",
        name: "İndirim Onayı",
        module: "Deals",
        trigger: "edit",
        active: true,
        criteria: { kind: "all_records" },
        steps: [
          {
            name: "Finans Onayı",
            approvers: { kind: "roles", refs: ["finance"] },
            rule: "any",
          },
        ],
        reviewFields: [],
        onApprove: [],
        onReject: [],
        position: 2,
        createdAt: "2026-11-05T08:00:00Z",
        updatedAt: "2026-11-05T08:00:00Z",
      },
    ]);
    vi.mocked(api.reorderApprovalProcesses).mockImplementation(async () => [
      {
        id: "appr-2",
        kind: "approval",
        name: "İndirim Onayı",
        module: "Deals",
        trigger: "edit",
        active: true,
        criteria: { kind: "all_records" },
        steps: [
          {
            name: "Finans Onayı",
            approvers: { kind: "roles", refs: ["finance"] },
            rule: "any",
          },
        ],
        reviewFields: [],
        onApprove: [],
        onReject: [],
        position: 1,
        createdAt: "2026-11-05T08:00:00Z",
        updatedAt: "2026-11-05T08:00:00Z",
      },
      {
        id: "appr-1",
        kind: "approval",
        name: "Standart Satış Onayı",
        module: "Deals",
        trigger: "create",
        active: true,
        criteria: { kind: "all_records" },
        steps: [
          {
            name: "Yönetici Adımı",
            approvers: { kind: "roles", refs: ["admin"] },
            rule: "any",
          },
        ],
        reviewFields: [],
        onApprove: [],
        onReject: [],
        position: 2,
        createdAt: "2026-11-05T08:00:00Z",
        updatedAt: "2026-11-05T08:00:00Z",
      },
    ]);

    render(<ApprovalProcessListScreen orgSlug="test-org" />);

    await screen.findByText("Standart Satış Onayı");
    expect(screen.getByText("İndirim Onayı")).toBeTruthy();

    // Reorder button
    const reorderBtn = screen.getByRole("button", { name: /İşlemleri Yeniden Düzenle/ });
    await user.click(reorderBtn);

    await screen.findByText("Süreçlerin kontrol edilme ve tetiklenme sırasını belirleyin:");

    const saveReorderBtn = screen.getByRole("button", { name: "Kaydet" });
    await user.click(saveReorderBtn);

    await waitFor(() => {
      expect(api.reorderApprovalProcesses).toHaveBeenCalledWith("test-org", ["appr-1", "appr-2"]);
    });
  });
});
