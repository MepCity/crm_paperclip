import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

afterEach(cleanup);

test("EmptyState exposes its title as the accessible name", () => {
  render(<EmptyState title="No leads" description="Create a lead to start a record." />);

  expect(screen.getByRole("heading", { name: "No leads" }).tagName).toBe("H2");
  expect(screen.getByText("Create a lead to start a record.")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});

test("EmptyState renders an optional action", () => {
  render(
    <EmptyState
      title="No results"
      description="Nothing matches these filters."
      action={<Button>Clear filters</Button>}
    />,
  );

  expect(screen.getByRole("heading", { name: "No results" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
});
