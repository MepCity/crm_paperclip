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
    expect(screen.getByText("Send revised proposal")).toBeTruthy();
  });

  it("renders labelled empty states", () => {
    render(<HomeContent orgSlug="acme" userName="Ada" initialView="preview-empty" />);
    expect(screen.getAllByText(/local preview convention/)).toHaveLength(2);
  });
});
