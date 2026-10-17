import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { LastUpdateLabel } from "./last-update-label";

afterEach(cleanup);

test("renders text without clock glyph or tab-row class by default", () => {
  render(<LastUpdateLabel text="Updated 5 minutes ago" />);
  const label = screen.getByText("Updated 5 minutes ago");
  expect(label.tagName.toLowerCase()).toBe("p");
  expect(label.classList.contains("detail-last-update")).toBe(true);
  expect(label.classList.contains("detail-last-update--tab-row")).toBe(false);
  expect(label.querySelector("svg")).toBeNull();
});

test("with inTabRow adds tab-row class and decorative clock icon preceding text", () => {
  render(<LastUpdateLabel text="Updated 5 minutes ago" inTabRow />);
  const label = screen.getByText("Updated 5 minutes ago");
  expect(label.classList.contains("detail-last-update--tab-row")).toBe(true);
  const icon = label.querySelector("svg");
  expect(icon).not.toBeNull();
  expect(icon?.getAttribute("aria-hidden")).toBe("true");
  expect(label.childNodes[0]).toBe(icon);
  expect(label.childNodes[1]?.textContent).toBe("Updated 5 minutes ago");
});
