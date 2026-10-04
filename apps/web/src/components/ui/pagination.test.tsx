import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Pagination } from "./pagination";

afterEach(cleanup);

test("Pagination asks for the previous and next page addresses", () => {
  const href = vi.fn((page: number) => `/leads?page=${page}`);
  render(<Pagination page={2} pageCount={4} href={href} />);

  expect(href.mock.calls.map((call) => call[0])).toEqual([1, 3]);
  expect(screen.getByRole("link", { name: "Previous" }).getAttribute("href")).toBe("/leads?page=1");
  expect(screen.getByRole("link", { name: "Next" }).getAttribute("href")).toBe("/leads?page=3");
  expect(screen.getByText("Page 2 / 4")).toBeTruthy();
});

test("Pagination disables Previous on the first page and does not link it", () => {
  const href = vi.fn((page: number) => `/leads?page=${page}`);
  render(<Pagination page={1} pageCount={3} href={href} />);

  expect(screen.queryByRole("link", { name: "Previous" })).toBeNull();
  const previous = screen.getByText("Previous");
  expect(previous.tagName).toBe("SPAN");
  expect(previous.getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByRole("link", { name: "Next" }).getAttribute("href")).toBe("/leads?page=2");
  expect(href.mock.calls.map((call) => call[0])).toEqual([2]);
});

test("Pagination disables Next on the last page and does not link it", () => {
  const href = vi.fn((page: number) => `/leads?page=${page}`);
  render(<Pagination page={3} pageCount={3} href={href} />);

  expect(screen.queryByRole("link", { name: "Next" })).toBeNull();
  const next = screen.getByText("Next");
  expect(next.tagName).toBe("SPAN");
  expect(next.getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByRole("link", { name: "Previous" }).getAttribute("href")).toBe("/leads?page=2");
  expect(href.mock.calls.map((call) => call[0])).toEqual([2]);
});

test("Pagination renders nothing when there is a single page", () => {
  const href = vi.fn((page: number) => `/leads?page=${page}`);
  render(<Pagination page={1} pageCount={1} href={href} />);

  expect(screen.queryByRole("navigation")).toBeNull();
  expect(href).not.toHaveBeenCalled();
});
