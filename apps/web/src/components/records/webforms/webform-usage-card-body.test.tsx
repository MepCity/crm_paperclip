import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isWebformUsageSupported, WebformUsageCardBody } from "./webform-usage-card-body";

vi.mock("@/modules/webforms/api", () => ({
  fetchRecordWebformUsage: vi.fn(async (_orgSlug: string, module: string, recordId: string) => {
    if (module === "Leads" && recordId === "lead-with-data") {
      return [
        {
          id: "sub-1",
          formId: "form-101",
          formName: "Contact Us Webform",
          location: "https://example.com",
          outcome: "accepted",
          createdAt: "2026-11-09T10:30:00.000Z",
        },
      ];
    }
    if (module === "Leads" && recordId === "lead-hosted") {
      return [
        {
          id: "sub-2",
          formId: "form-102",
          formName: "Hosted Lead Form",
          location: "hosted",
          outcome: "accepted",
          createdAt: "2026-11-09T11:00:00.000Z",
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

describe("WebformUsageCardBody & Guard", () => {
  afterEach(() => {
    cleanup();
  });
  it("strictly allows only Leads, Contacts, and Cases", () => {
    expect(isWebformUsageSupported("Leads")).toBe(true);
    expect(isWebformUsageSupported("Contacts")).toBe(true);
    expect(isWebformUsageSupported("Cases")).toBe(true);

    expect(isWebformUsageSupported("Accounts")).toBe(false);
    expect(isWebformUsageSupported("Deals")).toBe(false);
    expect(isWebformUsageSupported("Quotes")).toBe(false);
    expect(isWebformUsageSupported("Invoices")).toBe(false);
    expect(isWebformUsageSupported("Campaigns")).toBe(false);
  });

  it("returns null and suppresses query for unsupported modules", () => {
    const { container } = renderWithClient(
      <WebformUsageCardBody module="Accounts" recordId="acc-123" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders empty state when no submissions exist", async () => {
    renderWithClient(<WebformUsageCardBody module="Leads" recordId="lead-empty" />);
    const empty = await screen.findByTestId("webform-usage-empty");
    expect(empty).toBeDefined();
  });

  it("renders submissions table when submissions exist", async () => {
    renderWithClient(<WebformUsageCardBody module="Leads" recordId="lead-with-data" />);
    const table = await screen.findByTestId("webform-usage-table");
    expect(table).toBeDefined();
    expect(screen.getByText("Contact Us Webform")).toBeDefined();
    expect(screen.getByText("https://example.com")).toBeDefined();
    expect(screen.getByText(/accepted/i)).toBeDefined();
  });

  it("localizes hosted location in usage table", async () => {
    renderWithClient(<WebformUsageCardBody module="Leads" recordId="lead-hosted" />);
    const table = await screen.findByTestId("webform-usage-table");
    expect(table).toBeDefined();
    expect(screen.getByText("Hosted Lead Form")).toBeDefined();
    // In English translation mock, locationHosted is "Hosted"
    expect(screen.getByText("Hosted")).toBeDefined();
  });
});
