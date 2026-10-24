// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSocialState } from "./fixture";
import { SocialConnectedScreen } from "./social-connected-screen";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function openMonitor() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Monitor" }));
  return user;
}

describe("Social connected fixture", () => {
  it("resolves states and defaults to disconnected", () => {
    expect(resolveSocialState(undefined)).toBe("not-connected");
    expect(resolveSocialState("bogus")).toBe("not-connected");
    expect(resolveSocialState("populated")).toBe("populated");
  });

  it("switches tabs", async () => {
    render(<SocialConnectedScreen state="populated" />);
    const user = userEvent.setup();
    for (const name of ["Monitor", "Post", "Activity Log", "Dashboard"]) {
      await user.click(screen.getByRole("tab", { name }));
      expect(screen.getByRole("tab", { name }).getAttribute("aria-selected")).toBe("true");
    }
  });

  it("filters, searches and refreshes without requests", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    render(<SocialConnectedScreen state="populated" />);
    const user = await openMonitor();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    await user.selectOptions(screen.getByLabelText("Network"), "Network B");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText("Interaction type"), "Message");
    await user.selectOptions(screen.getByLabelText("Brand"), "Brand One");
    expect(screen.getByText("No interactions found.")).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Network"), "All networks");
    await user.selectOptions(screen.getByLabelText("Brand"), "All brands");
    await user.type(screen.getByLabelText("Search monitor"), "demo");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(within(screen.getByRole("table")).getByText("Thanks for the demo")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(screen.getByTestId("refresh-count").textContent).toBe("1");
    expect(request).not.toHaveBeenCalled();
  });

  it("keeps column and compose actions unavailable", async () => {
    render(<SocialConnectedScreen state="populated" />);
    const user = await openMonitor();
    const add = screen.getByRole("button", { name: "Add column" });
    expect(add.getAttribute("aria-disabled")).toBe("true");
    await user.click(add);
    expect(screen.getAllByRole("columnheader")).toHaveLength(6);
  });

  it("renders empty and denied states distinctly", async () => {
    const { unmount } = render(<SocialConnectedScreen state="connected-empty" />);
    await openMonitor();
    expect(screen.getByText("No interactions found.")).toBeTruthy();
    unmount();
    render(<SocialConnectedScreen state="permission-denied" />);
    expect(screen.getByRole("alert").textContent).toMatch(/permission/);
    expect(screen.queryByRole("tab")).toBeNull();
  });
});
