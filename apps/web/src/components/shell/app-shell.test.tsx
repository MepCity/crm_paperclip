import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/crm/acme",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const organizations = [{ name: "Acme", slug: "acme" }];
const user = { id: "user-1", name: "Example User", email: "user@example.test" };

function mount() {
  return render(
    <AppShell orgSlug="acme" organizations={organizations} user={user}>
      <p>Page body</p>
    </AppShell>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("lays out rail, top bar and main content area", () => {
  mount();
  const rail = screen.getByRole("complementary", { name: "Navigation rail" });
  expect(within(rail).getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
  const banner = screen.getByRole("banner");
  expect(within(banner).getByRole("heading", { level: 1 })).toBeTruthy();
  const main = screen.getByRole("main");
  expect(main.id).toBe("main-content");
  expect(within(main).getByText("Page body")).toBeTruthy();
  expect(rail.contains(main)).toBe(false);
  expect(banner.contains(main)).toBe(false);
});

test("top bar holds settings link scoped to the org and the user menu", () => {
  mount();
  const banner = screen.getByRole("banner");
  expect(within(banner).getByRole("link", { name: "Settings" }).getAttribute("href")).toBe(
    "/crm/acme/settings",
  );
  expect(within(banner).getByRole("button", { name: "User menu" })).toBeTruthy();
});

test("rail links use the org slug", () => {
  mount();
  const rail = screen.getByRole("complementary", { name: "Navigation rail" });
  for (const link of within(rail).getAllByRole("link")) {
    expect(link.getAttribute("href")).toContain("/crm/acme");
  }
});

test("skip link targets the main landmark and comes first", () => {
  mount();
  const skip = screen.getByRole("link", { name: "Skip to content" });
  expect(skip.getAttribute("href")).toBe("#main-content");
  expect(document.body.querySelector("a")).toBe(skip);
});
