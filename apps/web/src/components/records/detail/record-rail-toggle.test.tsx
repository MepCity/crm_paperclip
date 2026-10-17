import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { RecordRailToggle } from "./record-rail-toggle";

afterEach(cleanup);

test("when railVisible is true: button is named 'Hide Related List', aria-pressed and aria-expanded are true, and pressing toggles to false", async () => {
  const user = userEvent.setup();
  const onRailVisibleChange = vi.fn();
  render(<RecordRailToggle railVisible={true} onRailVisibleChange={onRailVisibleChange} />);
  const button = screen.getByRole("button", { name: "Hide Related List" });
  expect(button.getAttribute("aria-pressed")).toBe("true");
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(button.getAttribute("aria-controls")).toBe("record-related-rail");
  await user.click(button);
  expect(onRailVisibleChange).toHaveBeenCalledExactlyOnceWith(false);
});

test("when railVisible is false: button is named 'Show Related List', aria-pressed and aria-expanded are false, and pressing toggles to true", async () => {
  const user = userEvent.setup();
  const onRailVisibleChange = vi.fn();
  render(<RecordRailToggle railVisible={false} onRailVisibleChange={onRailVisibleChange} />);
  const button = screen.getByRole("button", { name: "Show Related List" });
  expect(button.getAttribute("aria-pressed")).toBe("false");
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(button.getAttribute("aria-controls")).toBe("record-related-rail");
  await user.click(button);
  expect(onRailVisibleChange).toHaveBeenCalledExactlyOnceWith(true);
});
