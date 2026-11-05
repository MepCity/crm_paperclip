import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import * as api from "./api";
import { MyJobsScreen } from "./my-jobs-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useUsers: () => ({
    data: [
      { userId: "u1", name: "User 1", email: "u1@example.com" },
      { userId: "u2", name: "User 2", email: "u2@example.com" },
    ],
  }),
}));

vi.mock("./api", () => ({
  fetchApprovalCounts: vi.fn(),
  fetchQueue: vi.fn(),
  fetchApprovalDetail: vi.fn(),
  decideApprovalAction: vi.fn(),
}));

describe("MyJobsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.fetchApprovalCounts).mockResolvedValue({
      blueprint: 0,
      approval: 2,
      review: 1,
      image_validation: 0,
    });

    vi.mocked(api.fetchQueue).mockImplementation(async (_org, query) => {
      if (query?.type === "approval") {
        return {
          items: [
            {
              id: "req-appr-1",
              kind: "approval",
              recordId: "deal-appr-1",
              recordLabel: "Mega Deal 2026",
              module: "Deals",
              processId: "proc-appr-1",
              processName: "Satış Onayı",
              step: 1,
              stepName: "Yönetici Adımı",
              status: "pending",
              submitter: { id: "user-dev", name: "Dev User" },
              submittedAt: "2026-11-05T08:00:00Z",
            },
          ],
          nextCursor: null,
        };
      }
      return {
        items: [
          {
            id: "req-1",
            kind: "review",
            recordId: "deal-1",
            recordLabel: "Büyük Satış Anlaşması",
            module: "Deals",
            processId: "proc-1",
            processName: "Büyük Fırsat Doğrulama",
            step: 1,
            stepName: "İnceleme",
            status: "waiting_review",
            submitter: { id: "user-dev", name: "Dev User" },
            submittedAt: "2026-11-05T08:00:00Z",
          },
        ],
        nextCursor: null,
      };
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders 4 tabs with counts and defaults to İncelemeler", async () => {
    render(<MyJobsScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(api.fetchApprovalCounts).toHaveBeenCalledWith("test-org");
      expect(api.fetchQueue).toHaveBeenCalledWith("test-org", {
        type: "review",
        status: undefined,
        module: undefined,
      });
    });

    // Check tabs
    expect(screen.getByRole("tab", { name: /Şema Geçişleri/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /onaylar/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /İncelemeler/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Görüntü Doğrulamaları/ })).toBeTruthy();

    // Check count badges
    expect(screen.getByText("2")).toBeTruthy(); // approval count

    // Check record in review table
    expect(screen.getByText("Büyük Satış Anlaşması")).toBeTruthy();
    expect(screen.getByText("Büyük Fırsat Doğrulama")).toBeTruthy();
  });

  it("switches to Blueprint tab and shows empty state", async () => {
    const user = userEvent.setup();
    render(<MyJobsScreen orgSlug="test-org" />);

    const blueprintTab = screen.getByRole("tab", { name: /Şema Geçişleri/ });
    await user.click(blueprintTab);

    expect(screen.getByText("Şema")).toBeTruthy();
    expect(screen.getByText("Bekleyen onay yok")).toBeTruthy();
  });

  it("switches to Vision tab and shows empty state", async () => {
    const user = userEvent.setup();
    render(<MyJobsScreen orgSlug="test-org" />);

    const visionTab = screen.getByRole("tab", { name: /Görüntü Doğrulamaları/ });
    await user.click(visionTab);

    expect(screen.getByText("Bekleyen Resim Sayısı")).toBeTruthy();
    expect(screen.getByText("Bekleyen onay yok")).toBeTruthy();
  });

  it("switches to Onaylar tab and displays approval columns", async () => {
    const user = userEvent.setup();

    render(<MyJobsScreen orgSlug="test-org" />);

    const approvalTab = screen.getByRole("tab", { name: /onaylar/i });
    await user.click(approvalTab);

    await waitFor(() => {
      expect(api.fetchQueue).toHaveBeenCalledWith("test-org", {
        type: "approval",
        status: undefined,
        module: undefined,
      });
    });

    expect(screen.getByText("Mega Deal 2026")).toBeTruthy();
    expect(screen.getByText("Satış Onayı")).toBeTruthy();
    expect(screen.getByText("1. Yönetici Adımı")).toBeTruthy();
  });
});
