import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Badge } from "./badge";

afterEach(cleanup);

const variants = ["neutral", "success", "warning", "danger"] as const;

test("Badge renders its text", () => {
  render(<Badge>New</Badge>);

  const badge = screen.getByText("New");
  expect(badge.tagName).toBe("SPAN");
  expect(badge.textContent).toBe("New");
});

test.each(variants)("Badge renders its text for the %s variant", (variant) => {
  render(<Badge variant={variant}>Qualified</Badge>);

  expect(screen.getByText("Qualified").textContent).toBe("Qualified");
});

test("Badge is presentational and announces no status of its own", () => {
  render(<Badge variant="success">Won</Badge>);

  expect(screen.getByText("Won").textContent).toBe("Won");
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("Badge renders element children unchanged", () => {
  render(
    <Badge variant="warning">
      <strong>3 overdue</strong>
    </Badge>,
  );

  const child = screen.getByText("3 overdue");
  expect(child.tagName).toBe("STRONG");
  expect(child.textContent).toBe("3 overdue");
});
