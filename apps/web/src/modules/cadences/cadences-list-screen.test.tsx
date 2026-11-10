import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CadencesListScreen } from "./cadences-list-screen";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockFetchCadences = vi.fn();
const mockCreateCadence = vi.fn();

vi.mock("./api", () => ({
  fetchCadences: (...args: unknown[]) => mockFetchCadences(...args),
  createCadence: (...args: unknown[]) => mockCreateCadence(...args),
}));

describe("CadencesListScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state with create button and help marker when no cadences exist", async () => {
    mockFetchCadences.mockResolvedValue([]);

    render(<CadencesListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByTestId("cadence-empty-state")).toBeDefined();
    });

    expect(screen.getByTestId("create-cadence-button")).toBeDefined();
    const helpMarker = screen.getByTestId("cadence-help-marker");
    expect(helpMarker).toBeDefined();
    expect(helpMarker.getAttribute("href")).toBe("https://help.crm.reference/cadences");
  });

  it("renders cadences table when records are returned", async () => {
    mockFetchCadences.mockResolvedValue([
      {
        id: "cad-1",
        name: "Lead Onboarding Sequence",
        module: "Leads",
        status: "active",
        description: "Initial outreach for leads",
        audience: { kind: "manual" },
        recordCount: 5,
        publishedVersionId: "v-1",
        draftVersionId: null,
        createdAt: "2026-11-10T00:00:00Z",
        updatedAt: "2026-11-10T00:00:00Z",
      },
    ]);

    render(<CadencesListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByTestId("cadence-row-cad-1")).toBeDefined();
    });

    expect(screen.getByText("Lead Onboarding Sequence")).toBeDefined();
  });

  it("opens C2 create dialog and enforces validation on required fields", async () => {
    mockFetchCadences.mockResolvedValue([]);
    mockCreateCadence.mockResolvedValue({ id: "new-cad-123" });

    render(<CadencesListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByTestId("create-cadence-button")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("create-cadence-button"));

    expect(screen.getByTestId("create-cadence-dialog")).toBeDefined();

    const submitBtn = screen.getByTestId("cadence-next-button") as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    const nameInput = screen.getByTestId("cadence-name-input");
    fireEvent.change(nameInput, { target: { value: "Outreach 2026" } });

    // Still disabled because module is empty
    expect(submitBtn.disabled).toBe(true);

    const audienceSelect = screen.getByTestId("cadence-audience-select") as HTMLSelectElement;
    // Audience is disabled before module is selected
    expect(audienceSelect.disabled).toBe(true);

    const moduleSelect = screen.getByTestId("cadence-module-select");
    fireEvent.change(moduleSelect, { target: { value: "Leads" } });

    // Now audience is enabled (and set to manual), making Next enabled
    expect(audienceSelect.disabled).toBe(false);
    expect(submitBtn.disabled).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateCadence).toHaveBeenCalledWith("test-org", {
        name: "Outreach 2026",
        module: "Leads",
        description: "",
        audience: { kind: "manual" },
      });
      expect(mockPush).toHaveBeenCalledWith("/crm/test-org/settings/cadences/new-cad-123");
    });
  });

  it("filters cadences by search term", async () => {
    mockFetchCadences.mockResolvedValue([
      {
        id: "cad-1",
        name: "Alpha Leads",
        module: "Leads",
        status: "active",
        description: "",
        audience: { kind: "manual" },
        recordCount: 2,
        draftVersionId: null,
        publishedVersionId: "v-1",
        createdAt: "2026-11-10T00:00:00Z",
        updatedAt: "2026-11-10T00:00:00Z",
      },
    ]);

    render(<CadencesListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Leads")).toBeDefined();
    });

    mockFetchCadences.mockResolvedValue([
      {
        id: "cad-2",
        name: "Beta Deals",
        module: "Deals",
        status: "draft",
        description: "",
        audience: { kind: "manual" },
        recordCount: 0,
        draftVersionId: "v-2",
        publishedVersionId: null,
        createdAt: "2026-11-10T00:00:00Z",
        updatedAt: "2026-11-10T00:00:00Z",
      },
    ]);

    const searchInput = screen.getByTestId("cadence-search-input");
    fireEvent.change(searchInput, { target: { value: "Beta" } });

    await waitFor(() => {
      expect(screen.getByText("Beta Deals")).toBeDefined();
      expect(screen.queryByText("Alpha Leads")).toBeNull();
    });
  });
});
