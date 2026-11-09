import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WebformAnalyticsSummary, WebformDetail } from "./types";
import { WebformAnalyticsScreen } from "./webform-analytics-screen";

const mockForm: WebformDetail = {
  id: "form-abc",
  organizationId: "org-1",
  name: "Contact Us Webform",
  module: "Leads",
  status: "active",
  draftVersionId: null,
  publishedVersionId: "ver-1",
  draftVersion: null,
  publishedVersion: null,
  hasActivePublicKey: true,
  locations: [
    {
      organizationId: "org-1",
      formId: "form-abc",
      origin: "https://example.com",
      label: "Main Site",
      createdAt: "2026-11-09T00:00:00Z",
    },
  ],
  createdAt: "2026-11-09T00:00:00Z",
  createdBy: "user-1",
  updatedAt: "2026-11-09T00:00:00Z",
  updatedBy: "user-1",
  publicKey: "wfk_test_key",
};

const emptyOutcomes = {
  accepted: 0,
  invalid: 0,
  spam: 0,
  duplicatePendingApproval: 0,
  pendingApproval: 0,
  pendingDoubleOptIn: 0,
  rejectedLocation: 0,
  rateLimited: 0,
};

const mockAnalytics: WebformAnalyticsSummary = {
  formId: "form-abc",
  formName: "Contact Us Webform",
  totalVisits: 120,
  totalSubmissions: 30,
  totalAccepted: 24,
  overallConversionRate: 20,
  outcomes: {
    ...emptyOutcomes,
    accepted: 24,
    invalid: 2,
    spam: 1,
    duplicatePendingApproval: 1,
    pendingApproval: 1,
    rejectedLocation: 1,
  },
  byLocation: [
    {
      location: "hosted",
      visits: 80,
      submissions: 20,
      accepted: 18,
      conversionRate: 22.5,
      outcomes: { ...emptyOutcomes, accepted: 18 },
    },
    {
      location: "https://example.com",
      visits: 40,
      submissions: 10,
      accepted: 6,
      conversionRate: 15,
      outcomes: { ...emptyOutcomes, accepted: 6 },
    },
  ],
  daily: [
    {
      day: "2026-11-08",
      visits: 60,
      submissions: 15,
      accepted: 12,
      outcomes: { ...emptyOutcomes, accepted: 12 },
    },
    {
      day: "2026-11-09",
      visits: 60,
      submissions: 15,
      accepted: 12,
      outcomes: { ...emptyOutcomes, accepted: 12 },
    },
  ],
};

const mockFetchWebform = vi.fn();
const mockFetchWebformAnalytics = vi.fn();

vi.mock("./api", () => ({
  fetchWebform: (...args: unknown[]) => mockFetchWebform(...args),
  fetchWebformAnalytics: (...args: unknown[]) => mockFetchWebformAnalytics(...args),
}));

describe("WebformAnalyticsScreen", () => {
  beforeEach(() => {
    mockFetchWebform.mockReset().mockResolvedValue(mockForm);
    mockFetchWebformAnalytics.mockReset().mockResolvedValue(mockAnalytics);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders analytics KPIs and outcome metrics", async () => {
    render(<WebformAnalyticsScreen orgSlug="test-org" formId="form-abc" />);

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByTestId("kpi-visits")).toBeDefined();
    });

    // Check KPIs
    expect(screen.getByTestId("kpi-visits").textContent).toBe("120");
    expect(screen.getByTestId("kpi-submissions").textContent).toBe("30");
    expect(screen.getByTestId("kpi-accepted").textContent).toBe("24");
    expect(screen.getByTestId("kpi-conversion").textContent).toBe("20%");

    // Check outcome counters
    expect(screen.getByTestId("outcome-accepted").textContent).toBe("24");
    expect(screen.getByTestId("outcome-invalid").textContent).toBe("2");
    expect(screen.getByTestId("outcome-spam").textContent).toBe("1");
    expect(screen.getByTestId("outcome-duplicate").textContent).toBe("1");
    expect(screen.getByTestId("outcome-pending-approval").textContent).toBe("1");
    expect(screen.getByTestId("outcome-pending-optin").textContent).toBe("0");
    expect(screen.getByTestId("outcome-rejected-location").textContent).toBe("1");
    expect(screen.getByTestId("outcome-rate-limited").textContent).toBe("0");
  });

  it("renders location rows and daily trends", async () => {
    render(<WebformAnalyticsScreen orgSlug="test-org" formId="form-abc" />);

    await waitFor(() => {
      expect(screen.getAllByText("hosted").length).toBeGreaterThan(0);
      expect(screen.getAllByText("https://example.com").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("2026-11-08")).toBeDefined();
    expect(screen.getByText("2026-11-09")).toBeDefined();
  });

  it("renders empty state when analytics has zero visits and zero submissions", async () => {
    mockFetchWebformAnalytics.mockResolvedValueOnce({
      ...mockAnalytics,
      totalVisits: 0,
      totalSubmissions: 0,
      totalAccepted: 0,
      overallConversionRate: 0,
      byLocation: [],
      daily: [],
    });

    render(<WebformAnalyticsScreen orgSlug="test-org" formId="form-abc" />);

    await waitFor(() => {
      expect(screen.getByTestId("analytics-empty-state")).toBeDefined();
    });

    expect(screen.getByText("No analytics data recorded yet")).toBeDefined();
  });

  it("triggers API re-fetch when date range or location changes", async () => {
    render(<WebformAnalyticsScreen orgSlug="test-org" formId="form-abc" />);

    await waitFor(() => {
      expect(mockFetchWebformAnalytics).toHaveBeenCalledTimes(1);
    });

    // Switch date range to 30d
    fireEvent.click(screen.getByTestId("range-30d"));
    await waitFor(() => {
      expect(mockFetchWebformAnalytics).toHaveBeenCalledTimes(2);
    });

    // Switch date range to all time
    fireEvent.click(screen.getByTestId("range-all"));
    await waitFor(() => {
      expect(mockFetchWebformAnalytics).toHaveBeenCalledTimes(3);
    });
    expect(mockFetchWebformAnalytics).toHaveBeenLastCalledWith(
      "test-org",
      "form-abc",
      expect.objectContaining({ startDate: undefined, endDate: undefined }),
    );

    // Switch location
    fireEvent.change(screen.getByTestId("analytics-location-filter"), {
      target: { value: "hosted" },
    });
    await waitFor(() => {
      expect(mockFetchWebformAnalytics).toHaveBeenCalledTimes(4);
    });
    expect(mockFetchWebformAnalytics).toHaveBeenLastCalledWith(
      "test-org",
      "form-abc",
      expect.objectContaining({ location: "hosted" }),
    );
  });
});
