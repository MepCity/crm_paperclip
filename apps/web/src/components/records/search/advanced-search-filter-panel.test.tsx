import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import {
  AdvancedSearchFilterPanel,
  type AdvancedSearchFilterPanelProps,
} from "./advanced-search-filter-panel";
import { SYSTEM_FILTER_FIELDS } from "./constants";

afterEach(cleanup);

const testUsers = [
  { userId: "user-1", name: "Alice Smith", email: "alice@example.com" },
  { userId: "user-2", name: "Bob Jones", email: "bob@example.com" },
];

function getCheckbox(name: string): HTMLInputElement {
  return screen.getByRole("checkbox", { name }) as HTMLInputElement;
}

function getOperatorButton(label: string): HTMLButtonElement {
  return screen.getByRole("button", {
    name: new RegExp(`${label} operator$`),
  }) as HTMLButtonElement;
}

function queryOperatorButton(label: string): HTMLButtonElement | null {
  return screen.queryByRole("button", {
    name: new RegExp(`${label} operator$`),
  }) as HTMLButtonElement | null;
}

function renderPanel(overrides: Partial<AdvancedSearchFilterPanelProps> = {}) {
  const onApply = vi.fn();
  const onClear = vi.fn();
  const props: AdvancedSearchFilterPanelProps = {
    appliedModules: ["Leads", "Contacts"],
    onApply,
    onClear,
    users: testUsers,
    ...overrides,
  };

  const utils = render(<AdvancedSearchFilterPanel {...props} />);
  return { ...utils, props, onApply, onClear };
}

describe("AdvancedSearchFilterPanel", () => {
  it("renders panel with module list and system filter fields", () => {
    renderPanel();

    const panel = screen.getByRole("complementary", { name: "Search filter panel" });
    expect(panel).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Modules" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Search modules" })).toBeTruthy();

    // Registered modules have checkboxes with correct initial checked state
    const leadsCheckbox = getCheckbox("Leads");
    const contactsCheckbox = getCheckbox("Contacts");
    const accountsCheckbox = getCheckbox("Accounts");

    expect(leadsCheckbox.checked).toBe(true);
    expect(contactsCheckbox.checked).toBe(true);
    expect(accountsCheckbox.checked).toBe(false);

    // Later module (Products) is rendered with laterModule key and disabled
    const productsCheckbox = getCheckbox("Products");
    expect(
      productsCheckbox.disabled || productsCheckbox.getAttribute("aria-disabled") === "true",
    ).toBe(true);
    expect(productsCheckbox.getAttribute("data-later-module")).toBe("P2");

    // System filter fields section
    expect(screen.getByRole("heading", { name: "Filter By Fields" })).toBeTruthy();
    for (const field of SYSTEM_FILTER_FIELDS) {
      const fieldCheckbox = getCheckbox(field.label);
      expect(fieldCheckbox).toBeTruthy();
      expect(fieldCheckbox.checked).toBe(false);
    }

    // Action buttons
    expect(screen.getByRole("button", { name: "Apply Filter" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
  });

  it("filters module list with module search input", async () => {
    const user = userEvent.setup();
    renderPanel();

    const searchInput = screen.getByRole("textbox", { name: "Search modules" });

    // Search for "lead" (case insensitive)
    await user.type(searchInput, "lead");
    expect(screen.getByRole("checkbox", { name: "Leads" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Contacts" })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Accounts" })).toBeNull();

    // Search for "meet" (Meetings)
    await user.clear(searchInput);
    await user.type(searchInput, "meet");
    expect(screen.getByRole("checkbox", { name: "Meetings" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Leads" })).toBeNull();

    // Clear search restores all modules
    await user.clear(searchInput);
    expect(screen.getByRole("checkbox", { name: "Leads" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Contacts" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Accounts" })).toBeTruthy();
  });

  it("toggles module selection and applies updated module list", async () => {
    const user = userEvent.setup();
    const { onApply } = renderPanel({ appliedModules: ["Leads"] });

    const leadsCheckbox = getCheckbox("Leads");
    const accountsCheckbox = getCheckbox("Accounts");

    expect(leadsCheckbox.checked).toBe(true);
    expect(accountsCheckbox.checked).toBe(false);

    // Check Accounts and uncheck Leads
    await user.click(accountsCheckbox);
    expect(accountsCheckbox.checked).toBe(true);

    await user.click(leadsCheckbox);
    expect(leadsCheckbox.checked).toBe(false);

    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      modules: ["Accounts"],
      criteria: undefined,
      selectedFields: [],
      drafts: {},
    });
  });

  it("opens filter editor when field is checked, and removes editor when unchecked", async () => {
    const user = userEvent.setup();
    renderPanel();

    const ownedByCheckbox = getCheckbox("Owned By");
    expect(queryOperatorButton("Owned By")).toBeNull();

    // Check Owned By
    await user.click(ownedByCheckbox);
    expect(ownedByCheckbox.checked).toBe(true);

    // Filter editor controls appear
    expect(getOperatorButton("Owned By")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Owned By value" })).toBeTruthy();

    // Uncheck Owned By
    await user.click(ownedByCheckbox);
    expect(ownedByCheckbox.checked).toBe(false);
    expect(queryOperatorButton("Owned By")).toBeNull();
    expect(screen.queryByRole("button", { name: "Owned By value" })).toBeNull();
  });

  it("applies ownerlookup filter with selected user", async () => {
    const user = userEvent.setup();
    const { onApply } = renderPanel();

    // Select Owned By field
    await user.click(getCheckbox("Owned By"));

    // Select user from multi-select
    await user.click(screen.getByRole("button", { name: "Owned By value" }));
    await user.click(screen.getByRole("option", { name: "Alice Smith" }));
    await user.keyboard("{Escape}");

    // Click Apply Filter
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      modules: ["Leads", "Contacts"],
      criteria: {
        field: "Owner",
        comparator: "equal",
        value: ["user-1"],
      },
      selectedFields: ["Owner"],
      drafts: {
        Owner: expect.objectContaining({
          operatorId: "equal",
          value: ["user-1"],
        }),
      },
    });
  });

  it("applies datetime filter with relative offset and operator changes", async () => {
    const user = userEvent.setup();
    const { onApply } = renderPanel();

    // Select Created Date field
    await user.click(getCheckbox("Created Date"));

    // Default operator is "age in" with days
    expect(getOperatorButton("Created Date").textContent).toContain("age in");
    const valueInput = screen.getByRole("textbox", { name: "Created Date value" });
    await user.type(valueInput, "7");
    await user.tab();

    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    expect(onApply).toHaveBeenCalledWith({
      modules: ["Leads", "Contacts"],
      criteria: {
        field: "Created_Time",
        comparator: "less_equal",
        value: { token: "AGEINDAYS", offset: 7 },
      },
      selectedFields: ["Created_Time"],
      drafts: {
        Created_Time: expect.objectContaining({
          operatorId: "age_in",
          value: 7,
          daysUnit: "days",
        }),
      },
    });

    // Switch operator to "Today"
    await user.click(getOperatorButton("Created Date"));
    await user.click(screen.getByRole("option", { name: "Today" }));

    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    expect(onApply).toHaveBeenLastCalledWith({
      modules: ["Leads", "Contacts"],
      criteria: {
        field: "Created_Time",
        comparator: "equal",
        value: { token: "TODAY" },
      },
      selectedFields: ["Created_Time"],
      drafts: {
        Created_Time: expect.objectContaining({
          operatorId: "today",
        }),
      },
    });
  });

  it("combines multiple selected fields into AND criteria", async () => {
    const user = userEvent.setup();
    const { onApply } = renderPanel();

    // 1. Select Owned By and pick Alice Smith
    await user.click(getCheckbox("Owned By"));
    await user.click(screen.getByRole("button", { name: "Owned By value" }));
    await user.click(screen.getByRole("option", { name: "Alice Smith" }));
    await user.keyboard("{Escape}");

    // 2. Select Created Date and switch to Today
    await user.click(getCheckbox("Created Date"));
    await user.click(getOperatorButton("Created Date"));
    await user.click(screen.getByRole("option", { name: "Today" }));

    // Apply
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      modules: ["Leads", "Contacts"],
      criteria: {
        groupOperator: "and",
        group: [
          {
            field: "Owner",
            comparator: "equal",
            value: ["user-1"],
          },
          {
            field: "Created_Time",
            comparator: "equal",
            value: { token: "TODAY" },
          },
        ],
      },
      selectedFields: ["Owner", "Created_Time"],
      drafts: {
        Owner: expect.objectContaining({
          operatorId: "equal",
          value: ["user-1"],
        }),
        Created_Time: expect.objectContaining({
          operatorId: "today",
        }),
      },
    });
  });

  it("resets state and triggers onClear when Clear button is clicked", async () => {
    const user = userEvent.setup();
    const { onClear } = renderPanel({
      appliedModules: ["Deals"],
      appliedSelectedFields: ["Owner"],
      appliedDrafts: {
        Owner: {
          operatorId: "equal",
          value: ["user-1"],
        },
      },
      registeredModules: ["Leads", "Contacts", "Accounts"],
    });

    const ownedByCheckbox = getCheckbox("Owned By");
    expect(ownedByCheckbox.checked).toBe(true);
    expect(getOperatorButton("Owned By")).toBeTruthy();

    // Click Clear
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(ownedByCheckbox.checked).toBe(false);
    expect(queryOperatorButton("Owned By")).toBeNull();

    // Modules should be reset to default (registeredModules)
    expect(getCheckbox("Leads").checked).toBe(true);
    expect(getCheckbox("Contacts").checked).toBe(true);
    expect(getCheckbox("Accounts").checked).toBe(true);
  });

  it("synchronizes state when applied props change", () => {
    const { rerender } = renderPanel({
      appliedModules: ["Leads"],
      appliedSelectedFields: [],
      appliedDrafts: {},
    });

    expect(getCheckbox("Leads").checked).toBe(true);
    expect(getCheckbox("Contacts").checked).toBe(false);
    expect(getCheckbox("Owned By").checked).toBe(false);

    // Rerender with updated props
    rerender(
      <AdvancedSearchFilterPanel
        appliedModules={["Contacts", "Accounts"]}
        appliedSelectedFields={["Owner"]}
        appliedDrafts={{
          Owner: {
            operatorId: "equal",
            value: ["user-2"],
          },
        }}
        onApply={vi.fn()}
        onClear={vi.fn()}
        users={testUsers}
      />,
    );

    expect(getCheckbox("Leads").checked).toBe(false);
    expect(getCheckbox("Contacts").checked).toBe(true);
    expect(getCheckbox("Accounts").checked).toBe(true);
    expect(getCheckbox("Owned By").checked).toBe(true);
    expect(getOperatorButton("Owned By")).toBeTruthy();
  });
});
