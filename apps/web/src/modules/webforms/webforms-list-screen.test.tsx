import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebformsListScreen } from "./webforms-list-screen";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockFetchWebforms = vi.fn();
const mockFetchAutoResponseRules = vi.fn();
const mockCreateWebform = vi.fn();

vi.mock("./api", () => ({
  fetchWebforms: (...args: unknown[]) => mockFetchWebforms(...args),
  fetchAutoResponseRules: (...args: unknown[]) => mockFetchAutoResponseRules(...args),
  createWebform: (...args: unknown[]) => mockCreateWebform(...args),
  activateWebform: vi.fn(),
  deactivateWebform: vi.fn(),
  deleteWebform: vi.fn(),
  createAutoResponseRule: vi.fn(),
  updateAutoResponseRule: vi.fn(),
  deleteAutoResponseRule: vi.fn(),
  reorderAutoResponseRules: vi.fn(),
}));

describe("WebformsListScreen - Empty State & Dialog Parity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWebforms.mockResolvedValue([]);
    mockFetchAutoResponseRules.mockResolvedValue([]);
    mockCreateWebform.mockResolvedValue({ id: "new-form-123" });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state with a single New Form CTA, help marker, and learn more links", async () => {
    render(<WebformsListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByTestId("webforms-empty-state")).toBeDefined();
    });

    // Only one New Form CTA button in the empty state (no duplicate in the header)
    const newFormButtons = screen.getAllByTestId("new-form-button");
    expect(newFormButtons).toHaveLength(1);

    // Contextual help marker
    expect(screen.getByTestId("contextual-help-marker")).toBeDefined();

    // Analytics and A/B test Learn more links
    expect(screen.getByTestId("analytics-learn-more")).toBeDefined();
    expect(screen.getByTestId("ab-testing-learn-more")).toBeDefined();
  });

  it("opens dialog, focuses name input, and enforces Create gating (name + module required)", async () => {
    render(<WebformsListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByTestId("new-form-button")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("new-form-button"));

    // Name input is visible
    const nameInput = screen.getByTestId("form-name-input") as HTMLInputElement;
    expect(nameInput).toBeDefined();

    // Dialog initial focus on name input
    await waitFor(() => {
      expect(document.activeElement).toBe(nameInput);
    });

    const createButton = screen.getByTestId("dialog-create-button") as HTMLButtonElement;
    // Gating 1: Initially disabled (name empty, module unselected)
    expect(
      createButton.hasAttribute("disabled") ||
        createButton.getAttribute("aria-disabled") === "true",
    ).toBe(true);

    // Fill name only -> still disabled
    fireEvent.change(nameInput, { target: { value: "Lead Capture Form" } });
    expect(
      createButton.hasAttribute("disabled") ||
        createButton.getAttribute("aria-disabled") === "true",
    ).toBe(true);

    // Module dropdown starts empty with placeholder
    const moduleTrigger = screen.getByTestId("form-module-select");
    expect(moduleTrigger.textContent).toContain("Choose Module");

    // Open module menu
    fireEvent.click(moduleTrigger);
    expect(screen.getByTestId("module-menu")).toBeDefined();

    // Select module Leads
    const leadsOption = screen.getByTestId("module-option-Leads");
    expect(leadsOption).toBeDefined();
    fireEvent.click(leadsOption);

    // Now both name and module are populated -> Create is enabled
    expect(createButton.hasAttribute("disabled")).toBe(false);
    expect(createButton.getAttribute("aria-disabled")).not.toBe("true");

    // Clear name -> becomes disabled again
    fireEvent.change(nameInput, { target: { value: "   " } });
    expect(
      createButton.hasAttribute("disabled") ||
        createButton.getAttribute("aria-disabled") === "true",
    ).toBe(true);

    // Refill name -> enabled again and submit
    fireEvent.change(nameInput, { target: { value: "Lead Capture Form" } });
    expect(createButton.hasAttribute("disabled")).toBe(false);

    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateWebform).toHaveBeenCalledWith("test-org", {
        name: "Lead Capture Form",
        module: "Leads",
        layout: "Standard Layout",
      });
      expect(mockPush).toHaveBeenCalledWith("/crm/test-org/settings/webforms/new-form-123");
    });
  });

  it("filters searchable module menu and excludes Vendors", async () => {
    render(<WebformsListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByTestId("new-form-button")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("new-form-button"));

    const moduleTrigger = screen.getByTestId("form-module-select");
    fireEvent.click(moduleTrigger);

    // Vendors must stay excluded
    expect(screen.queryByTestId("module-option-Vendors")).toBeNull();

    // Leads, Contacts, Cases must be present
    expect(screen.getByTestId("module-option-Leads")).toBeDefined();
    expect(screen.getByTestId("module-option-Contacts")).toBeDefined();
    expect(screen.getByTestId("module-option-Cases")).toBeDefined();

    // Search filter
    const searchInput = screen.getByTestId("module-search-input");
    fireEvent.change(searchInput, { target: { value: "cont" } });

    expect(screen.getByTestId("module-option-Contacts")).toBeDefined();
    expect(screen.queryByTestId("module-option-Leads")).toBeNull();
    expect(screen.queryByTestId("module-option-Cases")).toBeNull();
  });

  it("renders populated table when webforms exist", async () => {
    mockFetchWebforms.mockResolvedValue([
      {
        id: "form-1",
        name: "Website Contact Form",
        module: "Leads",
        status: "active",
        createdAt: "2026-11-09T00:00:00Z",
      },
    ]);

    render(<WebformsListScreen orgSlug="test-org" />);

    await waitFor(() => {
      expect(screen.getByTestId("webforms-table")).toBeDefined();
    });

    expect(screen.queryByTestId("webforms-empty-state")).toBeNull();
    expect(screen.getByText("Website Contact Form")).toBeDefined();
  });
});
