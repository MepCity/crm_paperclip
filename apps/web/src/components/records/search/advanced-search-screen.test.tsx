import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
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
) {
  return render(
    <ApiProvider orgSlug={ctx.orgSlug} service={service}>
      <AdvancedSearchScreen initialQuery={initialQuery} initialModule={initialModule} />
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

    // The sort triggered search should STILL have the unapplied modules (all 3)
    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modules: ["Contacts", "Accounts", "Leads"],
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
          modules: ["Contacts", "Accounts"],
        }),
      );
    });
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
});
