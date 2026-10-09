import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { CreateRecordsMenu } from "./create-records";
import { type CreateRecordEntry, createRecordsNav } from "./nav";

const navigation = vi.hoisted(() => ({
  path: "/crm/example",
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => navigation,
}));

const extraEntry: CreateRecordEntry = {
  id: "Contacts",
  label: "Contact",
  path: (slug) => `/crm/${slug}/tab/Contacts/create`,
};

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Create Records" }));
  return screen.findByRole("dialog", { name: "Create Records" });
}

test("The registry holds one Lead entry pointing at the create page", () => {
  expect(createRecordsNav.map((entry) => entry.label)).toEqual(["Lead"]);
  expect(createRecordsNav[0]?.path("example")).toBe("/crm/example/tab/Leads/create");
});

test("The toolbar control is named Create Records and opens an empty search box", async () => {
  const user = userEvent.setup();
  render(<CreateRecordsMenu orgSlug="example" />);
  expect(screen.getByRole("button", { name: "Create Records" })).toBeTruthy();
  const dialog = await openMenu(user);
  const search = within(dialog).getByRole("textbox", { name: "Search" });
  expect(search.getAttribute("placeholder")).toBe("Search");
  expect((search as HTMLInputElement).value).toBe("");
});

test("The keyboard opens the menu with the search box focused and Escape closes it", async () => {
  const user = userEvent.setup();
  render(<CreateRecordsMenu orgSlug="example" />);
  const trigger = screen.getByRole("button", { name: "Create Records" });
  await user.tab();
  expect(document.activeElement).toBe(trigger);
  await user.keyboard("{Enter}");
  expect(await screen.findByRole("dialog", { name: "Create Records" })).toBeTruthy();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox")));
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("A click outside the panel closes the menu", async () => {
  const user = userEvent.setup();
  render(
    <>
      <CreateRecordsMenu orgSlug="example" />
      <p>Outside the panel</p>
    </>,
  );
  await openMenu(user);
  await user.click(screen.getByText("Outside the panel"));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

test("The Lead row links to the Create Lead page", async () => {
  const user = userEvent.setup();
  render(<CreateRecordsMenu orgSlug="example" />);
  const dialog = await openMenu(user);
  const row = within(dialog).getByRole("link", { name: "Lead" });
  expect(row.getAttribute("href")).toBe("/crm/example/tab/Leads/create");
  expect(within(dialog).getAllByRole("link")).toHaveLength(1);
});

test("Choosing a row closes the menu", async () => {
  const user = userEvent.setup();
  render(<CreateRecordsMenu orgSlug="example" />);
  const dialog = await openMenu(user);
  await user.click(within(dialog).getByRole("link", { name: "Lead" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

test("The search box filters rows by label and leaves the list empty on no match", async () => {
  const user = userEvent.setup();
  render(<CreateRecordsMenu orgSlug="example" entries={[...createRecordsNav, extraEntry]} />);
  const dialog = await openMenu(user);
  const search = within(dialog).getByRole("textbox", { name: "Search" });
  expect(
    within(dialog)
      .getAllByRole("link")
      .map((link) => link.textContent),
  ).toEqual(["Lead", "Contact"]);
  await user.type(search, "CON");
  expect(within(dialog).getByRole("link", { name: "Contact" })).toBeTruthy();
  expect(within(dialog).queryByRole("link", { name: "Lead" })).toBeNull();
  await user.clear(search);
  await user.type(search, "deal");
  expect(within(dialog).queryAllByRole("link")).toHaveLength(0);
});

test("A module joins the menu by adding a registry row", async () => {
  const user = userEvent.setup();
  render(<CreateRecordsMenu orgSlug="example" entries={[extraEntry]} />);
  const dialog = await openMenu(user);
  const row = within(dialog).getByRole("link", { name: "Contact" });
  expect(row.getAttribute("href")).toBe("/crm/example/tab/Contacts/create");
});
