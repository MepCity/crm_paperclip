import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { leadsScreenDefinition } from "@/modules/leads/definition";
import { moduleScreens } from "@/modules/registry";
import type { ModuleScreenDefinition } from "@/modules/types";
import { AdvancedSearchScreen } from "./advanced-search-screen";
import { MAX_SELECTED_COLUMNS } from "./constants";

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Test Org",
  userId: "user-1",
  role: "admin" as const,
};

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));

function createTestService() {
  const fixture = createFixtureRecordService(ctx);
  return createClientRecordService(fixture, {
    listUsers: async () => [
      { userId: "user-1", name: "Keith Martin", email: "keith@example.com" },
      { userId: "user-2", name: "Amelia Burrows", email: "amelia@example.com" },
    ],
  });
}

function renderSearch(
  service = createTestService(),
  initialQuery = "Sample",
  initialModule?: string,
  moduleDefinitions?: readonly ModuleScreenDefinition[],
) {
  return render(
    <ApiProvider orgSlug={ctx.orgSlug} service={service}>
      <AdvancedSearchScreen
        initialQuery={initialQuery}
        initialModule={initialModule}
        moduleDefinitions={moduleDefinitions}
      />
    </ApiProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AdvancedSearchScreen", () => {
  it("shows empty state when query is shorter than 3 characters without sending search requests", async () => {
    const service = createTestService();
    const searchSpy = vi.spyOn(service, "search");

    renderSearch(service, "ab");

    expect(screen.queryByRole("region", { name: "Leads search results" })).toBeNull();
    expect(searchSpy).not.toHaveBeenCalled();
  });

  it("renders search results across Leads, Contacts, Accounts cards, with Notes card and S-46 link", async () => {
    renderSearch();

    // Verify Leads and Contacts cards appear
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
      expect(screen.getByRole("region", { name: "Contacts search results" })).toBeTruthy();
    });

    // Verify module count badges S-23.Leads and S-23.Contacts
    expect(screen.getByTestId("module-count-Leads")).toBeTruthy();
    expect(screen.getByTestId("module-count-Contacts")).toBeTruthy();

    // Verify Notes card (M6) is drawn with count 0 and empty body
    expect(screen.getByRole("region", { name: "Notes search results" })).toBeTruthy();
    expect(screen.getByTestId("module-count-Notes").textContent).toContain("0");

    // Verify S-46 Cross-application search link
    const crossAppSearch = screen.getByRole("link", { name: "Search across applications" });
    expect(crossAppSearch).toBeTruthy();
    expect(crossAppSearch.getAttribute("data-later-module")).toBe("P3");
  });

  it("formats Owner cell using user display name rather than raw user id", async () => {
    renderSearch();

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Contacts search results" })).toBeTruthy();
    });

    const contactsCard = screen.getByRole("region", { name: "Contacts search results" });
    // Owner name Keith Martin should be rendered instead of user-1
    await waitFor(() => {
      expect(within(contactsCard).getAllByText("Keith Martin").length).toBeGreaterThan(0);
    });
  });

  it("handles Accounts as working filter item and renders Accounts card with active record link", async () => {
    const user = userEvent.setup();
    const service = createTestService();

    // Seed or search for Account
    renderSearch(service, "Account");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Accounts search results" })).toBeTruthy();
    });

    const accountsCard = screen.getByRole("region", { name: "Accounts search results" });
    expect(accountsCard).toBeTruthy();

    const accountLinks = within(accountsCard).getAllByRole("link");
    const recordLink = accountLinks.find((l) => l.getAttribute("href")?.includes("/tab/Accounts/"));
    expect(recordLink).toBeDefined();
    expect(recordLink?.getAttribute("data-later-module")).toBeNull();

    // Open filter panel
    await user.click(screen.getByRole("button", { name: "Filter" }));
    const filterPanel = screen.getByRole("complementary", { name: "Search filter panel" });

    // Accounts is a working checkbox (no laterModule on the checkbox)
    const accountsCb = within(filterPanel).getByRole("checkbox", { name: "Accounts" });
    expect(accountsCb.getAttribute("data-later-module")).toBeNull();
  });

  it("handles Deals as working filter item and renders Deals card with active record link", async () => {
    const user = userEvent.setup();
    const service = createTestService();

    // Search for Deal
    renderSearch(service, "Deal");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Deals search results" })).toBeTruthy();
    });

    const dealsCard = screen.getByRole("region", { name: "Deals search results" });
    expect(dealsCard).toBeTruthy();

    const dealLinks = within(dealsCard).getAllByRole("link");
    const recordLink = dealLinks.find((l) => l.getAttribute("href")?.includes("/tab/Deals/"));
    expect(recordLink).toBeDefined();
    expect(recordLink?.getAttribute("data-later-module")).toBeNull();

    // Open filter panel
    await user.click(screen.getByRole("button", { name: "Filter" }));
    const filterPanel = screen.getByRole("complementary", { name: "Search filter panel" });

    // Deals is a working checkbox (no laterModule on the checkbox)
    const dealsCb = within(filterPanel).getByRole("checkbox", { name: "Deals" });
    expect(dealsCb.getAttribute("data-later-module")).toBeNull();
  });

  it("keeps module checkbox changes as draft until Apply Filter is clicked", async () => {
    const user = userEvent.setup();
    const service = createTestService();
    const searchSpy = vi.spyOn(service, "search");

    renderSearch(service, "Sample");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
    });

    // Open filter panel
    await user.click(screen.getByRole("button", { name: "Filter" }));
    const filterPanel = screen.getByRole("complementary", { name: "Search filter panel" });

    // Uncheck Leads in the panel
    const leadsCb = within(filterPanel).getByRole("checkbox", { name: "Leads" });
    await user.click(leadsCb);

    searchSpy.mockClear();

    // Change sort before applying filter
    const sortSelect = screen.getByRole("button", { name: /Sort By/ });
    await user.click(sortSelect);
    const createdTimeOption = await screen.findByRole("option", { name: "Created Time" });
    await user.click(createdTimeOption);

    // The sort triggered search should STILL have the unapplied modules
    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modules: expect.arrayContaining(["Contacts", "Accounts", "Leads", "Deals"]),
          sort: { field: "Created_Time", order: "desc" },
        }),
      );
    });

    searchSpy.mockClear();

    // Now click Apply Filter
    const applyBtn = within(filterPanel).getByRole("button", { name: "Apply Filter" });
    await user.click(applyBtn);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modules: expect.arrayContaining(["Contacts", "Accounts", "Deals"]),
        }),
      );
    });
    const applied = searchSpy.mock.calls.at(-1)?.[0].modules ?? [];
    expect(applied).not.toContain("Leads");
  });

  it("sends empty array when all modules are deselected and shows no records", async () => {
    const user = userEvent.setup();
    const service = createTestService();
    const searchSpy = vi.spyOn(service, "search");

    renderSearch(service, "Sample");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
    });

    // Open filter panel
    await user.click(screen.getByRole("button", { name: "Filter" }));
    const filterPanel = screen.getByRole("complementary", { name: "Search filter panel" });

    // Deselect all working modules
    await user.click(within(filterPanel).getByRole("checkbox", { name: "Contacts" }));
    await user.click(within(filterPanel).getByRole("checkbox", { name: "Accounts" }));
    await user.click(within(filterPanel).getByRole("checkbox", { name: "Leads" }));
    await user.click(within(filterPanel).getByRole("checkbox", { name: "Deals" }));
    await user.click(within(filterPanel).getByRole("checkbox", { name: "Tasks" }));
    await user.click(within(filterPanel).getByRole("checkbox", { name: "Meetings" }));
    await user.click(within(filterPanel).getByRole("checkbox", { name: "Calls" }));

    searchSpy.mockClear();
    await user.click(within(filterPanel).getByRole("button", { name: "Apply Filter" }));

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modules: [],
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("No records found.")).toBeTruthy();
    });
  });

  it("handles field filtering and sends criteria in search filters", async () => {
    const user = userEvent.setup();
    const service = createTestService();
    const searchSpy = vi.spyOn(service, "search");

    renderSearch(service, "Sample");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
    });

    // Open filter panel
    await user.click(screen.getByRole("button", { name: "Filter" }));

    const filterPanel = screen.getByRole("complementary", { name: "Search filter panel" });

    // Enable Created By checkbox
    const createdByCb = within(filterPanel).getByRole("checkbox", { name: "Created By" });
    await user.click(createdByCb);

    // Filter editor should appear with user picker
    await waitFor(() => {
      expect(within(filterPanel).getByRole("button", { name: "Created By value" })).toBeTruthy();
    });

    // Select Keith Martin in user picker
    const userPicker = within(filterPanel).getByRole("button", { name: "Created By value" });
    await user.click(userPicker);

    const keithOption = await screen.findByRole("option", { name: "Keith Martin" });
    await user.click(keithOption);

    // Close the user multi-select popover
    await user.keyboard("{Escape}");

    searchSpy.mockClear();

    // Click Apply Filter
    const applyBtn = within(filterPanel).getByRole("button", { name: "Apply Filter" });
    await user.click(applyBtn);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            field: "Created_By",
            comparator: "equal",
          }),
        }),
      );
    });

    // Click Clear
    const clearBtn = within(filterPanel).getByRole("button", { name: "Clear" });
    searchSpy.mockClear();
    await user.click(clearBtn);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: undefined,
        }),
      );
    });
  });

  it("enforces max 10 columns limit in manage columns dialog", async () => {
    const user = userEvent.setup();
    renderSearch();

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
    });

    // Click manage columns icon on Leads card
    const manageColumnsBtn = screen.getByRole("button", { name: "Manage Leads columns" });
    await user.click(manageColumnsBtn);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Manage Columns Leads")).toBeTruthy();

    // Find all checkboxes in the dialog
    const checkboxes = within(dialog).getAllByRole("checkbox") as HTMLInputElement[];

    // Select checkboxes until 10 are selected
    let checkedCount = checkboxes.filter((cb) => cb.checked).length;
    for (const cb of checkboxes) {
      if (checkedCount >= MAX_SELECTED_COLUMNS) break;
      if (!cb.checked) {
        await user.click(cb);
        checkedCount++;
      }
    }

    expect(checkedCount).toBe(MAX_SELECTED_COLUMNS);

    // Verify any remaining unselected checkbox is disabled (11th cannot be checked)
    const unselectedBoxes = checkboxes.filter((cb) => !cb.checked);
    const firstUnselected = unselectedBoxes[0];
    if (firstUnselected) {
      expect(
        firstUnselected.disabled ||
          firstUnselected.getAttribute("aria-disabled") === "true" ||
          firstUnselected.getAttribute("data-disabled") === "true",
      ).toBe(true);
    }

    // Cancel closes dialog
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("paginates individual card on chevron click", async () => {
    const user = userEvent.setup();
    const service = createTestService();
    const searchSpy = vi.spyOn(service, "search");

    renderSearch(service, "Sample");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
    });

    searchSpy.mockClear();

    const nextBtn = screen.getByRole("button", { name: "Next Leads page" });
    await user.click(nextBtn);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modules: ["Leads"],
          page: 2,
        }),
      );
    });
  });

  it("renders later-module controls as inert with proper data-later-module attributes", async () => {
    renderSearch();

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
    });

    // Check phone call buttons have laterModule="M5"
    const callButtons = screen.getAllByRole("button", { name: "Call" });
    expect(callButtons.length).toBeGreaterThan(0);
    const firstCallBtn = callButtons[0];
    expect(firstCallBtn).toBeDefined();
    expect(firstCallBtn?.getAttribute("data-later-module")).toBe("M5");

    // Check Notes card controls
    const prevNotesBtn = screen.getByRole("button", { name: "Previous Notes page" });
    expect(prevNotesBtn.getAttribute("data-later-module")).toBe("M6");

    const manageNotesBtn = screen.getByRole("button", { name: "Manage Notes columns" });
    expect(manageNotesBtn.getAttribute("data-later-module")).toBe("M6");
  });

  it("preserves filter panel drafts across open/close and sends identical criteria on re-apply", async () => {
    const user = userEvent.setup();
    const service = createTestService();
    const searchSpy = vi.spyOn(service, "search");

    renderSearch(service, "Sample");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
    });

    // Open filter panel
    const filterToggle = screen.getByRole("button", { name: "Filter" });
    await user.click(filterToggle);

    let filterPanel = screen.getByRole("complementary", { name: "Search filter panel" });

    // Enable "Created By"
    const createdByCb = within(filterPanel).getByRole("checkbox", { name: "Created By" });
    await user.click(createdByCb);

    // Filter editor should appear with user picker
    await waitFor(() => {
      expect(within(filterPanel).getByRole("button", { name: "Created By value" })).toBeTruthy();
    });

    // Select Keith Martin in user picker
    const userPicker = within(filterPanel).getByRole("button", { name: "Created By value" });
    await user.click(userPicker);
    const keithOption = await screen.findByRole("option", { name: "Keith Martin" });
    await user.click(keithOption);
    await user.keyboard("{Escape}");

    searchSpy.mockClear();

    // Click Apply Filter
    const applyBtn = within(filterPanel).getByRole("button", { name: "Apply Filter" });
    await user.click(applyBtn);

    const expectedCriteria = expect.objectContaining({
      field: "Created_By",
      comparator: "equal",
    });

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expectedCriteria,
        }),
      );
    });

    // Close filter panel
    await user.click(filterToggle);
    expect(screen.queryByRole("complementary", { name: "Search filter panel" })).toBeNull();

    // Reopen filter panel
    await user.click(filterToggle);
    filterPanel = screen.getByRole("complementary", { name: "Search filter panel" });

    // Verify Created By is still checked and value button still shows Keith Martin
    const restoredCreatedByCb = within(filterPanel).getByRole("checkbox", { name: "Created By" });
    expect((restoredCreatedByCb as HTMLInputElement).checked).toBe(true);
    expect(
      within(filterPanel).getByRole("button", { name: "Created By value" }).textContent,
    ).toContain("Keith Martin");

    // Click Apply Filter again without changes
    searchSpy.mockClear();
    const reapplyBtn = within(filterPanel).getByRole("button", { name: "Apply Filter" });
    await user.click(reapplyBtn);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expectedCriteria,
        }),
      );
    });

    // Clear filters
    searchSpy.mockClear();
    const clearBtn = within(filterPanel).getByRole("button", { name: "Clear" });
    await user.click(clearBtn);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: undefined,
        }),
      );
    });

    // Verify checkbox is now unchecked
    expect(
      (within(filterPanel).getByRole("checkbox", { name: "Created By" }) as HTMLInputElement)
        .checked,
    ).toBe(false);
  });

  it("discards stale out-of-order search responses and keeps results from the latest query", async () => {
    const user = userEvent.setup();
    const service = createTestService();

    let resolveSlowSearch: ((val: unknown) => void) | undefined;
    const originalSearch = service.search.bind(service);

    vi.spyOn(service, "search").mockImplementation((query) => {
      if (query.text === "slowQuery") {
        return new Promise((resolve) => {
          resolveSlowSearch = () =>
            resolve([
              {
                module: "Leads",
                total: 1,
                records: [
                  {
                    id: "slow-lead-1",
                    fields: {
                      Full_Name: "Slow Lead Record",
                      Company: "Slow Corp",
                    },
                  },
                ],
              },
            ]);
        });
      }
      return originalSearch(query);
    });

    renderSearch(service, "");

    const searchInput = screen.getByRole("textbox", { name: "Search records" });

    // Submit slowQuery first
    await user.clear(searchInput);
    await user.type(searchInput, "slowQuery{Enter}");

    // Submit fast query "Sample" before slowQuery resolves
    await user.clear(searchInput);
    await user.type(searchInput, "Sample{Enter}");

    // Wait for "Sample" search to complete and render Leads region
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
      expect(screen.queryByText("Slow Lead Record")).toBeNull();
    });

    // Now resolve the older slowQuery
    resolveSlowSearch?.(null);

    // Stale slowQuery response must NOT overwrite results
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Slow Lead Record")).toBeNull();
  });

  it("prevents card pagination responses from overwriting subsequent new searches", async () => {
    const user = userEvent.setup();
    const service = createTestService();

    let resolvePage2: ((val: unknown) => void) | undefined;
    const originalSearch = service.search.bind(service);

    vi.spyOn(service, "search").mockImplementation((query) => {
      if (query.modules?.length === 1 && query.modules[0] === "Leads" && query.page === 2) {
        return new Promise((resolve) => {
          resolvePage2 = () =>
            resolve([
              {
                module: "Leads",
                total: 20,
                records: [
                  {
                    id: "page2-lead",
                    fields: {
                      Full_Name: "Page 2 Stale Lead",
                    },
                  },
                ],
              },
            ]);
        });
      }
      return originalSearch(query);
    });

    renderSearch(service, "Sample");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Leads search results" })).toBeTruthy();
    });

    // Click next page on Leads card (triggers async delayed page 2)
    const nextBtn = screen.getByRole("button", { name: "Next Leads page" });
    await user.click(nextBtn);

    // Before page 2 resolves, perform a new search "NewQuery"
    const searchInput = screen.getByRole("textbox", { name: "Search records" });
    await user.clear(searchInput);
    await user.type(searchInput, "NewQuery{Enter}");

    // Wait for "NewQuery" to finish
    await waitFor(() => {
      expect(screen.queryByText("Page 2 Stale Lead")).toBeNull();
    });

    // Now resolve the delayed card pagination
    resolvePage2?.(null);

    // Verify it did not overwrite the new search
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Page 2 Stale Lead")).toBeNull();
  });

  it("dynamically queries and renders cards for custom modules passed via moduleDefinitions", async () => {
    const service = createTestService();
    const baseDefinition = leadsScreenDefinition;
    const customDefinition: ModuleScreenDefinition = {
      ...baseDefinition,
      apiName: "Projects",
      tab: "Projects",
      singularLabel: "Project",
      pluralLabel: "Projects",
      pageTitle: "Projects",
      list: {
        ...baseDefinition.list,
        module: "Projects",
        linkField: "Project_Name",
      },
      searchColumns: ["Project_Name", "Project_Status"],
    };

    const definitions = [...moduleScreens, customDefinition];

    const searchSpy = vi.spyOn(service, "search").mockResolvedValue([
      {
        module: "Projects",
        total: 1,
        records: [
          {
            id: "proj-1",
            fields: {
              Project_Name: "CRM Overhaul",
              Project_Status: "In Progress",
            },
          },
        ],
      },
    ]);

    renderSearch(service, "CRM", undefined, definitions);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modules: expect.arrayContaining(["Projects"]),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Projects search results" })).toBeTruthy();
      expect(screen.getByText("CRM Overhaul")).toBeTruthy();
    });
  });
});
