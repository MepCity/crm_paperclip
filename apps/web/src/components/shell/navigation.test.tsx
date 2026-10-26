import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { shellNav } from "./nav";
import { Navigation } from "./navigation";

const navigation = vi.hoisted(() => ({ path: "/crm/acme" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.path }));

beforeEach(() => {
  navigation.path = "/crm/acme";
});
afterEach(cleanup);

test("renders the main navigation landmark with pinned links before sections", () => {
  render(<Navigation orgSlug="acme" />);
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  const first = within(nav).getAllByRole("link")[0];
  expect(first?.textContent).toBe(shellNav.links[0]?.label);
  expect(within(nav).getByRole("region", { name: "Teamspace" })).toBeTruthy();
});

test("renders links in the configured order", () => {
  render(<Navigation orgSlug="acme" />);
  const expected = [
    ...shellNav.links.map((l) => l.label),
    ...shellNav.sections.flatMap((s) => [
      ...s.groups.flatMap((g) => (g.links.length > 0 ? g.links.map((l) => l.label) : [])),
      ...(s.links ?? []).map((l) => l.label),
    ]),
  ];
  const actual = screen
    .getAllByRole("link")
    .map((a) => a.textContent)
    .filter((t) => expected.includes(t ?? ""));
  expect(actual).toEqual(expected);
});

test("builds every href from the org slug", () => {
  render(<Navigation orgSlug="my-org" />);
  for (const link of screen.getAllByRole("link")) {
    expect(link.getAttribute("href")?.startsWith("/crm/my-org")).toBe(true);
  }
});

test("marks only the route-matching link with aria-current", () => {
  navigation.path = "/crm/acme";
  const view = render(<Navigation orgSlug="acme" />);
  const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current"));
  expect(current).toHaveLength(1);
  expect(current[0]?.getAttribute("aria-current")).toBe("page");
  const leads = shellNav.sections[0]?.groups.flatMap((g) => g.links)[0];
  if (!leads) {
    throw new Error("no module link");
  }
  navigation.path = leads.href("acme");
  view.rerender(<Navigation orgSlug="acme" />);
  const now = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current"));
  expect(now).toHaveLength(1);
  expect(now[0]?.textContent).toBe(leads.label);
});

test("tab key moves focus through links in document order", async () => {
  const user = userEvent.setup();
  render(<Navigation orgSlug="acme" />);
  const links = screen.getAllByRole("link");
  await user.tab();
  expect(document.activeElement).toBe(links[0]);
  await user.tab();
  expect(document.activeElement).not.toBe(links[0]);
});

test.each(["solutions", "cases", "social"])("highlights exactly one row on the %s route", (id) => {
  const link = shellNav.sections[0]?.links?.find((l) => l.id === id);
  if (!link) {
    throw new Error(`no ${id} link`);
  }
  navigation.path = link.href("acme");
  render(<Navigation orgSlug="acme" />);
  const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current"));
  expect(current).toHaveLength(1);
  expect(current[0]?.textContent).toBe(link.label);
});

test("keeps Visits highlighted with aria-current on visit detail subroute", () => {
  navigation.path = "/crm/acme/tab/Visits/visit-1";
  render(<Navigation orgSlug="acme" />);
  const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current"));
  expect(current).toHaveLength(1);
  expect(current[0]?.textContent).toBe("Visits");
});
