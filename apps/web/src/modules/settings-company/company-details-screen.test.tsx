// @vitest-environment jsdom
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { CompanyDetailsScreen } from "./company-details-screen";
import { fixtureCompanyDetails, fixtureCompanyDetailsPort } from "./fixture-port";
import type { CompanyDetailsPort } from "./port";

afterEach(cleanup);

describe("CompanyDetailsScreen", () => {
  it("loads the read-only inventory with contact slots and only the evidenced locale field", async () => {
    render(<CompanyDetailsScreen orgSlug="demo" />);
    expect(screen.getByRole("status").textContent).toContain("Loading");
    await screen.findByRole("heading", { name: fixtureCompanyDetails.name });
    expect(screen.getAllByRole("term")).toHaveLength(8);
    expect(screen.getByText("Fax")).toBeDefined();
    expect(screen.getByText("Address")).toBeDefined();
    expect(screen.getByText(/Coordinated Universal Time/)).toBeDefined();
    for (const label of [
      "Edit organization details",
      "Edit access URL",
      "Edit time zone",
      "Learn More",
      "Get Team User License",
    ]) {
      expect(screen.getByRole("button", { name: label })).toHaveProperty("disabled", true);
    }
    expect(screen.getByRole("link", { name: "Company Details" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Currencies" }).getAttribute("href")).toBe(
      "/crm/demo/settings/currencies",
    );
    expect(screen.getByRole("button", { name: "Fiscal Year" })).toHaveProperty("disabled", true);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByText("Country")).toBeNull();
    expect(screen.queryByText("Date Format")).toBeNull();
    expect(screen.queryByText("Number Format")).toBeNull();
  });

  it("renders injected read data and copies its access URL without a write port", async () => {
    const user = userEvent.setup();
    const data = {
      ...fixtureCompanyDetails,
      name: "Independent Fixture",
      accessUrl: "https://example.test/local/",
    };
    const readCompanyDetails = vi.fn().mockResolvedValue(data);
    render(<CompanyDetailsScreen orgSlug="demo" port={{ readCompanyDetails }} />);
    await screen.findByRole("heading", { name: data.name });
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await user.click(screen.getByRole("button", { name: "Copy access URL" }));
    expect(writeText).toHaveBeenCalledWith(data.accessUrl);
    expect(await screen.findByText("Access URL copied.")).toBeDefined();
    expect(readCompanyDetails).toHaveBeenCalledTimes(1);
  });

  it("reports a clipboard failure without changing displayed data", async () => {
    const user = userEvent.setup();
    render(<CompanyDetailsScreen orgSlug="demo" />);
    await screen.findByRole("heading", { name: fixtureCompanyDetails.name });
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Denied"));
    await user.click(screen.getByRole("button", { name: "Copy access URL" }));
    expect(await screen.findByText("Access URL could not be copied.")).toBeDefined();
    expect(screen.getByText(fixtureCompanyDetails.accessUrl)).toBeDefined();
  });

  it("shows read failures and discards stale results when the port changes", async () => {
    let resolveOld: ((value: typeof fixtureCompanyDetails) => void) | undefined;
    const oldPort: CompanyDetailsPort = {
      readCompanyDetails: () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    };
    const failedPort: CompanyDetailsPort = {
      readCompanyDetails: async () => {
        throw new Error("Read failed");
      },
    };
    const { rerender } = render(<CompanyDetailsScreen orgSlug="demo" port={oldPort} />);
    rerender(<CompanyDetailsScreen orgSlug="demo" port={failedPort} />);
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Company details could not be loaded.",
    );
    resolveOld?.(fixtureCompanyDetails);
    await waitFor(() => expect(screen.queryByText(fixtureCompanyDetails.name)).toBeNull());
    rerender(<CompanyDetailsScreen orgSlug="demo" port={fixtureCompanyDetailsPort} />);
    await screen.findByRole("heading", { name: fixtureCompanyDetails.name });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
