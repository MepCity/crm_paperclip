// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VisitsEntryScreen } from "./visits-entry-screen";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Visits entry", () => {
  it("keeps all carousel changes local and resets on remount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<VisitsEntryScreen />);
    expect(screen.getByRole("button", { name: "Slide 1" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByRole("heading", { name: "Help Your Team Follow Up" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByRole("heading", { name: "Generate More Qualified Leads" })).toBeTruthy();
    for (let i = 1; i <= 6; i++) {
      const indicator = screen.getByRole("button", { name: `Slide ${i}` });
      await user.click(indicator);
      expect(indicator.getAttribute("aria-pressed")).toBe("true");
      expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    }
    unmount();
    render(<VisitsEntryScreen />);
    expect(screen.getByRole("button", { name: "Slide 1" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("shows a disconnected introduction and leaves setup inert by pointer and keyboard", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    const user = userEvent.setup();
    render(<VisitsEntryScreen />);
    const setup = screen.getByRole("button", { name: "Get Started" });
    expect(setup.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText(/Setup is not available in this build/)).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    await user.click(setup);
    setup.focus();
    await user.keyboard("{Enter} ");
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
