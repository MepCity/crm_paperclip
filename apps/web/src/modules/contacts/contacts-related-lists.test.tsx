import { cleanup, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecordPageFrame } from "@/components/records/detail/record-page-frame";
import { RelatedCardsContainer } from "@/components/records/detail/related-cards-container";
import { render } from "@/test/render";
import { contactsRelatedLists, createContactsRelatedLists } from "./contacts-related-lists";

afterEach(cleanup);

describe("contactsRelatedLists definition", () => {
  it("defines exactly 19 cards in reference order", () => {
    expect(contactsRelatedLists).toHaveLength(19);

    const expectedOrder = [
      { order: 1, id: "notes", title: "Notes", moduleKey: "M6" },
      { order: 2, id: "connected-records", title: "Connected Records", moduleKey: "P3" },
      { order: 3, id: "attachments", title: "Attachments", moduleKey: "M6" },
      { order: 4, id: "cadences", title: "Cadences", moduleKey: "P3" },
      { order: 5, id: "deals", title: "Deals", moduleKey: "M4" },
      { order: 6, id: "open-activities", title: "Open Activities", moduleKey: "M5" },
      { order: 7, id: "closed-activities", title: "Closed Activities", moduleKey: "M5" },
      { order: 8, id: "invited-meetings", title: "Invited Meetings", moduleKey: "M5" },
      { order: 9, id: "products", title: "Products", moduleKey: "P2" },
      { order: 10, id: "cases", title: "Cases", moduleKey: "M8" },
      { order: 11, id: "quotes", title: "Quotes", moduleKey: "P2" },
      { order: 12, id: "sales-orders", title: "Sales Orders", moduleKey: "P2" },
      { order: 13, id: "purchase-orders", title: "Purchase Orders", moduleKey: "P2" },
      { order: 14, id: "emails", title: "Emails", moduleKey: "M10" },
      { order: 15, id: "invoices", title: "Invoices", moduleKey: "P2" },
      { order: 16, id: "campaigns", title: "Campaigns", moduleKey: "M7" },
      { order: 17, id: "social", title: "Social", moduleKey: "M15" },
      { order: 18, id: "reporting-contacts", title: "Reporting Contacts", moduleKey: "M2" },
      { order: 19, id: "voice-of-the-customer", title: "Voice of the Customer", moduleKey: "P3" },
    ];

    expectedOrder.forEach((expected, i) => {
      const actual = contactsRelatedLists[i];
      expect(actual).toBeDefined();
      if (!actual) return;
      expect(actual.order).toBe(expected.order);
      expect(actual.id).toBe(expected.id);
      expect(actual.title).toBe(expected.title);
      expect(actual.moduleKey).toBe(expected.moduleKey);
    });
  });

  it("assigns laterModule to all non-M2 cards and leaves M2 for Reporting Contacts", () => {
    const reportingContacts = contactsRelatedLists.find((c) => c.id === "reporting-contacts");
    expect(reportingContacts?.moduleKey).toBe("M2");

    for (const card of contactsRelatedLists) {
      if (card.id === "reporting-contacts") {
        expect(card.moduleKey).toBe("M2");
      } else {
        expect(card.moduleKey).not.toBe("M2");
      }
    }
  });
});

describe("RelatedCardsContainer with Contacts card set", () => {
  it("renders all 19 card titles and sections", () => {
    render(<RelatedCardsContainer relatedLists={contactsRelatedLists} />);

    for (const card of contactsRelatedLists) {
      const section = screen.getByRole("region", { name: card.title });
      expect(section).toBeTruthy();
    }
  });

  it("renders upper controls and verifies laterModule attributes", () => {
    render(<RelatedCardsContainer relatedLists={contactsRelatedLists} />);

    // D-54 Attach (M6)
    const attachBtn = screen.getByRole("button", { name: /^attach$/i });
    expect(attachBtn.getAttribute("data-later-module")).toBe("M6");
    expect(attachBtn.getAttribute("aria-disabled")).toBe("true");

    // D-55 Enroll (P3)
    const enrollBtn = screen.getByRole("button", { name: "Enroll" });
    expect(enrollBtn.getAttribute("data-later-module")).toBe("P3");

    // D-56 New Deal (M4)
    const newDealBtn = screen.getByRole("button", { name: "New Deal" });
    expect(newDealBtn.getAttribute("data-later-module")).toBe("M4");

    // D-57 to D-60 Open Activities controls (M5, M11)
    const addNewBtn = screen.getByRole("button", { name: /^add new$/i });
    expect(addNewBtn.getAttribute("data-later-module")).toBe("M5");

    const [openColumnView] = screen.getAllByRole("button", { name: "Column View" });
    expect(openColumnView).toBeDefined();
    expect(openColumnView?.getAttribute("data-later-module")).toBe("M5");

    const [openTablePlus] = screen.getAllByRole("button", { name: "Customize" });
    expect(openTablePlus).toBeDefined();
    expect(openTablePlus?.getAttribute("data-later-module")).toBe("M11");

    const [openExpand] = screen.getAllByRole("button", { name: "Expand" });
    expect(openExpand).toBeDefined();
    expect(openExpand?.getAttribute("data-later-module")).toBe("M5");

    // D-69 Add Products (P2)
    const addProductsBtn = screen.getByRole("button", { name: "Add Products" });
    expect(addProductsBtn.getAttribute("data-later-module")).toBe("P2");

    // D-70, D-71 Cases Assign & New (M8)
    const casesSection = screen.getByRole("region", { name: "Cases" });
    const casesAssign = casesSection.querySelector('button[data-later-module="M8"]');
    expect(casesAssign?.textContent).toContain("Assign");

    // D-79 Emails Compose Email (M10)
    const composeEmailBtn = screen.getByRole("button", { name: "Compose Email" });
    expect(composeEmailBtn.getAttribute("data-later-module")).toBe("M10");

    // D-80 to D-82 Emails subtabs (M10)
    expect(screen.getByRole("tab", { name: "Mails" }).getAttribute("data-later-module")).toBe(
      "M10",
    );
    expect(screen.getByRole("tab", { name: "Drafts" }).getAttribute("data-later-module")).toBe(
      "M10",
    );
    expect(
      screen.getByRole("tab", { name: "Scheduled" }).getAttribute("data-later-module"),
    ).toBe("M10");

    // D-87, D-88 Social links (M15)
    const twitterLink = screen.getByRole("link", { name: "Associate Twitter" });
    expect(twitterLink.getAttribute("data-later-module")).toBe("M15");
    const facebookLink = screen.getByRole("link", { name: "Associate Facebook" });
    expect(facebookLink.getAttribute("data-later-module")).toBe("M15");

    // D-92 Voice of the Customer Enable feature (P3)
    const enableFeatureBtn = screen.getByRole("button", { name: "Enable feature" });
    expect(enableFeatureBtn.getAttribute("data-later-module")).toBe("P3");
  });

  it("renders Reporting Contacts upper controls without laterModule and fires handlers", async () => {
    const user = userEvent.setup();
    const onHierarchyView = vi.fn();
    const onNew = vi.fn();

    const listsWithHandlers = createContactsRelatedLists({
      onHierarchyView,
      onNewReportingContact: onNew,
    });

    render(<RelatedCardsContainer relatedLists={listsWithHandlers} />);

    const reportingSection = screen.getByRole("region", { name: "Reporting Contacts" });
    const hierarchyBtn = within(reportingSection).getByRole("button", { name: "Hierarchy View" });

    // Both are active M2 controls: no data-later-module attribute
    expect(hierarchyBtn.hasAttribute("data-later-module")).toBe(false);
    expect(hierarchyBtn.getAttribute("aria-disabled")).toBeNull();

    await user.click(hierarchyBtn);
    expect(onHierarchyView).toHaveBeenCalledTimes(1);

    const newButton = within(reportingSection).getByRole("button", { name: "New" });
    expect(newButton.hasAttribute("data-later-module")).toBe(false);
    await user.click(newButton);
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it("renders record page footer with D-93, D-94, D-95 carrying laterModule M11", () => {
    render(<RelatedCardsContainer relatedLists={contactsRelatedLists} />);

    const footer = screen.getByRole("contentinfo", { name: "Record Management Section" });
    expect(footer).toBeTruthy();

    const addRelatedBtn = footer.querySelector('button[data-later-module="M11"]');
    expect(addRelatedBtn?.textContent).toContain("Add Related List");

    const customPageBtn = screen.getByRole("button", { name: "Create a custom record page" });
    expect(customPageBtn.getAttribute("data-later-module")).toBe("M11");

    const standardViewBtn = screen.getByRole("button", { name: "Standard View" });
    expect(standardViewBtn.getAttribute("data-later-module")).toBe("M11");
  });
});

describe("RecordPageFrame with Contacts rail", () => {
  it("renders 19 rail entries, badges, plus actions, and handles rail navigation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onAddReporting = vi.fn();

    const entries = contactsRelatedLists.map((item) => ({
      id: item.id,
      label: item.title,
      targetId: item.targetId,
      countBadge: item.countBadge,
      moduleKey: item.moduleKey,
      laterModule: item.moduleKey === "M2" ? undefined : item.moduleKey,
      railAction: item.railAction
        ? {
            id: item.railAction.id,
            label: item.railAction.label,
            moduleKey: item.railAction.moduleKey,
            laterModule: item.railAction.moduleKey === "M2" ? undefined : item.railAction.moduleKey,
            onAction: item.id === "reporting-contacts" ? onAddReporting : undefined,
          }
        : undefined,
    }));

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
                {contactsRelatedLists.map((c) => (
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
    expect(rail).toBeTruthy();

    // Verify all 19 links in the rail
    for (const item of contactsRelatedLists) {
      const link = within(rail).getByRole("link", { name: item.title });
      expect(link).toBeTruthy();

      if (item.moduleKey === "M2") {
        expect(link.hasAttribute("data-later-module")).toBe(false);
        expect(link.getAttribute("href")).toBe(`#${item.targetId}`);
      } else {
        expect(link.getAttribute("data-later-module")).toBe(item.moduleKey);
      }
    }

    // Verify plus button on Reporting Contacts row (M2) calls handler
    const reportingLink = within(rail).getByRole("link", { name: "Reporting Contacts" });
    const reportingRow = reportingLink.closest("div[class*='flex items-center']");
    const reportingAddBtn = reportingRow?.querySelector("button");
    expect(reportingAddBtn?.hasAttribute("data-later-module")).toBe(false);
    if (reportingAddBtn) {
      await user.click(reportingAddBtn);
      expect(onAddReporting).toHaveBeenCalledTimes(1);
    }

    // Verify active M2 rail link (Reporting Contacts) triggers onRelatedSelectionChange
    await user.click(reportingLink);
    expect(onSelect).toHaveBeenCalledWith("reporting-contacts");

    // Verify laterModule rail link does NOT trigger onRelatedSelectionChange
    onSelect.mockClear();
    const dealsLink = within(rail).getByRole("link", { name: "Deals" });
    await user.click(dealsLink);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
