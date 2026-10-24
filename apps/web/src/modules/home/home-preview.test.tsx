import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { resolveHomeView } from "./fixture";
import { HomeContent } from "./home-preview";

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
  it("shows onboarding by default and switches locally via the selector", () => {
    render(<HomeContent orgSlug="acme" userName="Ada" initialView="onboarding" />);
    expect(screen.getByTestId("home-onboarding")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "Home page" }), {
      target: { value: "preview" },
    });
    expect(screen.getByTestId("home-preview")).toBeTruthy();
    expect(screen.getByText("Total deals: 9")).toBeTruthy();
    expect(screen.getAllByText("Send revised proposal").length).toBeGreaterThan(0);
  });

  it("shows Open Activities with period filtering and detail links", () => {
    render(<HomeContent orgSlug="acme" userName="Ada" initialView="preview" />);
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
    render(<HomeContent orgSlug="acme" userName="Ada" initialView="preview-empty" />);
    expect(screen.getAllByText(/local preview convention/)).toHaveLength(3);
  });
});
