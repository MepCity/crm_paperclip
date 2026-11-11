import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isJourneySupported, JourneysCardBody } from "./journeys-card-body";

vi.mock("@/modules/journeys/api", () => ({
  fetchRecordJourneys: vi.fn(async (_orgSlug: string, module: string, recordId: string) => {
    if (recordId === "rec-active") {
      return [
        {
          id: "inst-1",
          journeyId: "j-1",
          journeyName: "Lead Qualification Journey",
          recordModule: module,
          recordId,
          currentStateId: "state-1",
          currentStateName: "Initial Outreach",
          stateEnteredAt: "2026-11-10T10:00:00.000Z",
          deadlineAt: "2026-11-12T10:00:00.000Z",
          status: "active",
          generation: 1,
          createdAt: "2026-11-10T10:00:00.000Z",
        },
      ];
    }
    return [];
  }),
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

describe("JourneysCardBody & Guard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("strictly allows only Leads, Contacts, Accounts, and Deals", () => {
    expect(isJourneySupported("Leads")).toBe(true);
    expect(isJourneySupported("Contacts")).toBe(true);
    expect(isJourneySupported("Accounts")).toBe(true);
    expect(isJourneySupported("Deals")).toBe(true);

    expect(isJourneySupported("Cases")).toBe(false);
    expect(isJourneySupported("Campaigns")).toBe(false);
    expect(isJourneySupported("Tasks")).toBe(false);
    expect(isJourneySupported("Meetings")).toBe(false);
    expect(isJourneySupported("Calls")).toBe(false);
    expect(isJourneySupported("Quotes")).toBe(false);
    expect(isJourneySupported("Invoices")).toBe(false);
  });

  it("returns null and suppresses query for unsupported modules", () => {
    const { container } = renderWithClient(<JourneysCardBody module="Meetings" recordId="mtg-1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders empty state when no journeys exist", async () => {
    renderWithClient(<JourneysCardBody module="Leads" recordId="rec-empty" />);
    const empty = await screen.findByTestId("journeys-related-empty");
    expect(empty).toBeDefined();
    expect(empty.textContent).toContain("No journeys found");
  });

  it("renders journey instance table when records exist", async () => {
    renderWithClient(<JourneysCardBody module="Leads" recordId="rec-active" />);
    const table = await screen.findByTestId("journeys-related-table");
    expect(table).toBeDefined();

    const nameLink = screen.getByTestId("journey-name-link-inst-1");
    expect(nameLink.textContent).toBe("Lead Qualification Journey");
    expect(nameLink.getAttribute("href")).toBe(
      "/crm/test-org/settings/commandcenter/journey-builder/j-1",
    );

    expect(screen.getByText("Initial Outreach")).toBeDefined();
    expect(screen.getByText("active")).toBeDefined();
  });
});
