import { ValidationError } from "@crm/core/errors";
import type { SearchGroup } from "@crm/core/records";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ClientRecordService } from "@/lib/api/client/provider";
import { render } from "@/test/render";
import { GlobalSearch } from "./global-search";
import { readSearchHistory, rememberSearchRecord, searchHistoryKey } from "./search-history";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/crm/example",
}));
const groups: SearchGroup[] = [
  {
    module: "Leads",
    total: 1,
    records: [
      {
        id: "lead-1",
        fields: {
          Full_Name: "Search Lead",
          First_Name: "Search",
          Last_Name: "Lead",
          Email: "lead@example.test",
          Phone: "123",
        },
      },
    ],
  },
  {
    module: "Contacts",
    total: 1,
    records: [
      {
        id: "contact-1",
        fields: {
          Full_Name: "Search Contact",
          First_Name: "Search",
          Last_Name: "Contact",
          Email: "contact@example.test",
          Phone: "456",
        },
      },
    ],
  },
  {
    module: "Accounts",
    total: 1,
    records: [
      {
        id: "account-1",
        fields: {
          Account_Name: "Search Account",
          Phone: "789",
          Website: "https://account.example",
        },
      },
    ],
  },
];
const search = vi.fn(async () => groups);
const service = { search } as unknown as ClientRecordService;
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  search.mockResolvedValue(groups);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Search records" }));
  return screen.findByRole("dialog", { name: "Search records" });
}
function mount(userId = "user") {
  return render(<GlobalSearch orgSlug="example" userId={userId} service={service} />);
}

test("opens empty without history; Escape restores focus and reopening resets query", async () => {
  const user = userEvent.setup();
  mount();
  const dialog = await open(user);
  const input = within(dialog).getByRole("textbox", { name: "Search records" });
  expect((input as HTMLInputElement).value).toBe("");
  expect(screen.queryByText("Search History")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(input));
  await user.type(input, "ab");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Search records" })),
  );
  await open(user);
  expect((screen.getByRole("textbox", { name: "Search records" }) as HTMLInputElement).value).toBe(
    "",
  );
});

test("module search filters choices, future modules stay inert and Contacts restricts requests", async () => {
  const user = userEvent.setup();
  mount();
  await open(user);
  await user.click(screen.getByRole("button", { name: "Search module" }));
  const menu = await screen.findByRole("dialog", { name: "Search Modules" });

  const products = within(menu).getByRole("button", { name: "Products" });
  expect(products.getAttribute("data-later-module")).toBe("P2");
  await user.click(products);
  expect(screen.getByRole("dialog", { name: "Search Modules" })).toBeTruthy();

  const meetings = within(menu).getByRole("button", { name: "Meetings" });
  expect(meetings.getAttribute("data-later-module")).toBeNull();

  const calls = within(menu).getByRole("button", { name: "Calls" });
  expect(calls.getAttribute("data-later-module")).toBeNull();

  const tasks = within(menu).getByRole("button", { name: "Tasks" });
  expect(tasks.getAttribute("data-later-module")).toBeNull();

  const deals = within(menu).getByRole("button", { name: "Deals" });
  expect(deals.getAttribute("data-later-module")).toBeNull();

  const accounts = within(menu).getByRole("button", { name: "Accounts" });
  expect(accounts.getAttribute("data-later-module")).toBeNull();
  await user.click(accounts);
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Search Modules" })).toBeNull());

  await user.click(screen.getByRole("button", { name: "Search module" }));
  const moduleMenu = await screen.findByRole("dialog", { name: "Search Modules" });
  await user.type(within(moduleMenu).getByRole("textbox"), "cont");
  expect(within(moduleMenu).queryByRole("button", { name: "Leads" })).toBeNull();
  await user.click(within(moduleMenu).getByRole("button", { name: "Contacts" }));
  await user.type(screen.getByRole("textbox", { name: "Search records" }), "Search");
  await waitFor(() =>
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ modules: ["Contacts"], perPage: 5 }),
    ),
  );
});

test("Meetings selection restricts search requests to Events", async () => {
  const user = userEvent.setup();
  mount();
  await open(user);
  await user.click(screen.getByRole("button", { name: "Search module" }));
  const menu = await screen.findByRole("dialog", { name: "Search Modules" });
  await user.click(within(menu).getByRole("button", { name: "Meetings" }));
  await user.type(screen.getByRole("textbox", { name: "Search records" }), "Search");
  await waitFor(() =>
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ modules: ["Events"], perPage: 5 }),
    ),
  );
});

test("short queries make no request; debounce calls once and groups lead/contact links", async () => {
  const user = userEvent.setup();
  mount();
  const dialog = await open(user);
  const input = within(dialog).getByRole("textbox");
  await user.type(input, "ab");
  await new Promise((resolve) => setTimeout(resolve, 350));
  expect(search).not.toHaveBeenCalled();
  await user.clear(input);
  await user.type(input, "Search");
  expect(search).not.toHaveBeenCalled();
  const lead = await screen.findByRole("link", { name: /Search Lead/ });
  expect(search).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("region", { name: "Contacts" })).toBeTruthy();
  expect(lead.getAttribute("href")).toBe("/crm/example/tab/Leads/lead-1");
  expect(screen.getByRole("link", { name: /Search Lead/ }).textContent).toContain(
    "lead@example.test · 123",
  );
  const contactLink = screen.getByRole("link", { name: /Search Contact/ });
  expect(contactLink.getAttribute("href")).toBe("/crm/example/tab/Contacts/contact-1");
  expect(contactLink.textContent).toContain("contact@example.test · 456");
  const accountLink = screen.getByRole("link", { name: /Search Account/ });
  expect(accountLink.textContent).toContain("789 · https://account.example");
  await user.click(screen.getByRole("button", { name: "Email Search Lead" }));
  expect(screen.getByRole("dialog", { name: "Search records" })).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Call Search Lead" }).getAttribute("data-later-module"),
  ).toBe("M5");
  await user.click(lead);
  await open(user);
  expect(screen.getByText("Search History")).toBeTruthy();
  expect(readSearchHistory(searchHistoryKey("example", "user"))).toEqual([
    { module: "Leads", id: "lead-1", name: "Search Lead" },
  ]);
});

test("hash prefix has a Record Name badge and is stripped from the service query", async () => {
  const user = userEvent.setup();
  mount();
  await open(user);
  await user.type(screen.getByRole("textbox", { name: "Search records" }), "#ab");
  await new Promise((resolve) => setTimeout(resolve, 350));
  expect(search).not.toHaveBeenCalled();
  await user.type(screen.getByRole("textbox", { name: "Search records" }), "c");
  expect(screen.getByText("#Record Name")).toBeTruthy();
  await waitFor(() =>
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ text: "abc", scope: "nameOrTags" }),
    ),
  );
  await user.keyboard("{Enter}");
  expect(navigation.push).toHaveBeenCalledWith("/crm/example/search?q=%23abc");
});

test("history is bounded, deduplicated and scoped by user and organization; invalid storage is safe", () => {
  const key = searchHistoryKey("example", "user");
  for (let index = 0; index < 18; index++)
    rememberSearchRecord(key, { module: "Leads", id: String(index), name: `Record ${index}` });
  expect(readSearchHistory(key)).toHaveLength(15);
  rememberSearchRecord(key, { module: "Leads", id: "5", name: "Reopened" });
  expect(readSearchHistory(key)[0]?.id).toBe("5");
  expect(readSearchHistory(key)).toHaveLength(15);
  expect(readSearchHistory(searchHistoryKey("other", "user"))).toEqual([]);
  expect(readSearchHistory(searchHistoryKey("example", "other"))).toEqual([]);
  localStorage.setItem(key, "invalid");
  expect(readSearchHistory(key)).toEqual([]);
  localStorage.setItem(key, '[null,{}, {"module":"Leads","id":4,"name":"Invalid"}]');
  expect(readSearchHistory(key)).toEqual([]);
});

test("empty results follow the shared empty-state copy", async () => {
  search.mockResolvedValue([]);
  const user = userEvent.setup();
  mount();
  await open(user);
  await user.type(screen.getByRole("textbox", { name: "Search records" }), "missing");
  expect(await screen.findByText("No records found.")).toBeTruthy();
});

test("outside interaction dismisses the layer and history links reopen the saved record", async () => {
  const key = searchHistoryKey("example", "user");
  rememberSearchRecord(key, { module: "Contacts", id: "contact-1", name: "Saved Contact" });
  const user = userEvent.setup();
  mount();
  const dialog = await open(user);
  const saved = within(dialog).getByRole("link", { name: "Saved Contact Contacts" });
  expect(saved.getAttribute("href")).toBe("/crm/example/tab/Contacts/contact-1");
  // Modal overlay is outside both dialog and modal, matching a page-background click.
  const overlay = dialog.parentElement?.parentElement;
  if (!overlay) throw new Error("Missing modal overlay");
  await user.click(overlay);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await open(user);
  await user.click(screen.getByRole("link", { name: "Saved Contact Contacts" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(readSearchHistory(key)[0]?.id).toBe("contact-1");
});

test("keeps at most five visible results per group and ignores a late previous query response", async () => {
  let resolveOld: (value: SearchGroup[]) => void = () => {};
  search.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  search.mockResolvedValueOnce([
    {
      module: "Leads",
      total: 7,
      records: Array.from({ length: 7 }, (_, index) => ({
        id: `new-${index}`,
        fields: { Full_Name: `New ${index}` },
      })),
    },
  ]);
  const user = userEvent.setup();
  mount();
  await open(user);
  const input = screen.getByRole("textbox", { name: "Search records" });
  await user.type(input, "old");
  await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
  await user.clear(input);
  await user.type(input, "new");
  await screen.findByRole("link", { name: "New 0" });
  const region = screen.getByRole("region", { name: "Leads" });
  expect(within(region).getAllByRole("link")).toHaveLength(5);
  resolveOld(groups);
  await waitFor(() => expect(screen.queryByRole("link", { name: /Search Lead/ })).toBeNull());
});

test("omits secondary line for modules without search field config", async () => {
  search.mockResolvedValueOnce([
    {
      module: "Vendors",
      total: 1,
      records: [
        {
          id: "case-1",
          fields: { Subject: "Future Vendor", Email: "hidden@example.test" },
        },
      ],
    },
  ]);
  const user = userEvent.setup();
  mount();
  await open(user);
  await user.type(screen.getByRole("textbox", { name: "Search records" }), "Future");
  const link = await screen.findByRole("link", { name: "case-1" });
  expect(link.textContent).toBe("case-1");
});

test("search errors use the shared error notice", async () => {
  search.mockRejectedValue(new ValidationError({ query: ["Search failed."] }));
  const user = userEvent.setup();
  mount();
  await open(user);
  await user.type(screen.getByRole("textbox", { name: "Search records" }), "error");
  expect((await screen.findByRole("alert")).textContent).toContain(
    "The page could not be loaded. Please try again.",
  );
});

for (const [module, titleField] of [
  ["Cases", "Subject"],
  ["Solutions", "Solution_Title"],
] as const) {
  test(`${module} search uses the registered title and detail route`, async () => {
    search.mockResolvedValueOnce([
      {
        module,
        total: 1,
        records: [{ id: "support-1", fields: { [titleField]: "Support title" } }],
      },
    ]);
    const user = userEvent.setup();
    mount();
    await open(user);
    await user.type(screen.getByRole("textbox", { name: "Search records" }), "Support");
    const link = await screen.findByRole("link", { name: "Support title" });
    expect(link.getAttribute("href")).toContain(`/tab/${module}/support-1`);
    expect(link.hasAttribute("data-later-module")).toBe(false);
  });
}
