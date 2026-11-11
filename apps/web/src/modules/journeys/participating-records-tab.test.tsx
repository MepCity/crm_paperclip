import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParticipatingRecordsTab } from "./participating-records-tab";

const mockInstances = [
  {
    id: "inst-101",
    journeyId: "j-123",
    versionId: "ver-1",
    recordModule: "Leads" as const,
    recordId: "lead-abc",
    recordName: "Ayşe Yılmaz",
    currentStateId: "state-start",
    stateEnteredAt: "2026-11-10T12:00:00.000Z",
    deadlineAt: "2026-11-12T12:00:00.000Z",
    status: "active" as const,
    generation: 1,
    createdAt: "2026-11-10T12:00:00.000Z",
    updatedAt: "2026-11-10T12:00:00.000Z",
  },
];

const mockLogs = [
  {
    id: "run-1",
    instanceId: "inst-101",
    transitionId: "trans-move",
    eventId: "evt-01",
    result: "success",
    resultReason: null,
    executedAt: "2026-11-10T12:05:00.000Z",
  },
];

const fetchInstancesMock = vi.fn(
  async (_orgSlug?: string, _journeyId?: string, _options?: unknown) => ({
    instances: mockInstances,
    total: 1,
  }),
);

const fetchLogsMock = vi.fn(
  async (_orgSlug?: string, _journeyId?: string, _instanceId?: string) => mockLogs,
);

vi.mock("./api", () => ({
  fetchJourneyInstances: (orgSlug: string, journeyId: string, options?: unknown) =>
    fetchInstancesMock(orgSlug, journeyId, options),
  fetchJourneyTransitionLog: (orgSlug: string, journeyId: string, instanceId: string) =>
    fetchLogsMock(orgSlug, journeyId, instanceId),
}));

describe("ParticipatingRecordsTab", () => {
  const states = [
    {
      id: "state-start",
      name: "Entry State",
      isStart: true,
      actions: [],
      deadline: null,
    },
    {
      id: "state-target",
      name: "Target State",
      isStart: false,
      actions: [],
      deadline: null,
    },
  ];

  const transitions = [
    {
      id: "trans-move",
      from: "state-start",
      to: "state-target",
      trigger: "record_updated" as const,
      criteria: null,
      actions: [],
    },
  ];

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders participating records and filters", async () => {
    render(
      <ParticipatingRecordsTab
        orgSlug="test-org"
        journeyId="j-123"
        states={states}
        transitions={transitions}
      />,
    );

    expect(await screen.findByTestId("participant-row-inst-101")).toBeDefined();
    const link = screen.getByTestId("participant-record-link-inst-101");
    expect(link.getAttribute("href")).toBe("/crm/test-org/tab/Leads/lead-abc");
    expect(screen.getByText("Ayşe Yılmaz")).toBeDefined();
    expect(screen.getAllByText("Entry State").length).toBeGreaterThan(0);
    expect(screen.getAllByText("active").length).toBeGreaterThan(0);

    // Filters exist
    expect(screen.getByTestId("participants-filter-state")).toBeDefined();
    expect(screen.getByTestId("participants-filter-status")).toBeDefined();
    expect(screen.getByTestId("participants-filter-entry-date")).toBeDefined();
    expect(screen.getByTestId("participants-filter-deadline")).toBeDefined();
  });

  it("opens transition log modal on view log click", async () => {
    render(
      <ParticipatingRecordsTab
        orgSlug="test-org"
        journeyId="j-123"
        states={states}
        transitions={transitions}
      />,
    );

    const logBtn = await screen.findByTestId("view-log-button-inst-101");
    fireEvent.click(logBtn);

    expect(await screen.findByTestId("transition-log-dialog")).toBeDefined();
    expect(fetchLogsMock).toHaveBeenCalledWith("test-org", "j-123", "inst-101");
    expect(await screen.findByTestId("log-row-run-1")).toBeDefined();
    expect(screen.getByText("Entry State → Target State")).toBeDefined();
    expect(screen.getByText("success")).toBeDefined();
  });
});
