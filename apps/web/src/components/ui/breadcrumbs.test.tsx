import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Breadcrumbs } from "./breadcrumbs";

afterEach(cleanup);

test("Breadcrumbs keep the current page out of the links", () => {
  render(
    <Breadcrumbs
      items={[
        { label: "Home", href: "/" },
        { label: "Leads", href: "/leads" },
        { label: "Record", href: "/leads/1" },
      ]}
    />,
  );

  expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
  expect(screen.getByRole("link", { name: "Leads" }).getAttribute("href")).toBe("/leads");

  const current = screen.getByText("Record");
  expect(current.getAttribute("aria-current")).toBe("page");
  expect(current.tagName).not.toBe("A");
  expect(screen.queryByRole("link", { name: "Record" })).toBeNull();
});
