import type { RecordData } from "@crm/core/records";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecordPageFrame } from "@/components/records/detail/record-page-frame";
import { RelatedCardsContainer } from "@/components/records/detail/related-cards-container";
import { resolveLaterModule } from "@/components/ui/later-module";
import { render } from "@/test/render";
import {
  createDealsRelatedLists,
  DEALS_EMAILS_SCOPE_LABEL,
  DEALS_OPEN_ACTIVITIES_COLUMN_VIEW_LABEL,
  dealsRelatedListRail,
  dealsRelatedLists,
} from "./deals-related-lists";

const dialogState = vi.hoisted(() => ({
  roles: [] as RecordData[],
  contacts: [] as RecordData[],
  loading: false,
  failed: false,
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => ({
    data: {
      fields: [
        {
          apiName: "Contact_Role",
          picklist: [
            { storedValue: "-None-", displayValue: "-None-" },
            { storedValue: "Purchasing", displayValue: "Purchasing" },
            { storedValue: "Evaluator", displayValue: "Evaluator" },
          ],
        },
      ],
    },
    isLoading: dialogState.loading,
    isError: dialogState.failed,
  }),
  useViews: () => ({ data: [{ id: "contacts", isDefault: true }] }),
  useAllRecordPages: (module: string) => ({
    data: module === "Contact_Roles" ? dialogState.roles : dialogState.contacts,
  }),
  useRecordList: (module: string) => ({
    data: { records: module === "Contact_Roles" ? dialogState.roles : dialogState.contacts },
  }),
  useCreateRecord: () => ({ mutateAsync: dialogState.create }),
  useUpdateRecord: () => ({ mutateAsync: dialogState.update }),
}));
beforeEach(() => {
  dialogState.roles = [
    {
      id: "role-1",
      fields: {
        Contact: { module: "Contacts", id: "linked", name: "Existing Contact" },
        Contact_Role: "Purchasing",
      },
    },
  ];
  dialogState.contacts = [
    { id: "linked", fields: { Full_Name: "Existing Contact" } },
    { id: "new", fields: { Full_Name: "New Contact" } },
  ];
  dialogState.loading = false;
  dialogState.failed = false;
  dialogState.create.mockReset().mockResolvedValue({});
  dialogState.update.mockReset().mockResolvedValue({});
});
afterEach(cleanup);

function mapRailEntries(lists: typeof dealsRelatedLists) {
  return lists.map((item) => ({
    id: item.id,
    label: item.title,
    targetId: item.targetId,
    countBadge: item.countBadge,
    moduleKey: item.moduleKey,
    laterModule: resolveLaterModule(item.moduleKey),
    railAction: item.railAction
      ? {
          id: item.railAction.id,
          label: item.railAction.label,
          moduleKey: item.railAction.moduleKey,
          laterModule: resolveLaterModule(item.railAction.moduleKey),
        }
      : undefined,
  }));
}

describe("createDealsRelatedLists definition", () => {
  const structuralLists = createDealsRelatedLists();

  it("defines 15 cards in reference rail order with module keys", () => {
    expect(structuralLists).toHaveLength(15);
    const expected = [
      { id: "notes", moduleKey: "M2" },
      { id: "connected-records", moduleKey: "P3" },
      { id: "attachments", moduleKey: "M6" },
      { id: "stage-history", moduleKey: "M4" },
      { id: "competitors", moduleKey: "P3" },
      { id: "cadences", moduleKey: "P3" },
      { id: "open-activities", moduleKey: "M5" },
      { id: "closed-activities", moduleKey: "M5" },
      { id: "products", moduleKey: "P2" },
      { id: "quotes", moduleKey: "P2" },
      { id: "sales-orders", moduleKey: "P2" },
      { id: "contact-roles", moduleKey: "M2" },
      { id: "emails", moduleKey: "M10" },
      { id: "cases", moduleKey: "M4" },
      { id: "invoices", moduleKey: "P2" },
    ];
    expected.forEach((row, index) => {
      expect(structuralLists[index]?.id).toBe(row.id);
      expect(structuralLists[index]?.moduleKey).toBe(row.moduleKey);
    });
  });

  it("draws Stage History rail badge only when count is positive", () => {
    expect(
      createDealsRelatedLists({ badges: { stageHistory: 0 } }).find((c) => c.id === "stage-history")
        ?.countBadge,
    ).toBeUndefined();
    expect(
      createDealsRelatedLists({ badges: { stageHistory: 2 } }).find((c) => c.id === "stage-history")
        ?.countBadge,
    ).toBe(2);
    expect(
      createDealsRelatedLists().find((c) => c.id === "contact-roles")?.countBadge,
    ).toBeUndefined();
  });

  it("draws the Contact Roles rail badge only for positive counts", () => {
    for (const count of [undefined, 0, 2]) {
      expect(
        createDealsRelatedLists({ badges: { contactRoles: count } }).find(
          (card) => card.id === "contact-roles",
        )?.countBadge,
      ).toBe(count ? count : undefined);
    }
  });

  it("omits activity rail badges when card holds zero records", () => {
    expect(structuralLists.find((c) => c.id === "open-activities")?.countBadge).toBeUndefined();
    expect(structuralLists.find((c) => c.id === "closed-activities")?.countBadge).toBeUndefined();
    const populated = createDealsRelatedLists({
      badges: { openActivities: 2, closedActivities: 3 },
    });
    expect(populated.find((c) => c.id === "open-activities")?.countBadge).toBe(2);
    expect(populated.find((c) => c.id === "closed-activities")?.countBadge).toBe(3);
  });

  it("exposes stage history columns and deals-specific email scope label", () => {
    const stageHistory = structuralLists.find((c) => c.id === "stage-history");
    expect(stageHistory?.tableColumns?.map((col) => col.label)).toEqual([
      "Stage",
      "Amount",
      "Probability (%)",
      "Expected Revenue",
      "Closing Date",
      "Stage Duration (Calendar Days)",
      "Modified Time",
      "Modified By",
    ]);
    const emails = structuralLists.find((c) => c.id === "emails");
    expect(emails?.subtabRowEndControl?.label).toBe(DEALS_EMAILS_SCOPE_LABEL);
  });

  it("uses the untranslated open activities column-view label", () => {
    const open = structuralLists.find((c) => c.id === "open-activities");
    const columnView = open?.upperControls?.find((ctrl) => ctrl.id === "column-view-open");
    expect(columnView?.label).toBe(DEALS_OPEN_ACTIVITIES_COLUMN_VIEW_LABEL);
  });
});

describe("RelatedCardsContainer with Deals card set", () => {
  it("renders all 15 card titles and record page footer", () => {
    render(<RelatedCardsContainer relatedLists={dealsRelatedLists} />);
    for (const card of dealsRelatedLists) {
      expect(screen.getByRole("region", { name: card.title })).toBeTruthy();
    }
    expect(screen.getByRole("contentinfo", { name: "Record Management Section" })).toBeTruthy();
  });

  it("renders Contact Roles headers without a count badge and inert upper controls", async () => {
    const user = userEvent.setup();
    render(<RelatedCardsContainer relatedLists={dealsRelatedLists} />);
    const section = screen.getByRole("region", { name: "Contact Roles" });
    expect(within(section).getByRole("columnheader", { name: "Role Name" })).toBeTruthy();
    expect(within(section).getByText("No records found")).toBeTruthy();
    const addRoles = within(section).getByRole("button", { name: "Add Contacts Roles" });
    expect(addRoles.hasAttribute("data-later-module")).toBe(false);
    await user.click(addRoles);
    const customize = within(section).getByRole("button", { name: "Customize" });
    expect(customize.getAttribute("data-later-module")).toBe("M11");
  });

  it("marks laterModule targets on non-working cards", async () => {
    const user = userEvent.setup();
    render(<RelatedCardsContainer relatedLists={dealsRelatedLists} />);
    const cadences = screen.getByRole("region", { name: "Cadences" });
    await user.click(within(cadences).getByRole("button", { name: "Enroll" }));
    const products = screen.getByRole("region", { name: "Products" });
    expect(
      within(products)
        .getByRole("button", { name: "Add Products" })
        .getAttribute("data-later-module"),
    ).toBe("P2");
  });

  it("does not render Show More on Notes", () => {
    render(<RelatedCardsContainer relatedLists={dealsRelatedLists} />);
    const notesSection = screen.getByRole("region", { name: "Notes" });
    expect(within(notesSection).queryByRole("button", { name: "Show More" })).toBeNull();
  });
});

describe("RecordPageFrame with Deals rail metadata", () => {
  it("renders rail plus actions for Notes, Cadences, Sales Orders and Invoices", async () => {
    const user = userEvent.setup();
    const lists = createDealsRelatedLists();
    const entries = mapRailEntries(lists);

    render(
      <RecordPageFrame
        header={<div>Header</div>}
        relatedListLabel="Related List"
        relatedEntries={entries}
        onRelatedSelectionChange={() => {}}
        tabsLabel="Tabs"
        selectedTabId="overview"
        onTabChange={() => {}}
        scrollTopLabel="Scroll To Top"
        relatedRailHeaderAction={
          <button type="button" aria-label={dealsRelatedListRail.organizeAriaLabel}>
            Organize
          </button>
        }
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div>
                {lists.map((c) => (
                  <div key={c.id} id={c.targetId}>
                    {c.title}
                  </div>
                ))}
              </div>
            ),
          },
        ]}
      />,
    );

    const rail = screen.getByRole("navigation", { name: "Related List" });
    const notesRow = within(rail)
      .getByRole("link", { name: "Notes" })
      .closest("div[class*='flex items-center']");
    expect(notesRow?.querySelector("button")).not.toBeNull();

    const competitorsLink = within(rail).getByRole("link", { name: "Competitors" });
    expect(competitorsLink.getAttribute("data-later-module")).toBe("P3");
    await user.click(competitorsLink);
    expect(competitorsLink.getAttribute("aria-disabled")).toBe("true");
  });
});

const deal: RecordData = {
  id: "deal-1",
  fields: { Account_Name: { module: "Accounts", id: "account-1" } },
};
function renderContactRoles() {
  render(
    <RelatedCardsContainer
      relatedLists={dealsRelatedLists.filter((card) => card.id === "contact-roles")}
      context={{ record: deal, orgSlug: "test", recordPath: (_module, id) => `/records/${id}` }}
    />,
  );
  return screen.getByRole("region", { name: "Contact Roles" });
}

describe("Contact Roles dialogs", () => {
  it("opens both dialogs from the card and closes with Cancel or Escape without writes", async () => {
    const user = userEvent.setup();
    const card = renderContactRoles();
    await user.click(within(card).getByRole("button", { name: "Add Contacts Roles" }));
    expect(screen.getByRole("dialog", { name: "Add Contacts Roles" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(within(card).getByRole("button", { name: "Edit All" }));
    expect(screen.getByRole("dialog", { name: "Edit All" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(dialogState.create).not.toHaveBeenCalled();
    expect(dialogState.update).not.toHaveBeenCalled();
  });

  it("adds an unlinked contact and metadata role using the record service", async () => {
    const user = userEvent.setup();
    const card = renderContactRoles();
    await user.click(within(card).getByRole("button", { name: "Add Contacts Roles" }));
    expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: /Contact Name/ }));
    expect(screen.queryByRole("option", { name: "Existing Contact" })).toBeNull();
    await user.click(screen.getByRole("option", { name: "New Contact" }));
    await user.click(screen.getByRole("button", { name: /Role Name/ }));
    await user.click(screen.getByRole("option", { name: "Evaluator" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(dialogState.create).toHaveBeenCalledWith({
        Deal: { module: "Deals", id: "deal-1" },
        Contact: { module: "Contacts", id: "new" },
        Contact_Role: "Evaluator",
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("edits only changed rows and keeps an error visible on failure for retry", async () => {
    const user = userEvent.setup();
    dialogState.update.mockRejectedValueOnce(new Error("failed"));
    const card = renderContactRoles();
    await user.click(within(card).getByRole("button", { name: "Edit All" }));
    expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: /Role Name for Existing Contact/ }));
    await user.click(screen.getByRole("option", { name: "Evaluator" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Unable to save contact roles",
    );
    expect(dialogState.update).toHaveBeenCalledWith({
      id: "role-1",
      input: { Contact_Role: "Evaluator" },
    });
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("shows empty and read failure states without enabling Save", async () => {
    const user = userEvent.setup();
    dialogState.roles = [];
    const card = renderContactRoles();
    await user.click(within(card).getByRole("button", { name: "Edit All" }));
    expect(within(screen.getByRole("dialog")).getByText("No records found")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    dialogState.failed = true;
    await user.click(within(card).getByRole("button", { name: "Add Contacts Roles" }));
    expect(screen.getByRole("alert").textContent).toContain("Unable to load contact roles");
    expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
  });
});
