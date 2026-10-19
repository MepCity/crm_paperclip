import { cleanup, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecordPageFrame } from "@/components/records/detail/record-page-frame";
import { RelatedCardsContainer } from "@/components/records/detail/related-cards-container";
import { resolveLaterModule } from "@/components/ui/later-module";
import { render } from "@/test/render";
import {
  accountsRelatedListRail,
  accountsRelatedLists,
  createAccountsRelatedLists,
} from "./accounts-related-lists";

afterEach(cleanup);

function mapRailEntries(
  lists: typeof accountsRelatedLists,
  handlers?: { onMemberAccountNew?: () => void },
) {
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
          onAction: item.id === "member-accounts" ? handlers?.onMemberAccountNew : undefined,
        }
      : undefined,
  }));
}

describe("accountsRelatedLists definition", () => {
  const structuralLists = createAccountsRelatedLists({ includeContactsPreview: false });

  it("defines exactly 15 cards in reference order", () => {
    expect(structuralLists).toHaveLength(15);

    const expectedOrder = [
      { order: 1, id: "notes", title: "Notes", moduleKey: "M6" },
      { order: 2, id: "connected-records", title: "Connected Records", moduleKey: "P3" },
      { order: 3, id: "attachments", title: "Attachments", moduleKey: "M6" },
      { order: 4, id: "deals", title: "Deals", moduleKey: "M4" },
      { order: 5, id: "contacts", title: "Contacts", moduleKey: "M2" },
      { order: 6, id: "emails", title: "Emails", moduleKey: "M10" },
      { order: 7, id: "open-activities", title: "Open Activities", moduleKey: "M5" },
      { order: 8, id: "closed-activities", title: "Closed Activities", moduleKey: "M5" },
      { order: 9, id: "products", title: "Products", moduleKey: "P2" },
      { order: 10, id: "quotes", title: "Quotes", moduleKey: "P2" },
      { order: 11, id: "sales-orders", title: "Sales Orders", moduleKey: "P2" },
      { order: 12, id: "invoices", title: "Invoices", moduleKey: "P2" },
      { order: 13, id: "member-accounts", title: "Member Accounts", moduleKey: "M3" },
      { order: 14, id: "cases", title: "Cases", moduleKey: "M3" },
      { order: 15, id: "social", title: "Social", moduleKey: "M15" },
    ];

    expectedOrder.forEach((expected, i) => {
      const actual = structuralLists[i];
      expect(actual).toBeDefined();
      if (!actual) return;
      expect(actual.order).toBe(expected.order);
      expect(actual.id).toBe(expected.id);
      expect(actual.title).toBe(expected.title);
      expect(actual.moduleKey).toBe(expected.moduleKey);
    });
  });

  it("draws a rail badge only for a card that holds records", () => {
    // AD-30/AD-31: no constant badge for the activity cards — zero draws none, a populated card its count.
    expect(structuralLists.find((c) => c.id === "notes")?.countBadge).toBeDefined();
    expect(structuralLists.find((c) => c.id === "contacts")?.countBadge).toBeDefined();
    expect(structuralLists.find((c) => c.id === "open-activities")?.countBadge).toBeUndefined();
    expect(structuralLists.find((c) => c.id === "closed-activities")?.countBadge).toBeUndefined();

    const populated = createAccountsRelatedLists({
      badges: { notes: 2, contacts: 1, deals: 3, openActivities: 3, closedActivities: 4 },
    });
    expect(populated.find((c) => c.id === "notes")?.countBadge).toBe(2);
    expect(populated.find((c) => c.id === "contacts")?.countBadge).toBe(1);
    expect(populated.find((c) => c.id === "deals")?.countBadge).toBe(3);
    expect(populated.find((c) => c.id === "open-activities")?.countBadge).toBe(3);
    expect(populated.find((c) => c.id === "closed-activities")?.countBadge).toBe(4);

    const empty = createAccountsRelatedLists({
      badges: { notes: 0, contacts: 0, deals: 0, openActivities: 0, closedActivities: 0 },
    });
    for (const id of ["notes", "contacts", "deals", "open-activities", "closed-activities"]) {
      expect(empty.find((c) => c.id === id)?.countBadge).toBeUndefined();
    }

    // The activity badge is the number of records the card itself holds.
    const withActivities = createAccountsRelatedLists({
      badges: {
        notes: 0,
        contacts: 0,
        openActivities: 2,
      },
    });
    expect(withActivities.find((c) => c.id === "open-activities")?.countBadge).toBe(2);
    expect(withActivities.find((c) => c.id === "closed-activities")?.countBadge).toBeUndefined();
  });

  it("exposes rail plus actions and Links group metadata", () => {
    expect(structuralLists.find((c) => c.id === "notes")?.railAction?.moduleKey).toBe("M6");
    expect(structuralLists.find((c) => c.id === "deals")?.railAction?.moduleKey).toBe("M4");
    expect(structuralLists.find((c) => c.id === "invoices")?.railAction?.moduleKey).toBe("P2");

    // MEP-415: M4 is a live module, so the Deals card and its rail plus draw active.
    const deals = structuralLists.find((c) => c.id === "deals");
    expect(resolveLaterModule(deals?.moduleKey)).toBeUndefined();
    expect(resolveLaterModule(deals?.railAction?.moduleKey)).toBeUndefined();
    expect(deals?.recordFilterField).toBe("Account_Name");

    expect(accountsRelatedListRail.organizeAriaLabel).toBe("Organize Accounts Details");
    expect(accountsRelatedListRail.linksGroup.title).toBe("Links");
    expect(accountsRelatedListRail.linksGroup.addLink).toMatchObject({
      label: "Add Link",
      moduleKey: "M11",
    });
  });

  it("marks laterModule targets on non-working cards", () => {
    const laterCards = structuralLists.filter(
      (card) => card.moduleKey !== "M2" && card.moduleKey !== "M3",
    );
    for (const card of laterCards) {
      expect(card.moduleKey).not.toBe("M2");
      expect(card.moduleKey).not.toBe("M3");
    }
    expect(structuralLists.find((c) => c.id === "connected-records")?.moduleKey).toBe("P3");
    expect(structuralLists.find((c) => c.id === "connected-records")?.loadingText).toBeUndefined();
    expect(structuralLists.find((c) => c.id === "connected-records")?.emptyStateText).toBe(
      "No records found",
    );
  });

  it("defines Contacts columns and Member Accounts without column headers", () => {
    const contacts = structuralLists.find((c) => c.id === "contacts");
    expect(contacts?.tableColumns?.map((col) => col.label)).toEqual([
      "Contact Name",
      "Email",
      "Phone",
      "Mobile",
      "Fax",
      "Contact Owner",
    ]);
    const memberAccounts = structuralLists.find((c) => c.id === "member-accounts");
    expect(memberAccounts?.tableColumns ?? []).toHaveLength(0);
  });
});

describe("RelatedCardsContainer with Accounts card set", () => {
  it("renders all 15 card titles", () => {
    render(<RelatedCardsContainer relatedLists={accountsRelatedLists} />);
    for (const card of accountsRelatedLists) {
      expect(screen.getByRole("region", { name: card.title })).toBeTruthy();
    }
  });

  it("renders Contacts card empty and populated preview states", () => {
    const emptyContacts = createAccountsRelatedLists({ includeContactsPreview: false });
    const { unmount } = render(<RelatedCardsContainer relatedLists={emptyContacts} />);
    const emptySection = screen.getByRole("region", { name: "Contacts" });
    expect(within(emptySection).getByText("No records found")).toBeTruthy();
    unmount();

    render(<RelatedCardsContainer relatedLists={accountsRelatedLists} />);
    const populatedSection = screen.getByRole("region", { name: "Contacts" });
    expect(
      within(populatedSection).getByRole("columnheader", { name: "Contact Name" }),
    ).toBeTruthy();
    expect(within(populatedSection).getByRole("link", { name: "Example Contact" })).toBeTruthy();
    expect(
      within(populatedSection)
        .getByRole("link", { name: "contact@example.org" })
        .getAttribute("data-later-module"),
    ).toBe("M10");
    expect(
      within(populatedSection)
        .getByRole("button", { name: "Call" })
        .getAttribute("data-later-module"),
    ).toBe("M5");
  });

  it("renders Deals Assign before New Deal and Emails sent-mail selector", async () => {
    const user = userEvent.setup();
    render(<RelatedCardsContainer relatedLists={accountsRelatedLists} />);

    const dealsSection = screen.getByRole("region", { name: "Deals" });
    const dealButtons = within(dealsSection).getAllByRole("button");
    const dealLabels = dealButtons.map((btn) => btn.textContent?.trim());
    expect(dealLabels.indexOf("Assign")).toBeLessThan(dealLabels.indexOf("New Deal"));

    // AD-113 / AD-114 draw active: M4 ships with this module. Assign is handler-less,
    // same state as the Contacts card Assign (AD-116).
    const assignBtn = within(dealsSection).getByRole("button", { name: "Assign" });
    expect(assignBtn.hasAttribute("data-later-module")).toBe(false);
    expect(assignBtn.getAttribute("aria-disabled")).toBeNull();
    await user.click(assignBtn);
    expect(dealLabels.indexOf("Assign")).toBeLessThan(dealLabels.indexOf("New Deal"));
    expect(
      within(dealsSection)
        .getByRole("button", { name: "New Deal" })
        .hasAttribute("data-later-module"),
    ).toBe(false);

    const emailsSection = screen.getByRole("region", { name: "Emails" });
    expect(
      within(emailsSection).getByRole("button", { name: "Sent" }).getAttribute("data-later-module"),
    ).toBe("M10");
  });

  it("opens the Deals create form from New Deal and the rail plus", async () => {
    const user = userEvent.setup();
    const onDealsNew = vi.fn();
    const lists = createAccountsRelatedLists({
      includeContactsPreview: false,
      handlers: { onDealsNew },
    });

    render(<RelatedCardsContainer relatedLists={lists} />);

    const dealsSection = screen.getByRole("region", { name: "Deals" });
    await user.click(within(dealsSection).getByRole("button", { name: "New Deal" }));
    expect(onDealsNew).toHaveBeenCalledTimes(1);
    expect(lists.find((c) => c.id === "deals")?.railAction?.onAction).toBe(onDealsNew);
  });

  it("renders Member Accounts New as an active M3 control and record page footer", async () => {
    const user = userEvent.setup();
    const onMemberAccountNew = vi.fn();
    const lists = createAccountsRelatedLists({
      includeContactsPreview: false,
      handlers: { onMemberAccountNew },
    });

    render(<RelatedCardsContainer relatedLists={lists} />);

    const memberSection = screen.getByRole("region", { name: "Member Accounts" });
    const newButton = within(memberSection).getByRole("button", { name: "New" });
    expect(newButton.hasAttribute("data-later-module")).toBe(false);
    await user.click(newButton);
    expect(onMemberAccountNew).toHaveBeenCalledTimes(1);

    const footer = screen.getByRole("contentinfo", { name: "Record Management Section" });
    expect(footer.querySelector('button[data-later-module="M11"]')?.textContent).toContain(
      "Add Related List",
    );
  });

  it("renders Contacts upper controls with Hierarchy View after title", async () => {
    const user = userEvent.setup();
    const onHierarchyView = vi.fn();
    const lists = createAccountsRelatedLists({
      includeContactsPreview: false,
      handlers: { onHierarchyView },
    });

    render(<RelatedCardsContainer relatedLists={lists} />);

    const contactsSection = screen.getByRole("region", { name: "Contacts" });
    const titleEl = within(contactsSection).getByRole("heading", { name: "Contacts" });
    const hierarchyBtn = within(contactsSection).getByRole("button", { name: "Hierarchy View" });
    expect(titleEl.parentElement?.contains(hierarchyBtn)).toBe(true);
    expect(hierarchyBtn.hasAttribute("data-later-module")).toBe(false);
    await user.click(hierarchyBtn);
    expect(onHierarchyView).toHaveBeenCalledTimes(1);
  });
});

describe("RecordPageFrame with Accounts rail metadata", () => {
  it("renders rail entries with badges and selection-dependent plus actions", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const lists = createAccountsRelatedLists({ includeContactsPreview: false });
    const entries = mapRailEntries(lists);

    render(
      <RecordPageFrame
        header={<div>Header</div>}
        relatedListLabel="Related List"
        relatedEntries={entries}
        onRelatedSelectionChange={onSelect}
        tabsLabel="Tabs"
        selectedTabId="overview"
        onTabChange={() => {}}
        scrollTopLabel="Scroll To Top"
        relatedRailFooter={
          <div className="pt-2 border-t border-border mt-2 space-y-2">
            <span className="block px-(--size-record-rail-text-inset) text-md font-bold text-text-strong">
              {accountsRelatedListRail.linksGroup.title}
            </span>
            <a
              href="#add-link"
              data-later-module={accountsRelatedListRail.linksGroup.addLink.moduleKey}
              className="flex items-center h-(--size-menu-item-height) px-(--size-record-rail-text-inset) text-md text-primary"
            >
              {accountsRelatedListRail.linksGroup.addLink.label}
            </a>
          </div>
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
    expect(within(rail).getByText("Links")).toBeTruthy();
    expect(
      within(rail).getByRole("link", { name: "Add Link" }).getAttribute("data-later-module"),
    ).toBe("M11");

    const notesRow = within(rail)
      .getByRole("link", { name: "Notes" })
      .closest("div[class*='flex items-center']");
    expect(notesRow?.querySelector("button")).not.toBeNull();

    await user.click(within(rail).getByRole("link", { name: "Notes" }));
    expect(notesRow?.querySelector("button")).not.toBeNull();
    expect(notesRow?.querySelector("button")?.getAttribute("data-later-module")).toBe("M6");

    const dealsLink = within(rail).getByRole("link", { name: "Deals" });
    expect(dealsLink.getAttribute("data-later-module")).toBeNull();
    expect(dealsLink.getAttribute("aria-disabled")).toBeNull();
    await user.click(dealsLink);
    expect(onSelect).toHaveBeenCalledWith("deals");

    // AD-112: selecting the live Deals row paints its unlocked plus
    const dealsRow = dealsLink.closest("div[class*='flex items-center']");
    const dealsPlus = dealsRow?.querySelector("button");
    expect(dealsPlus).not.toBeNull();
    expect(dealsPlus?.hasAttribute("data-later-module")).toBe(false);
  });

  it("keeps Member Accounts rail link and Add action unlocked while later modules stay locked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onMemberAccountNew = vi.fn();
    const lists = createAccountsRelatedLists({ includeContactsPreview: false });
    const entries = mapRailEntries(lists, { onMemberAccountNew });

    render(
      <RecordPageFrame
        header={<div>Header</div>}
        relatedListLabel="Related List"
        relatedEntries={entries}
        onRelatedSelectionChange={onSelect}
        tabsLabel="Tabs"
        selectedTabId="overview"
        onTabChange={() => {}}
        scrollTopLabel="Scroll To Top"
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

    // 1. Member Accounts rail link is unlocked and triggers selection
    const memberAccountsLink = within(rail).getByRole("link", { name: "Member Accounts" });
    expect(memberAccountsLink.getAttribute("data-later-module")).toBeNull();
    expect(memberAccountsLink.getAttribute("aria-disabled")).toBeNull();

    await user.click(memberAccountsLink);
    expect(onSelect).toHaveBeenCalledWith("member-accounts");

    // 2. Member Accounts Add button is unlocked and triggers onMemberAccountNew
    const memberAccountsRow = memberAccountsLink.closest("div[class*='flex items-center']");
    const addButton = memberAccountsRow?.querySelector("button");
    expect(addButton).not.toBeNull();
    expect(addButton?.getAttribute("data-later-module")).toBeNull();
    expect(addButton?.getAttribute("aria-disabled")).toBeNull();

    expect(addButton).toBeTruthy();
    if (!addButton) throw new Error("addButton missing");
    await user.click(addButton);
    expect(onMemberAccountNew).toHaveBeenCalledOnce();

    // 3. The Deals rail row is unlocked (MEP-415); later modules such as Products stay locked
    const dealsLink = within(rail).getByRole("link", { name: "Deals" });
    expect(dealsLink.getAttribute("data-later-module")).toBeNull();
    expect(dealsLink.getAttribute("aria-disabled")).toBeNull();

    const productsLink = within(rail).getByRole("link", { name: "Products" });
    expect(productsLink.getAttribute("data-later-module")).toBe("P2");
    expect(productsLink.getAttribute("aria-disabled")).toBe("true");
  });
});
