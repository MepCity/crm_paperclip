import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Skeleton } from "./skeleton";

afterEach(cleanup);

test("Skeleton announces loading and hides the placeholder", () => {
  const { container } = render(<Skeleton />);

  const status = screen.getByRole("status");
  expect(status.textContent).toBe("Loading");
  expect(status.hasAttribute("aria-label")).toBe(false);
  expect(status.className).toContain("sr-only");
  const placeholder = container.querySelector("[aria-hidden='true']");
  expect(placeholder).toBeTruthy();
  expect(placeholder?.className).toContain("h-24");
  expect(screen.queryByRole("img")).toBeNull();
});

test("Skeleton row is a hidden placeholder with the same loading name", () => {
  const { container } = render(<Skeleton variant="row" />);

  expect(screen.getByRole("status").textContent).toBe("Loading");
  const placeholder = container.querySelector("[aria-hidden='true']");
  expect(placeholder?.className).toContain("h-4");
  expect(placeholder?.getAttribute("aria-hidden")).toBe("true");
});
