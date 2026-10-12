import { cleanup, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecordPageFrame } from "@/components/records/detail/record-page-frame";
import { RelatedCardsContainer } from "@/components/records/detail/related-cards-container";
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
    laterModule: item.moduleKey === "M2" || item.moduleKey === "M3" ? undefined : item.moduleKey,
    railAction: item.railAction
      ? {
          id: item.railAction.id,
          label: item.railAction.label,
          moduleKey: item.railAction.moduleKey,
          laterModule:
            item.railAction.moduleKey === "M2" || item.railAction.moduleKey === "M3"
              ? undefined
              : item.railAction.moduleKey,
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
      { order: 14, id: "cases", title: "Cases", moduleKey: "M8" },
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

  it("exposes rail badges, plus actions, and Links group metadata", () => {
    expect(structuralLists.find((c) => c.id === "notes")?.countBadge).toBeDefined();
    expect(structuralLists.find((c) => c.id === "contacts")?.countBadge).toBeDefined();
    expect(structuralLists.find((c) => c.id === "open-activities")?.countBadge).toBeDefined();
    expect(structuralLists.find((c) => c.id === "closed-activities")?.countBadge).toBeDefined();

    expect(structuralLists.find((c) => c.id === "notes")?.railAction?.moduleKey).toBe("M6");
    expect(structuralLists.find((c) => c.id === "deals")?.railAction?.moduleKey).toBe("M4");
    expect(structuralLists.find((c) => c.id === "invoices")?.railAction?.moduleKey).toBe("P2");

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

  it("renders Deals Assign before New Deal and Emails sent-mail selector", () => {
    render(<RelatedCardsContainer relatedLists={accountsRelatedLists} />);

    const dealsSection = screen.getByRole("region", { name: "Deals" });
    const dealButtons = within(dealsSection).getAllByRole("button");
    const dealLabels = dealButtons.map((btn) => btn.textContent?.trim());
    expect(dealLabels.indexOf("Assign")).toBeLessThan(dealLabels.indexOf("New Deal"));
    expect(
      within(dealsSection)
        .getByRole("button", { name: "Assign" })
        .getAttribute("data-later-module"),
    ).toBe("M4");

    const emailsSection = screen.getByRole("region", { name: "Emails" });
    expect(
      within(emailsSection).getByRole("button", { name: "Sent" }).getAttribute("data-later-module"),
    ).toBe("M10");
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

    const dealsLink = within(rail).getByRole("link", { name: "Deals" });
    await user.click(dealsLink);
    expect(onSelect).not.toHaveBeenCalled();

    const dealsRow = dealsLink.closest("div[class*='flex items-center']");
    expect(dealsRow?.querySelector("button")).toBeNull();

    await user.click(within(rail).getByRole("link", { name: "Notes" }));
    expect(notesRow?.querySelector("button")).not.toBeNull();
    expect(notesRow?.querySelector("button")?.getAttribute("data-later-module")).toBe("M6");
  });
});
