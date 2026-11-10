import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CadenceEditorScreen } from "./cadence-editor-screen";
import type { CadenceDetail, CadenceVersion } from "./types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockFetchCadence = vi.fn();
const mockUpdateCadenceDraft = vi.fn();
const mockPublishCadence = vi.fn();
const mockActivateCadence = vi.fn();
const mockDeactivateCadence = vi.fn();
const mockDeleteCadence = vi.fn();

vi.mock("./api", () => ({
  fetchCadence: (...args: unknown[]) => mockFetchCadence(...args),
  updateCadenceDraft: (...args: unknown[]) => mockUpdateCadenceDraft(...args),
  publishCadence: (...args: unknown[]) => mockPublishCadence(...args),
  activateCadence: (...args: unknown[]) => mockActivateCadence(...args),
  deactivateCadence: (...args: unknown[]) => mockDeactivateCadence(...args),
  deleteCadence: (...args: unknown[]) => mockDeleteCadence(...args),
}));

const baseVersion: CadenceVersion = {
  id: "ver-1",
  organizationId: "org-1",
  cadenceId: "cad-123",
  number: 1,
  state: "draft",
  audience: { kind: "manual" },
  steps: [],
  exitRules: [],
  publishedAt: null,
  publishedBy: null,
  createdAt: "2026-11-10T00:00:00Z",
};

const baseCadence: CadenceDetail = {
  id: "cad-123",
  organizationId: "org-1",
  name: "Sales Prospecting",
  module: "Leads",
  status: "draft",
  description: "Test description",
  draftVersionId: "ver-1",
  publishedVersionId: null,
  createdAt: "2026-11-10T00:00:00Z",
  createdBy: "usr-1",
  updatedAt: "2026-11-10T00:00:00Z",
  updatedBy: "usr-1",
  recordCount: 0,
  publishedVersion: null,
  draftVersion: baseVersion,
  currentVersion: baseVersion,
};

describe("CadenceEditorScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders editor empty steps state and allows opening step modal", async () => {
    mockFetchCadence.mockResolvedValue(baseCadence);

    render(<CadenceEditorScreen orgSlug="test-org" cadenceId="cad-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("cadence-editor-name")).toBeDefined();
    });

    expect(screen.getByTestId("add-task-step-button")).toBeDefined();

    fireEvent.click(screen.getByTestId("add-task-step-button"));

    expect(screen.getByTestId("cadence-step-modal")).toBeDefined();
    expect(screen.getByTestId("step-task-subject-input")).toBeDefined();
  });

  it("adds a new step and saves draft", async () => {
    mockFetchCadence.mockResolvedValue(baseCadence);
    const updatedVersion: CadenceVersion = {
      ...baseVersion,
      steps: [
        {
          id: "step-1",
          kind: "task",
          subject: "Initial call task",
          dueOffsetDays: 0,
          priority: "Normal",
          delay: { amount: 1, unit: "days" },
        },
      ],
    };
    mockUpdateCadenceDraft.mockResolvedValue({
      ...baseCadence,
      draftVersion: updatedVersion,
      currentVersion: updatedVersion,
    });

    render(<CadenceEditorScreen orgSlug="test-org" cadenceId="cad-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("cadence-editor-name")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("add-task-step-button"));

    const subjectInput = screen.getByTestId("step-task-subject-input");
    fireEvent.change(subjectInput, { target: { value: "Initial call task" } });

    fireEvent.click(screen.getByTestId("step-save-button"));

    // Step should now be in the list
    expect(screen.getByText("Initial call task")).toBeDefined();

    // Click Save Draft
    fireEvent.click(screen.getByTestId("cadence-save-draft-button"));

    await waitFor(() => {
      expect(mockUpdateCadenceDraft).toHaveBeenCalledWith(
        "test-org",
        "cad-123",
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              kind: "task",
              subject: "Initial call task",
            }),
          ]),
        }),
      );
    });
  });

  it("toggles exit rules and publishes cadence", async () => {
    const versionWithStep: CadenceVersion = {
      ...baseVersion,
      steps: [
        {
          id: "step-1",
          kind: "task",
          subject: "Call customer",
          dueOffsetDays: 0,
          priority: "High",
          delay: { amount: 0, unit: "days" },
        },
      ],
    };
    const cadenceWithStep: CadenceDetail = {
      ...baseCadence,
      draftVersion: versionWithStep,
      currentVersion: versionWithStep,
    };

    mockFetchCadence.mockResolvedValue(cadenceWithStep);
    mockUpdateCadenceDraft.mockResolvedValue(cadenceWithStep);
    mockPublishCadence.mockResolvedValue({
      ...cadenceWithStep,
      status: "active",
      publishedVersionId: "ver-1",
      publishedVersion: versionWithStep,
      draftVersionId: null,
      draftVersion: null,
      currentVersion: versionWithStep,
    });

    render(<CadenceEditorScreen orgSlug="test-org" cadenceId="cad-123" />);

    await waitFor(() => {
      expect(screen.getByText("Call customer")).toBeDefined();
    });

    // Toggle reply exit rule
    const replyCheckbox = screen.getByTestId("exit-rule-reply-checkbox") as HTMLInputElement;
    fireEvent.click(replyCheckbox);
    expect(replyCheckbox.checked).toBe(true);

    // Toggle meeting exit rule
    const meetingCheckbox = screen.getByTestId("exit-rule-meeting-checkbox") as HTMLInputElement;
    fireEvent.click(meetingCheckbox);
    expect(meetingCheckbox.checked).toBe(true);

    // Click Publish
    fireEvent.click(screen.getByTestId("cadence-publish-button"));

    await waitFor(() => {
      expect(mockPublishCadence).toHaveBeenCalledWith("test-org", "cad-123");
    });
  });
});
