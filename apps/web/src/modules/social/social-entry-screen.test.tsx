// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SocialEntryScreen } from "./social-entry-screen";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Social entry", () => {
  it("shows a disconnected introduction and leaves setup inert by pointer and keyboard", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    const user = userEvent.setup();
    render(<SocialEntryScreen />);
    const setup = screen.getByRole("button", { name: "Let's Get Started" });
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
