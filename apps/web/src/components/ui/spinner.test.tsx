import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Spinner } from "./spinner";

afterEach(cleanup);

test("Spinner announces itself as a loading status by default", () => {
  render(<Spinner />);

  const status = screen.getByRole("status", { name: "Loading" });
  expect(status.getAttribute("aria-label")).toBe("Loading");
});

test("Spinner uses the label prop as its accessible name", () => {
  render(<Spinner label="Saving record" />);

  const status = screen.getByRole("status", { name: "Saving record" });
  expect(status.getAttribute("aria-label")).toBe("Saving record");
  expect(screen.queryByRole("status", { name: "Loading" })).toBeNull();
});

test("Spinner aria-hidden removes it from the accessibility tree", () => {
  render(<Spinner aria-hidden />);

  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("status", { hidden: true })).toBeNull();
});

test("Spinner keeps its icon decorative", () => {
  render(<Spinner />);

  const status = screen.getByRole("status", { name: "Loading" });
  expect(status.getAttribute("aria-hidden")).toBeNull();
  expect(screen.queryByRole("img")).toBeNull();
});
