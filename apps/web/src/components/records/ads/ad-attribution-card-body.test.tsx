import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RecordAttributionResponse } from "@/modules/ads/api";
import { AdAttributionCardBody, isAdAttributionModule } from "./ad-attribution-card-body";

const api = vi.hoisted(() => ({
  fetchRecordAttribution: vi.fn(),
  saveRecordAttribution: vi.fn(),
}));
vi.mock("@/modules/ads/api", () => api);
vi.mock("@/lib/api/client/provider", () => ({ useOrgSlug: () => "test-org" }));

const options = {
  campaigns: [{ id: "c1", name: "Autumn Search" }],
  adGroups: [{ id: "g1", name: "Brand", campaignId: "c1" }],
  keywords: [{ id: "k1", name: "crm software", adGroupId: "g1" }],
  ads: [{ id: "a1", name: "Text ad A", adGroupId: "g1" }],
};
const attributed: RecordAttributionResponse = {
  attribution: {
    gclid: "test-gclid",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "Autumn Search",
    utmTerm: "crm software",
    utmContent: null,
    source: "conversion",
    modifiedTime: "2026-11-10T10:00:00.000Z",
    campaign: { id: "c1", name: "Autumn Search" },
    adGroup: { id: "g1", name: "Brand" },
    keyword: { id: "k1", name: "crm software" },
    ad: null,
  },
  canEdit: false,
  options: null,
};

function renderCard(module: string, recordId = "r1") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrap = (ui: ReactNode) => <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
  return render(wrap(<AdAttributionCardBody module={module} recordId={recordId} />));
}

describe("AdAttributionCardBody", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("supports only Leads, Contacts and Deals and never queries elsewhere", () => {
    expect(["Leads", "Contacts", "Deals"].every(isAdAttributionModule)).toBe(true);
    expect(isAdAttributionModule("Accounts")).toBe(false);
    expect(isAdAttributionModule("Tasks")).toBe(false);
    const { container } = renderCard("Accounts");
    expect(container.innerHTML).toBe("");
    expect(api.fetchRecordAttribution).not.toHaveBeenCalled();
  });

  it("shows campaign, group, keyword, UTM values and the source", async () => {
    api.fetchRecordAttribution.mockResolvedValue(attributed);
    renderCard("Deals", "d1");
    expect(await screen.findByTestId("ad-attribution-section")).toBeTruthy();
    expect(api.fetchRecordAttribution).toHaveBeenCalledWith("test-org", "Deals", "d1");
    expect(screen.getByTestId("ad-attribution-campaign").textContent).toContain("Autumn Search");
    expect(screen.getByTestId("ad-attribution-adGroup").textContent).toContain("Brand");
    expect(screen.getByTestId("ad-attribution-keyword").textContent).toContain("crm software");
    expect(screen.getByTestId("ad-attribution-ad").textContent).toContain("None");
    expect(screen.getByTestId("ad-attribution-gclid").textContent).toContain("test-gclid");
    expect(screen.getByTestId("ad-attribution-utmContent").textContent).toContain("None");
    expect(screen.getByTestId("ad-attribution-source").textContent).toContain("Lead conversion");
    // No edit right → no edit control.
    expect(screen.queryByTestId("ad-attribution-edit")).toBeNull();
  });

  it("shows the empty state", async () => {
    api.fetchRecordAttribution.mockResolvedValue({
      attribution: null,
      canEdit: false,
      options: null,
    });
    renderCard("Leads");
    expect((await screen.findByTestId("ad-attribution-empty")).textContent).toContain(
      "No ad attribution for this record.",
    );
  });

  it("shows an error when loading fails", async () => {
    api.fetchRecordAttribution.mockRejectedValue(new Error("boom"));
    renderCard("Leads");
    expect(await screen.findByTestId("ad-attribution-error")).toBeTruthy();
  });

  it("lets a user with edit right save a manual attribution", async () => {
    const user = userEvent.setup();
    api.fetchRecordAttribution.mockResolvedValue({
      attribution: null,
      canEdit: true,
      options,
    });
    api.saveRecordAttribution.mockResolvedValue({
      ...attributed,
      attribution: { ...attributed.attribution, source: "manual", gclid: "typed-click" },
      canEdit: true,
      options,
    });
    renderCard("Contacts", "ct1");
    await user.click(await screen.findByTestId("ad-attribution-edit"));
    expect(screen.getByTestId("ad-attribution-form")).toBeTruthy();
    await user.type(screen.getByLabelText("Click ID (GCLID)"), "typed-click");
    await user.type(screen.getByLabelText("UTM Source"), "google");
    await user.click(screen.getByTestId("ad-attribution-save"));
    await waitFor(() =>
      expect(api.saveRecordAttribution).toHaveBeenCalledWith(
        "test-org",
        "Contacts",
        "ct1",
        expect.objectContaining({
          gclid: "typed-click",
          utmSource: "google",
          utmMedium: null,
          campaignId: null,
          adGroupId: null,
        }),
      ),
    );
    expect((await screen.findByTestId("ad-attribution-source")).textContent).toContain("Manual");
    expect(screen.getByTestId("ad-attribution-gclid").textContent).toContain("typed-click");
  });

  it("cancel leaves the stored attribution unchanged", async () => {
    const user = userEvent.setup();
    api.fetchRecordAttribution.mockResolvedValue({ ...attributed, canEdit: true, options });
    renderCard("Leads");
    await user.click(await screen.findByTestId("ad-attribution-edit"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByTestId("ad-attribution-gclid").textContent).toContain("test-gclid");
    expect(api.saveRecordAttribution).not.toHaveBeenCalled();
  });
});
