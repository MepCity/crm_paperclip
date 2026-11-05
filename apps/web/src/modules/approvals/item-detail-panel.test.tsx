import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import * as api from "./api";
import { ItemDetailPanel } from "./item-detail-panel";
import type { ApprovalDetail } from "./types";

vi.mock("@/lib/api/client/hooks", () => ({
  useUsers: () => ({
    data: [
      { userId: "usr-1", name: "Ali Yılmaz", email: "ali@example.com" },
      { userId: "usr-2", name: "Zeynep Kaya", email: "zeynep@example.com" },
    ],
  }),
}));

vi.mock("./api", () => ({
  fetchApprovalDetail: vi.fn(),
  decideApprovalAction: vi.fn(),
}));

const mockDetail: ApprovalDetail = {
  request: {
    id: "req-100",
    kind: "approval",
    module: "Deals",
    recordId: "deal-100",
    recordLabel: "Enterprise Subscription Deal",
    processId: "proc-100",
    processName: "Büyük Anlaşma Onayı",
    step: 1,
    stepCount: 1,
    stepName: "Yönetici Adımı",
    status: "pending",
    submitter: { id: "usr-submitter", name: "Submitter User" },
    submittedAt: "2026-11-05T07:30:00Z",
    decidedAt: null,
  },
  record: {
    module: "Deals",
    id: "deal-100",
    label: "Enterprise Subscription Deal",
    fields: {
      Deal_Name: "Enterprise Subscription Deal",
      Amount: 1500000,
      Stage: "Negotiation",
    },
  },
  steps: [
    {
      step: 1,
      name: "Yönetici Adımı",
      rule: "any",
      approvers: [
        {
          id: "usr-1",
          name: "Ali Yılmaz",
          state: "pending",
          delegatedFrom: null,
        },
      ],
    },
  ],
  actions: [
    {
      id: "hist-1",
      step: 1,
      action: "submitted",
      actor: { id: "usr-submitter", name: "Submitter User" },
      target: null,
      comment: "Lütfen onaylayınız",
      actedAt: "2026-11-05T07:30:00Z",
    },
  ],
  permissions: {
    canDecide: true,
    canRecall: true,
  },
};

describe("ItemDetailPanel", () => {
  const onClose = vi.fn();
  const onDecided = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchApprovalDetail).mockResolvedValue(mockDetail);
    vi.mocked(api.decideApprovalAction).mockResolvedValue(mockDetail);
  });

  afterEach(() => {
    cleanup();
  });

  it("fetches detail and renders record summary, steps and history", async () => {
    render(
      <ItemDetailPanel
        orgSlug="test-org"
        approvalId="req-100"
        onClose={onClose}
        onDecided={onDecided}
      />,
    );

    await waitFor(() => {
      expect(api.fetchApprovalDetail).toHaveBeenCalledWith("test-org", "req-100");
    });

    expect(screen.getAllByText("Enterprise Subscription Deal").length).toBeGreaterThan(0);
    expect(screen.getByText("Büyük Anlaşma Onayı")).toBeTruthy();
    expect(screen.getAllByText("Yönetici Adımı").length).toBeGreaterThan(0);
    expect(screen.getByText(/Lütfen onaylayınız/)).toBeTruthy();

    // Action buttons
    expect(screen.getByRole("button", { name: "Onayla" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reddet" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Yetki Devret" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Geri Al" })).toBeTruthy();
  });

  it("handles approve flow with comment dialog", async () => {
    const user = userEvent.setup();
    render(
      <ItemDetailPanel
        orgSlug="test-org"
        approvalId="req-100"
        onClose={onClose}
        onDecided={onDecided}
      />,
    );

    await screen.findByRole("heading", { name: "Enterprise Subscription Deal" });

    const approveBtn = screen.getByRole("button", { name: "Onayla" });
    await user.click(approveBtn);

    await screen.findByText("Onayı Onayla");

    // Modal is open, so confirm button in modal is the active accessible "Onayla" button
    const confirmApproveBtn = screen.getByRole("button", { name: "Onayla" });
    await user.click(confirmApproveBtn);

    await waitFor(() => {
      expect(api.decideApprovalAction).toHaveBeenCalledWith("test-org", "req-100", "approve", {
        comment: undefined,
      });
      expect(onDecided).toHaveBeenCalled();
    });
  });

  it("requires a comment when rejecting", async () => {
    const user = userEvent.setup();
    render(
      <ItemDetailPanel
        orgSlug="test-org"
        approvalId="req-100"
        onClose={onClose}
        onDecided={onDecided}
      />,
    );

    await screen.findByRole("heading", { name: "Enterprise Subscription Deal" });

    const rejectBtn = screen.getByRole("button", { name: "Reddet" });
    await user.click(rejectBtn);

    await screen.findByText("Talebi Reddet");

    // Inside modal, confirm button
    const confirmRejectBtn = screen.getByRole("button", { name: "Reddet" });
    await user.click(confirmRejectBtn);

    expect(screen.getByText("Reddetme gerekçesi belirtilmelidir.")).toBeTruthy();
    expect(api.decideApprovalAction).not.toHaveBeenCalled();

    // Type comment
    const input = screen.getByRole("textbox");
    await user.type(input, "Bütçe aşımı sebebiyle reddedildi.");
    await user.click(confirmRejectBtn);

    await waitFor(() => {
      expect(api.decideApprovalAction).toHaveBeenCalledWith("test-org", "req-100", "reject", {
        comment: "Bütçe aşımı sebebiyle reddedildi.",
      });
      expect(onDecided).toHaveBeenCalled();
    });
  });

  it("handles recall action", async () => {
    const user = userEvent.setup();
    render(
      <ItemDetailPanel
        orgSlug="test-org"
        approvalId="req-100"
        onClose={onClose}
        onDecided={onDecided}
      />,
    );

    await screen.findByRole("heading", { name: "Enterprise Subscription Deal" });

    const recallBtn = screen.getByRole("button", { name: "Geri Al" });
    await user.click(recallBtn);

    await screen.findByText("Onay Talebini Geri Al");
    const confirmRecallBtn = screen.getByRole("button", { name: "Geri Al" });
    await user.click(confirmRecallBtn);

    await waitFor(() => {
      expect(api.decideApprovalAction).toHaveBeenCalledWith("test-org", "req-100", "recall", {});
      expect(onDecided).toHaveBeenCalled();
    });
  });
});
