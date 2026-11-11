import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CadencesCardBody, isCadenceSupported } from "./cadences-card-body";

const mockPause = vi.fn(async (_orgSlug?: string, _id?: string) => ({
  enrollment: { state: "paused" },
}));
const mockResume = vi.fn(async (_orgSlug?: string, _id?: string) => ({
  enrollment: { state: "active" },
}));
const mockUnenroll = vi.fn(async (_orgSlug?: string, _id?: string, _reason?: string) => ({
  enrollment: { state: "exited" },
}));

vi.mock("@/modules/cadences/api", () => ({
  fetchRecordCadences: vi.fn(async (_orgSlug: string, module: string, recordId: string) => {
    if (recordId === "rec-active") {
      return [
        {
          id: "enr-1",
          cadenceId: "cad-1",
          cadenceName: "Prospecting Sequence",
          recordModule: module,
          recordId,
          recordStartDate: "2026-11-09T10:00:00.000Z",
          status: "active",
          reason: null,
          generation: 1,
          nextStepId: "step-2",
          nextDueAt: "2026-11-10T10:00:00.000Z",
        },
      ];
    }
    if (recordId === "rec-paused") {
      return [
        {
          id: "enr-2",
          cadenceId: "cad-2",
          cadenceName: "Nurturing Sequence",
          recordModule: module,
          recordId,
          recordStartDate: "2026-11-05T09:00:00.000Z",
          status: "paused",
          reason: null,
          generation: 2,
          nextStepId: "step-3",
          nextDueAt: null,
        },
      ];
    }
    if (recordId === "rec-exited") {
      return [
        {
          id: "enr-3",
          cadenceId: "cad-3",
          cadenceName: "Exited Sequence",
          recordModule: module,
          recordId,
          recordStartDate: "2026-11-01T08:00:00.000Z",
          status: "exited",
          reason: "reply",
          generation: 2,
          nextStepId: null,
          nextDueAt: null,
        },
      ];
    }
    return [];
  }),
  pauseEnrollment: (orgSlug: string, id: string) => mockPause(orgSlug, id),
  resumeEnrollment: (orgSlug: string, id: string) => mockResume(orgSlug, id),
  unenrollRecord: (orgSlug: string, id: string, reason?: string) =>
    mockUnenroll(orgSlug, id, reason),
}));

vi.mock("@/lib/api/client/provider", () => ({
  useOrgSlug: () => "test-org",
}));

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("CadencesCardBody & Guard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("strictly allows only Leads, Contacts, Accounts, and Deals", () => {
    expect(isCadenceSupported("Leads")).toBe(true);
    expect(isCadenceSupported("Contacts")).toBe(true);
    expect(isCadenceSupported("Accounts")).toBe(true);
    expect(isCadenceSupported("Deals")).toBe(true);

    expect(isCadenceSupported("Cases")).toBe(false);
    expect(isCadenceSupported("Campaigns")).toBe(false);
    expect(isCadenceSupported("Tasks")).toBe(false);
    expect(isCadenceSupported("Meetings")).toBe(false);
    expect(isCadenceSupported("Calls")).toBe(false);
    expect(isCadenceSupported("Quotes")).toBe(false);
    expect(isCadenceSupported("Invoices")).toBe(false);
  });

  it("returns null and suppresses query for unsupported modules", () => {
    const { container } = renderWithClient(<CadencesCardBody module="Cases" recordId="case-1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders empty state when no enrollments exist", async () => {
    renderWithClient(<CadencesCardBody module="Leads" recordId="rec-empty" />);
    const empty = await screen.findByTestId("cadences-related-empty");
    expect(empty).toBeDefined();
    expect(screen.getByText("No records found")).toBeDefined();
  });

  it("renders active enrollment with pause and unenroll action buttons", async () => {
    renderWithClient(<CadencesCardBody module="Leads" recordId="rec-active" />);
    const table = await screen.findByTestId("cadences-related-table");
    expect(table).toBeDefined();
    expect(screen.getByText("Prospecting Sequence")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();

    const pauseBtn = screen.getByTestId("cadence-pause-enr-1");
    expect(pauseBtn).toBeDefined();
    const unenrollBtn = screen.getByTestId("cadence-unenroll-enr-1");
    expect(unenrollBtn).toBeDefined();

    fireEvent.click(pauseBtn);
    await waitFor(() => {
      expect(mockPause).toHaveBeenCalledWith("test-org", "enr-1");
    });

    fireEvent.click(unenrollBtn);
    await waitFor(() => {
      expect(mockUnenroll).toHaveBeenCalledWith("test-org", "enr-1", "manual_unenroll");
    });
  });

  it("renders paused enrollment with resume and unenroll action buttons", async () => {
    renderWithClient(<CadencesCardBody module="Contacts" recordId="rec-paused" />);
    const table = await screen.findByTestId("cadences-related-table");
    expect(table).toBeDefined();
    expect(screen.getByText("Nurturing Sequence")).toBeDefined();
    expect(screen.getByText("Paused")).toBeDefined();

    const resumeBtn = screen.getByTestId("cadence-resume-enr-2");
    expect(resumeBtn).toBeDefined();
    fireEvent.click(resumeBtn);
    await waitFor(() => {
      expect(mockResume).toHaveBeenCalledWith("test-org", "enr-2");
    });
  });

  it("renders exited enrollment with reason and without pause/resume buttons", async () => {
    renderWithClient(<CadencesCardBody module="Deals" recordId="rec-exited" />);
    const table = await screen.findByTestId("cadences-related-table");
    expect(table).toBeDefined();
    expect(screen.getByText("Exited Sequence")).toBeDefined();
    expect(screen.getByText("Exited (reply)")).toBeDefined();

    expect(screen.queryByTestId("cadence-pause-enr-3")).toBeNull();
    expect(screen.queryByTestId("cadence-resume-enr-3")).toBeNull();
    expect(screen.queryByTestId("cadence-unenroll-enr-3")).toBeNull();
  });
});
