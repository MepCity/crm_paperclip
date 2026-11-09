import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/client-provider";
import type { WebformDetail } from "./types";
import { WebformBuilderScreen } from "./webform-builder-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockWebformDetail = {
  id: "form-123",
  name: "Contact Us",
  module: "Cases",
  status: "draft",
  draftVersionId: "v-draft-1",
  publishedVersionId: null,
  publicKey: "wfk_key_123",
  createdAt: "2026-11-01T10:00:00Z",
  updatedAt: "2026-11-01T10:00:00Z",
  draftVersion: {
    id: "v-draft-1",
    number: 1,
    state: "draft",
    fields: [
      {
        fieldApiName: "Subject",
        label: "Subject",
        required: true,
        hidden: false,
        defaultValue: "",
        helpText: "Enter case subject",
      },
      {
        fieldApiName: "Status",
        label: "Status",
        required: false,
        hidden: false,
        defaultValue: "New",
        helpText: "",
      },
    ],
    settings: {
      buttonLabel: "Submit Request",
      ownerKind: "user" as const,
      ownerRef: "usr-1",
      notifyOwner: true,
      acknowledgement: { kind: "message" as const, text: "Thank you!" },
      challenge: false,
      restrictLocations: false,
      captureAttribution: false,
      approval: "none" as const,
      doubleOptIn: false,
      layout: "Support Layout",
    },
    publishedAt: null,
    publishedBy: null,
  },
  publishedVersion: null,
  locations: [],
};

const mockEligibleFields = [
  {
    apiName: "Subject",
    label: "Subject",
    dataType: "text",
    required: true,
  },
  {
    apiName: "Status",
    label: "Status",
    dataType: "picklist",
    required: false,
    picklistOptions: [
      { displayValue: "New", storedValue: "New" },
      { displayValue: "Closed", storedValue: "Closed" },
    ],
  },
  {
    apiName: "Priority",
    label: "Priority",
    dataType: "picklist",
    required: false,
    picklistOptions: [
      { displayValue: "High", storedValue: "High" },
      { displayValue: "Low", storedValue: "Low" },
    ],
  },
];

const mockUsers = [
  { id: "usr-1", name: "Alice Support" },
  { id: "usr-2", name: "Bob Agent" },
];

const mockRules = [
  { id: "rule-1", name: "Tier 1 Routing" },
  { id: "rule-2", name: "Escalations" },
];

vi.mock("./api", () => ({
  fetchWebform: vi.fn(async () => mockWebformDetail),
  fetchEligibleFields: vi.fn(async () => mockEligibleFields),
  fetchEligibleUsers: vi.fn(async () => mockUsers),
  fetchModuleAssignmentRules: vi.fn(async () => mockRules),
  updateDraft: vi.fn(async (_slug, _id, input) => ({
    ...mockWebformDetail,
    ...input,
  })),
  publishWebform: vi.fn(async () => ({
    ...mockWebformDetail,
    status: "active",
  })),
  addLocation: vi.fn(),
  removeLocation: vi.fn(),
  regenerateKey: vi.fn(),
}));

describe("WebformBuilderScreen", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders form fields with typed default value inputs and layout badge", async () => {
    render(<WebformBuilderScreen orgSlug="acme" formId="form-123" />);

    await waitFor(() => {
      expect(screen.getByText("Support Layout")).toBeDefined();
    });

    expect(screen.getByTestId("form-field-Subject")).toBeDefined();
    expect(screen.getByTestId("form-field-Status")).toBeDefined();

    // Subject has a text default value input
    expect(screen.getByTestId("field-default-input-Subject")).toBeDefined();

    // Status is a picklist, so it has a select default value input
    const statusSelect = screen.getByTestId("field-default-select-Status") as HTMLSelectElement;
    expect(statusSelect).toBeDefined();
    expect(statusSelect.value).toBe("New");
  });

  it("renders owner user picker and rule picker in settings dialog", async () => {
    render(<WebformBuilderScreen orgSlug="acme" formId="form-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("form-settings-button")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("form-settings-button"));

    // User select should be rendered with Alice Support and Bob Agent
    await waitFor(() => {
      expect(screen.getByTestId("settings-owner-user-select")).toBeDefined();
    });

    const userSelect = screen.getByTestId("settings-owner-user-select") as HTMLSelectElement;
    expect(userSelect.value).toBe("usr-1");
    expect(screen.getByText("Alice Support")).toBeDefined();
    expect(screen.getByText("Bob Agent")).toBeDefined();

    // Change owner kind to assignment_rule
    const ownerKindSelect = screen.getByRole("combobox", {
      name: /Assign Owner Kind/i,
    }) as HTMLSelectElement;
    fireEvent.change(ownerKindSelect, { target: { value: "assignment_rule" } });

    // Now assignment rule select should appear
    await waitFor(() => {
      expect(screen.getByTestId("settings-owner-rule-select")).toBeDefined();
    });

    expect(screen.getByText("Tier 1 Routing")).toBeDefined();
    expect(screen.getByText("Escalations")).toBeDefined();
  });

  it("validates that hidden required fields must have a default value before saving/publishing", async () => {
    render(<WebformBuilderScreen orgSlug="acme" formId="form-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("form-field-Subject")).toBeDefined();
    });

    // Subject is required. Toggle it to hidden without default value:
    const subjectCard = screen.getByTestId("form-field-Subject");
    const hiddenCheckbox = subjectCard.querySelector(
      'input[type="checkbox"]:not([data-testid])',
    ) as HTMLInputElement;
    fireEvent.click(hiddenCheckbox);

    // Warning message badge should appear on Subject card
    expect(screen.getByTestId("field-warning-Subject")).toBeDefined();

    // Attempting to save draft should fail with validation error and not call api
    const api = await import("./api");
    fireEvent.click(screen.getByTestId("save-draft-button"));

    expect(
      screen.getAllByText("Hidden required fields must have a default value.").length,
    ).toBeGreaterThan(0);
    expect(api.updateDraft).not.toHaveBeenCalled();
  });

  it("localizes stock field labels and defaults button label to Gönder in Turkish", async () => {
    // When form settings have default "Submit" button label:
    const detailWithDefaultButton = {
      ...mockWebformDetail,
      draftVersion: {
        ...mockWebformDetail.draftVersion,
        settings: {
          ...mockWebformDetail.draftVersion.settings,
          buttonLabel: "Submit",
        },
      },
    };
    const api = await import("./api");
    vi.mocked(api.fetchWebform).mockResolvedValueOnce(
      detailWithDefaultButton as unknown as WebformDetail,
    );

    render(
      <LanguageProvider language="tr">
        <WebformBuilderScreen orgSlug="acme" formId="form-123" />
      </LanguageProvider>,
    );

    // Subject stock field label should be localized to Konu
    await waitFor(() => {
      const subjectInput = screen.getByDisplayValue("Konu");
      expect(subjectInput).toBeDefined();
    });

    // Card header titles must show display label and never API names
    const subjectCard = screen.getByTestId("form-field-Subject");
    expect(subjectCard.textContent).toContain("Konu");
    expect(subjectCard.querySelector(".font-mono")?.textContent ?? "").not.toContain("Subject");

    const statusCard = screen.getByTestId("form-field-Status");
    expect(statusCard.textContent).toContain("Durum");
    expect(statusCard.querySelector(".font-mono")?.textContent ?? "").not.toContain("Status");

    // Status stock field label should be localized to Durum
    expect(screen.getByDisplayValue("Durum")).toBeDefined();

    // Available field Priority should be localized to Öncelik
    expect(screen.getByText("Öncelik")).toBeDefined();

    // Default button label should be localized to Gönder
    expect(screen.getByDisplayValue("Gönder")).toBeDefined();
  });
});
