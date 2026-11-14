import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import * as api from "./api";
import { ApprovalProcessFormScreen } from "./approval-process-form-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useUsers: () => ({ data: [] }),
}));

vi.mock("./api", () => ({
  createApprovalProcess: vi.fn(),
  fetchApprovalProcess: vi.fn(),
  updateApprovalProcess: vi.fn(),
}));

const listGroups = vi.fn();
vi.mock("../settings-access/api", () => ({
  createAccessClient: () => ({ listGroups }),
}));

describe("ApprovalProcessFormScreen group approvers (MEP-1518)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("picks real groups by id instead of storing a placeholder ref", async () => {
    const user = userEvent.setup();
    listGroups.mockResolvedValue([
      { id: "11111111-1111-4111-8111-111111111111", name: "Satış Yöneticileri", members: [] },
      { id: "22222222-2222-4222-8222-222222222222", name: "Finans", members: [] },
    ]);
    vi.mocked(api.createApprovalProcess).mockResolvedValue({} as never);

    render(<ApprovalProcessFormScreen orgSlug="test-org" />);

    await user.type(screen.getByLabelText(/İşlem Adı/), "Grup onayı");
    await user.selectOptions(screen.getByLabelText("Onaylayan Türü"), "groups");
    await user.click(await screen.findByRole("checkbox", { name: "Finans" }));
    await user.click(screen.getAllByRole("button", { name: "Kaydet" })[0] as HTMLElement);

    await waitFor(() => expect(api.createApprovalProcess).toHaveBeenCalled());
    const payload = vi.mocked(api.createApprovalProcess).mock.calls[0]?.[1] as {
      steps: { approvers: { kind: string; refs: string[] } }[];
    };
    expect(payload.steps[0]?.approvers).toEqual({
      kind: "groups",
      refs: ["22222222-2222-4222-8222-222222222222"],
    });
  });
});
