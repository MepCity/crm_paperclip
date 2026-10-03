import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Alert } from "./alert";

afterEach(cleanup);

const variants = ["info", "success", "warning", "danger"] as const;

test("Alert announces its message as an alert", () => {
  render(<Alert>The record was saved.</Alert>);

  const alert = screen.getByRole("alert");
  expect(alert.textContent).toBe("The record was saved.");
});

test("Alert renders its title as a heading with the same accessible name", () => {
  render(<Alert title="Cannot delete account">Close the open deals first.</Alert>);

  const heading = screen.getByRole("heading", { name: "Cannot delete account" });
  expect(heading.tagName).toBe("H3");
  expect(screen.getByRole("alert").textContent).toContain("Close the open deals first.");
});

test("Alert without a title exposes no heading", () => {
  render(<Alert>Just a message.</Alert>);

  expect(screen.queryByRole("heading")).toBeNull();
  expect(screen.getByRole("alert").textContent).toBe("Just a message.");
});

test.each(variants)("Alert keeps the %s variant in the accessibility tree", (variant) => {
  render(<Alert variant={variant}>Variant message</Alert>);

  const alert = screen.getByRole("alert");
  expect(alert.textContent).toBe("Variant message");
});

test("Alert hides its decorative icon from assistive technology", () => {
  render(<Alert variant="danger">Something went wrong.</Alert>);

  expect(screen.getByRole("alert").textContent).toBe("Something went wrong.");
  expect(screen.queryByRole("img")).toBeNull();
});
