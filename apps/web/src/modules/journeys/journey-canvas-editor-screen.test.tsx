import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneyCanvasEditorScreen } from "./journey-canvas-editor-screen";
import type { JourneyDetail } from "./types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockFetchJourney = vi.fn();
const mockUpdateJourneyDraft = vi.fn();
const mockPublishJourney = vi.fn();
const mockActivateJourney = vi.fn();
const mockDeactivateJourney = vi.fn();
const mockDeleteJourney = vi.fn();

vi.mock("./api", () => ({
  fetchJourney: (...args: unknown[]) => mockFetchJourney(...args),
  updateJourneyDraft: (...args: unknown[]) => mockUpdateJourneyDraft(...args),
  publishJourney: (...args: unknown[]) => mockPublishJourney(...args),
  activateJourney: (...args: unknown[]) => mockActivateJourney(...args),
  deactivateJourney: (...args: unknown[]) => mockDeactivateJourney(...args),
  deleteJourney: (...args: unknown[]) => mockDeleteJourney(...args),
}));

const baseJourney: JourneyDetail = {
  id: "j-123",
  name: "Sales Qualification",
  module: "Leads",
  status: "draft",
  description: "Test description",
  draftVersionId: "ver-1",
  activeVersionId: null,
  createdAt: "2026-11-10T00:00:00Z",
  createdBy: "u-1",
  updatedAt: "2026-11-10T00:00:00Z",
  updatedBy: "u-1",
  currentRecordCount: 0,
  currentVersion: {
    id: "ver-1",
    journeyId: "j-123",
    number: 1,
    state: "draft",
    states: [
      {
        id: "st-1",
        name: "Entry State",
        isStart: true,
        actions: [],
        deadline: null,
      },
    ],
    transitions: [],
    publishedAt: null,
    publishedBy: null,
    createdAt: "2026-11-10T00:00:00Z",
  },
  draftVersion: {
    id: "ver-1",
    journeyId: "j-123",
    number: 1,
    state: "draft",
    states: [
      {
        id: "st-1",
        name: "Entry State",
        isStart: true,
        actions: [],
        deadline: null,
      },
    ],
    transitions: [],
    publishedAt: null,
    publishedBy: null,
    createdAt: "2026-11-10T00:00:00Z",
  },
  activeVersion: null,
};

describe("JourneyCanvasEditorScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders editor toolbar, canvas, and property panel with initial start state", async () => {
    mockFetchJourney.mockResolvedValue(baseJourney);

    render(<JourneyCanvasEditorScreen orgSlug="test-org" journeyId="j-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("journey-editor-name")).toBeDefined();
    });

    expect(screen.getByText("Sales Qualification")).toBeDefined();
    expect(screen.getByTestId("journey-status-badge")).toBeDefined();
    expect(screen.getByTestId("journey-canvas")).toBeDefined();
    expect(screen.getByTestId("journey-property-panel")).toBeDefined();
    expect(screen.getByTestId("journey-state-card-st-1")).toBeDefined();
    expect(screen.getByTestId("start-badge-st-1")).toBeDefined();
  });

  it("adds a second state and a transition between states", async () => {
    mockFetchJourney.mockResolvedValue(baseJourney);

    render(<JourneyCanvasEditorScreen orgSlug="test-org" journeyId="j-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("add-state-button")).toBeDefined();
    });

    // Add state
    fireEvent.click(screen.getByTestId("add-state-button"));

    // Two state cards rendered
    const stateCards = screen.getAllByTestId(/journey-state-card-/);
    expect(stateCards).toHaveLength(2);

    // Add transition
    fireEvent.click(screen.getByTestId("add-transition-button"));

    const transitionCards = screen.getAllByTestId(/journey-transition-card-/);
    expect(transitionCards).toHaveLength(1);
  });

  it("saves draft and publishes journey", async () => {
    mockFetchJourney.mockResolvedValue(baseJourney);
    mockUpdateJourneyDraft.mockResolvedValue({
      ...baseJourney,
      status: "draft",
    });
    mockPublishJourney.mockResolvedValue({
      ...baseJourney,
      status: "active",
      activeVersionId: "ver-1",
      draftVersionId: null,
    });

    render(<JourneyCanvasEditorScreen orgSlug="test-org" journeyId="j-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("journey-save-draft-button")).toBeDefined();
    });

    // Save draft
    fireEvent.click(screen.getByTestId("journey-save-draft-button"));
    await waitFor(() => {
      expect(mockUpdateJourneyDraft).toHaveBeenCalled();
    });

    // Publish
    fireEvent.click(screen.getByTestId("journey-publish-button"));
    await waitFor(() => {
      expect(mockPublishJourney).toHaveBeenCalledWith("test-org", "j-123");
    });
  });
});
