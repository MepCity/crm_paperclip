import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/client-provider";
import { render } from "@/test/render";
import { resolveHomeView } from "./fixture";
import { HomeOnboarding } from "./home-onboarding";
import { HomeContent, HomePreviewCards } from "./home-preview";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

describe("resolveHomeView", () => {
  it("defaults to onboarding", () => {
    expect(resolveHomeView(undefined)).toBe("onboarding");
    expect(resolveHomeView("x")).toBe("onboarding");
    expect(resolveHomeView("preview")).toBe("preview");
    expect(resolveHomeView("preview-empty")).toBe("preview-empty");
  });
});

describe("HomeContent", () => {
  it("shows onboarding by default", () => {
    render(<HomeContent orgSlug="acme" userName="Ada" initialView="onboarding" />);
    expect(screen.getByTestId("home-canvas")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Set up your CRM" })).toBeTruthy();
  });

  it("does not expose fixture previews through the home route", () => {
    render(<HomeContent orgSlug="acme" userName="Ada" initialView="preview" />);
    expect(screen.getByTestId("home-canvas")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Set up your CRM" })).toBeTruthy();
    expect(screen.queryByTestId("home-preview")).toBeNull();
  });
});

describe("HomeOnboarding", () => {
  it("renders onboarding intro and setup crm cards", () => {
    render(<HomeOnboarding orgSlug="acme" userName="Ada" />);
    expect(screen.getByTestId("home-onboarding")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Set up your CRM" })).toBeTruthy();
    expect(screen.getAllByText("Invite your team").length).toBeGreaterThan(0);
  });
});

describe("HomePreviewCards", () => {
  it("shows Open Activities with period filtering and detail links", () => {
    render(<HomePreviewCards orgSlug="acme" empty={false} />);
    expect(screen.getByText("Follow-up call").closest("a")?.getAttribute("href")).toBe(
      "/crm/acme/tab/Calls/c1",
    );
    expect(screen.getByTestId("activities-overdue").textContent).toContain("Send revised proposal");
    expect(screen.getByRole("region", { name: "Open Activities" }).textContent).not.toContain(
      "Review contract draft",
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Activity period" }), {
      target: { value: "next-week" },
    });
    const card = screen.getByRole("region", { name: "Open Activities" });
    expect(card.textContent).toContain("Review contract draft");
    expect(card.textContent).not.toContain("Follow-up call");
  });

  it("renders labelled empty states", () => {
    render(<HomePreviewCards orgSlug="acme" empty={true} />);
    expect(screen.getAllByText(/local preview convention/)).toHaveLength(3);
  });
});

it("translates preview periods and headings without changing period IDs", () => {
  render(
    <LanguageProvider language="tr">
      <HomePreviewCards orgSlug="acme" empty={false} />
    </LanguageProvider>,
  );
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "Bugün",
    "Bu Hafta",
    "Gelecek Hafta",
    "Sonraki 7 Gün",
  ]);
  expect(screen.getAllByRole("columnheader", { name: "Son Tarih" }).length).toBeGreaterThan(0);
  expect(screen.getByRole("table", { name: "Geciken Görevler" })).toBeTruthy();
  fireEvent.change(screen.getByRole("combobox", { name: "Aktivite dönemi" }), {
    target: { value: "next-week" },
  });
  expect(screen.getByRole("columnheader", { name: "Başlangıç" })).toBeTruthy();
  expect(screen.getByText("Quarterly review")).toBeTruthy();
});
