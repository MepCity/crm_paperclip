import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneysListScreen } from "./journeys-list-screen";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockFetchJourneys = vi.fn();
const mockCreateJourney = vi.fn();

vi.mock("./api", () => ({
  fetchJourneys: (...args: unknown[]) => mockFetchJourneys(...args),
  createJourney: (...args: unknown[]) => mockCreateJourney(...args),
}));

describe("JourneysListScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state with create button and help marker when no journeys exist", async () => {
    mockFetchJourneys.mockResolvedValue([]);

    render(<JourneysListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByTestId("journey-empty-state")).toBeDefined();
    });

    expect(screen.getByTestId("create-journey-button")).toBeDefined();
    const helpMarker = screen.getByTestId("journey-help-marker");
    expect(helpMarker).toBeDefined();
    expect(helpMarker.getAttribute("href")).toBe(
      "https://help.crm.reference/commandcenter/journey-builder",
    );
  });

  it("renders journeys table when records are returned", async () => {
    mockFetchJourneys.mockResolvedValue([
      {
        id: "j-1",
        name: "Lead Qualification Journey",
        module: "Leads",
        status: "active",
        description: "Primary outbound path",
        currentRecordCount: 15,
        lastModifiedAt: "2026-11-10T12:00:00Z",
        lastModifiedBy: {
          id: "u-1",
          name: "Admin User",
          avatarUrl: null,
        },
      },
    ]);

    render(<JourneysListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByText("Lead Qualification Journey")).toBeDefined();
    });

    expect(screen.getByText("Primary outbound path")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("Admin User")).toBeDefined();
  });

  it("opens create dialog, validates inputs, and calls createJourney", async () => {
    mockFetchJourneys.mockResolvedValue([]);
    mockCreateJourney.mockResolvedValue({ id: "j-new" });

    render(<JourneysListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByTestId("create-journey-button")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("create-journey-button"));

    expect(screen.getByTestId("create-journey-dialog")).toBeDefined();
    const nextBtn = screen.getByTestId("journey-next-button");
    expect(nextBtn).toBeDefined();

    fireEvent.change(screen.getByTestId("journey-name-input"), {
      target: { value: "Deals Acceleration" },
    });
    fireEvent.change(screen.getByTestId("journey-module-select"), {
      target: { value: "Deals" },
    });
    fireEvent.change(screen.getByTestId("journey-description-input"), {
      target: { value: "Deals stage journey" },
    });

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockCreateJourney).toHaveBeenCalledWith("test-org", {
        name: "Deals Acceleration",
        module: "Deals",
        description: "Deals stage journey",
      });
      expect(mockPush).toHaveBeenCalledWith(
        "/crm/test-org/settings/commandcenter/journey-builder/j-new",
      );
    });
  });
});
