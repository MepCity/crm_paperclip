import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { RecordRailToggle } from "./record-rail-toggle";

afterEach(cleanup);

describe("RecordRailToggle", () => {
  it("offers to hide the rail when it is visible", () => {
    render(<RecordRailToggle railVisible onRailVisibleChange={() => {}} />);
    const button = screen.getByRole("button", { name: "Hide Related List" });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("offers to show the rail when it is hidden", () => {
    render(<RecordRailToggle railVisible={false} onRailVisibleChange={() => {}} />);
    const button = screen.getByRole("button", { name: "Show Related List" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("reports hiding when pressed while visible", async () => {
    const onChange = vi.fn();
    render(<RecordRailToggle railVisible onRailVisibleChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Hide Related List" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("reports showing when pressed while hidden", async () => {
    const onChange = vi.fn();
    render(<RecordRailToggle railVisible={false} onRailVisibleChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Show Related List" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });
});
