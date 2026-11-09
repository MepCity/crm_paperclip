import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebformEmbedDialog } from "./webform-embed-dialog";

vi.mock("./api", () => ({
  regenerateKey: vi.fn(async () => ({
    publicKey: "wfk_new_regenerated_key_456",
    keyHash: "hash-456",
  })),
}));

describe("WebformEmbedDialog", () => {
  afterEach(() => {
    cleanup();
  });
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    orgSlug: "test-org",
    formId: "form-123",
    formName: "Lead Capture Form",
    module: "Leads" as const,
    status: "active" as const,
    publicKey: "wfk_test_initial_key_123",
    isPublished: true,
    onKeyRegenerated: vi.fn(),
  };

  it("renders embed dialog with form title and initial script embed snippet", () => {
    render(<WebformEmbedDialog {...defaultProps} />);

    expect(screen.getByText("Embed Codes: Lead Capture Form")).toBeDefined();
    expect(screen.getByTestId("embed-snippet-script")).toBeDefined();
    expect(screen.getByTestId("embed-snippet-script").textContent).toContain(
      "wfk_test_initial_key_123",
    );
  });

  it("switches tabs to iFrame, Hosted URL, and Source HTML", () => {
    render(<WebformEmbedDialog {...defaultProps} />);

    // Switch to iframe
    fireEvent.click(screen.getByTestId("embed-tab-iframe"));
    const iframeSnippet = screen.getByTestId("embed-snippet-iframe");
    expect(iframeSnippet.textContent).toContain("<iframe src=");
    expect(iframeSnippet.textContent).toContain("wfk_test_initial_key_123");

    // Switch to Hosted URL
    fireEvent.click(screen.getByTestId("embed-tab-url"));
    const urlSnippet = screen.getByTestId("embed-snippet-url");
    expect(urlSnippet.textContent).toContain("/f/wfk_test_initial_key_123");

    // Switch to Source HTML (disabled per ADR 0019)
    fireEvent.click(screen.getByTestId("embed-tab-source"));
    expect(
      screen.getByText(
        "Static source-HTML embed is not offered because secure form submissions require signed render tokens and anti-spam verification.",
      ),
    ).toBeDefined();
  });

  it("copies snippet text to clipboard", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<WebformEmbedDialog {...defaultProps} />);

    const copyBtn = screen.getByTestId("copy-script-button");
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining("wfk_test_initial_key_123"));
  });

  it("shows unpublished warning when form is not published", () => {
    render(<WebformEmbedDialog {...defaultProps} isPublished={false} />);
    expect(
      screen.getByText(
        "This form is not published yet. Publish the form so visitors can submit it.",
      ),
    ).toBeDefined();
  });

  it("regenerates public key and updates snippets", async () => {
    const onKeyRegenerated = vi.fn();
    render(<WebformEmbedDialog {...defaultProps} onKeyRegenerated={onKeyRegenerated} />);

    // Click regenerate button to open confirmation
    fireEvent.click(screen.getByTestId("regenerate-key-button"));

    // Confirm dialog appears
    const confirmBtn = screen.getByRole("button", { name: "Regenerate" });
    fireEvent.click(confirmBtn);

    // Wait for update
    const updatedSnippet = await screen.findByText(/wfk_new_regenerated_key_456/);
    expect(updatedSnippet).toBeDefined();
    expect(onKeyRegenerated).toHaveBeenCalledWith("wfk_new_regenerated_key_456");
  });
});
