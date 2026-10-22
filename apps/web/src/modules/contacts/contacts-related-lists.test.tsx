import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecordPageFrame } from "@/components/records/detail/record-page-frame";
import { RelatedCardsContainer } from "@/components/records/detail/related-cards-container";
import { resolveLaterModule } from "@/components/ui/later-module";
import { render } from "@/test/render";
import { contactsRelatedLists, createContactsRelatedLists } from "./contacts-related-lists";

afterEach(cleanup);

describe("contactsRelatedLists definition", () => {
  it("defines exactly 19 cards in reference order", () => {
    expect(contactsRelatedLists).toHaveLength(19);

    const expectedOrder = [
      { order: 1, id: "notes", title: "Notes", moduleKey: "M2" },
      { order: 2, id: "connected-records", title: "Connected Records", moduleKey: "P3" },
      { order: 3, id: "attachments", title: "Attachments", moduleKey: "M6" },
      { order: 4, id: "cadences", title: "Cadences", moduleKey: "P3" },
      { order: 5, id: "deals", title: "Deals", moduleKey: "M4" },
      { order: 6, id: "open-activities", title: "Open Activities", moduleKey: "M5" },
      { order: 7, id: "closed-activities", title: "Closed Activities", moduleKey: "M5" },
      { order: 8, id: "invited-meetings", title: "Invited Meetings", moduleKey: "M5" },
      { order: 9, id: "products", title: "Products", moduleKey: "P2" },
      { order: 10, id: "cases", title: "Cases", moduleKey: "M2" },
      { order: 11, id: "quotes", title: "Quotes", moduleKey: "P2" },
      { order: 12, id: "sales-orders", title: "Sales Orders", moduleKey: "P2" },
      { order: 13, id: "purchase-orders", title: "Purchase Orders", moduleKey: "P2" },
      { order: 14, id: "emails", title: "Emails", moduleKey: "M10" },
      { order: 15, id: "invoices", title: "Invoices", moduleKey: "P2" },
      { order: 16, id: "campaigns", title: "Campaigns", moduleKey: "M2" },
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

    expect(
      contactsRelatedLists.find((c) => c.id === "open-activities")?.countBadge,
    ).toBeUndefined();
    expect(
      contactsRelatedLists.find((c) => c.id === "closed-activities")?.countBadge,
    ).toBeUndefined();
  });

  it("assigns laterModule to all non-M2 cards and leaves M2 for Reporting Contacts", () => {
    const reportingContacts = contactsRelatedLists.find((c) => c.id === "reporting-contacts");
    expect(reportingContacts?.moduleKey).toBe("M2");

    for (const card of contactsRelatedLists) {
      // Campaigns, Cases and Notes cards are live and borrow the live key so their controls stay unlocked.
      if (
        card.id === "reporting-contacts" ||
        card.id === "campaigns" ||
        card.id === "cases" ||
        card.id === "notes"
      ) {
        expect(card.moduleKey).toBe("M2");
      } else {
        expect(card.moduleKey).not.toBe("M2");
      }
    }
  });

  it("draws an activity badge from the records the card holds, never a constant", () => {
    // D-30/D-31: the captured contact has no tasks, meetings or calls, so no badge is painted.
    const lists = createContactsRelatedLists();
    expect(lists.find((c) => c.id === "open-activities")?.countBadge).toBeUndefined();
    expect(lists.find((c) => c.id === "closed-activities")?.countBadge).toBeUndefined();
    expect(lists.find((c) => c.id === "open-activities")?.activityColumns).toHaveLength(2);
  });

  it("keeps the Deals card live and filtered on Contact Name (D-14, MEP-415)", () => {
    const deals = createContactsRelatedLists().find((c) => c.id === "deals");
    expect(deals?.moduleKey).toBe("M4");
    expect(resolveLaterModule(deals?.moduleKey)).toBeUndefined();
    expect(deals?.recordFilterField).toBe("Contact_Name");
    expect(deals?.countBadge).toBeUndefined();

    const withDeals = createContactsRelatedLists({}, { deals: 2 });
    expect(withDeals.find((c) => c.id === "deals")?.countBadge).toBe(2);
    expect(
      createContactsRelatedLists({}, { deals: 0 }).find((c) => c.id === "deals")?.countBadge,
    ).toBeUndefined();
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

  it("opens the Deals create form from the Deals card New Deal (D-56)", async () => {
    const user = userEvent.setup();
    const onDealsNew = vi.fn();
    render(<RelatedCardsContainer relatedLists={createContactsRelatedLists({ onDealsNew })} />);

    const dealsSection = screen.getByRole("region", { name: "Deals" });
    const newDealBtn = within(dealsSection).getByRole("button", { name: "New Deal" });
    await user.click(newDealBtn);
    expect(onDealsNew).toHaveBeenCalledTimes(1);
    expect(within(dealsSection).getByText("No records found")).toBeTruthy();
  });

  it("renders upper controls and verifies laterModule attributes", async () => {
    const user = userEvent.setup();
    render(<RelatedCardsContainer relatedLists={contactsRelatedLists} />);

    // D-54 Attach (M6)
    const attachmentsSection = screen.getByRole("region", { name: "Attachments" });
    const attachBtn = within(attachmentsSection).getByRole("button", { name: /^attach$/i });
    expect(attachBtn.getAttribute("data-later-module")).toBe("M6");
    expect(attachBtn.getAttribute("aria-disabled")).toBe("true");

    const attachMoreBtn = within(attachmentsSection).getByRole("button", { name: "More" });
    expect(attachMoreBtn.getAttribute("data-later-module")).toBe("M6");
    expect(attachMoreBtn.getAttribute("aria-disabled")).toBe("true");
    await user.click(attachMoreBtn);
    expect(screen.queryByRole("menu")).toBeNull();
    attachMoreBtn.focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("menu")).toBeNull();
    await user.keyboard(" ");
    expect(screen.queryByRole("menu")).toBeNull();

    // D-55 Enroll (P3)
    const enrollBtn = screen.getByRole("button", { name: "Enroll" });
    expect(enrollBtn.getAttribute("data-later-module")).toBe("P3");

    // D-56 New Deal (M4): live since MEP-415, so it draws without the later-module lock
    const newDealBtn = screen.getByRole("button", { name: "New Deal" });
    expect(newDealBtn.getAttribute("data-later-module")).toBeNull();
    expect(newDealBtn.getAttribute("aria-disabled")).toBeNull();

    // D-57 to D-60 Open Activities controls (M5, M11)
    const openActivitiesSection = screen.getByRole("region", { name: "Open Activities" });
    const addNewBtn = within(openActivitiesSection).getByRole("button", { name: /^add new$/i });
    expect(addNewBtn.getAttribute("data-later-module")).toBe("M5");

    const addNewMoreBtn = within(openActivitiesSection).getByRole("button", { name: "More" });
    expect(addNewMoreBtn.getAttribute("data-later-module")).toBe("M5");
    expect(addNewMoreBtn.getAttribute("aria-disabled")).toBe("true");
    await user.click(addNewMoreBtn);
    expect(screen.queryByRole("menu")).toBeNull();
    addNewMoreBtn.focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("menu")).toBeNull();
    await user.keyboard(" ");
    expect(screen.queryByRole("menu")).toBeNull();

    expect(screen.queryByRole("menuitem")).toBeNull();
    expect(screen.queryByText("More")).toBeNull();

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

    // MEP-900: the Cases card is live (no later-module marker on Assign / New)
    const casesSection = screen.getByRole("region", { name: "Cases" });
    expect(casesSection.querySelector("[data-later-module]")).toBeNull();

    // D-79 to D-82 (MEP-1049): Emails card is live with disabled Compose Email and interactive tabs
    const composeEmailBtn = screen.getByRole("button", { name: "Compose Email" });
    expect(
      composeEmailBtn.hasAttribute("disabled") ||
        composeEmailBtn.getAttribute("aria-disabled") === "true",
    ).toBe(true);
    expect(screen.getByRole("tab", { name: "Mails" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Drafts" }).getAttribute("aria-selected")).toBe("false");
    expect(screen.getByRole("tab", { name: "Scheduled" }).getAttribute("aria-selected")).toBe(
      "false",
    );

    // D-87, D-88 Social links (M15) in two-panel layout
    const twitterLink = screen.getByRole("link", { name: "Associate Twitter" });
    expect(twitterLink.getAttribute("data-later-module")).toBe("M15");
    const facebookLink = screen.getByRole("link", { name: "Associate Facebook" });
    expect(facebookLink.getAttribute("data-later-module")).toBe("M15");
    const socialSection = screen.getByRole("region", { name: "Social" });
    expect(within(socialSection).getByText(/You cannot search a profile in Facebook/)).toBeTruthy();

    // Notes card (M6): the body needs a record; the card itself is rendered
    expect(screen.getByRole("region", { name: "Notes" })).toBeTruthy();

    // D-92 Voice of the Customer Enable feature (P3)
    const enableFeatureBtn = screen.getByRole("button", { name: "Enable feature" });
    expect(enableFeatureBtn.getAttribute("data-later-module")).toBe("P3");
  });

  it("renders Reporting Contacts upper controls with Hierarchy View after title and New on right", async () => {
    const user = userEvent.setup();
    const onHierarchyView = vi.fn();
    const onNew = vi.fn();

    const listsWithHandlers = createContactsRelatedLists({
      onHierarchyView,
      onNewReportingContact: onNew,
    });

    render(<RelatedCardsContainer relatedLists={listsWithHandlers} />);

    const reportingSection = screen.getByRole("region", { name: "Reporting Contacts" });
    const titleEl = within(reportingSection).getByRole("heading", { name: "Reporting Contacts" });
    const hierarchyBtn = within(reportingSection).getByRole("button", { name: "Hierarchy View" });
    const newButton = within(reportingSection).getByRole("button", { name: "New" });

    // D-90 is after title: in the same container as the heading
    expect(titleEl.parentElement?.contains(hierarchyBtn)).toBe(true);
    // D-91 is in the right group: NOT in the heading container
    expect(titleEl.parentElement?.contains(newButton)).toBe(false);

    // Both are active M2 controls: no data-later-module attribute
    expect(hierarchyBtn.hasAttribute("data-later-module")).toBe(false);
    expect(hierarchyBtn.getAttribute("aria-disabled")).toBeNull();

    await user.click(hierarchyBtn);
    expect(onHierarchyView).toHaveBeenCalledTimes(1);

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
  it("renders 19 rail entries, badges, selection-dependent plus actions, and handles rail navigation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onAddReporting = vi.fn();

    const entries = contactsRelatedLists.map((item) => ({
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

      const laterModule = resolveLaterModule(item.moduleKey);
      if (laterModule === undefined) {
        expect(link.hasAttribute("data-later-module")).toBe(false);
        expect(link.getAttribute("href")).toBe(`#${item.targetId}`);
      } else {
        expect(link.getAttribute("data-later-module")).toBe(laterModule);
      }
    }

    // Notes is initially selected, so Notes has plus button (D-53, M6)
    const notesLink = within(rail).getByRole("link", { name: "Notes" });
    const notesRow = notesLink.closest("div[class*='flex items-center']");
    const notesAddBtn = notesRow?.querySelector("button");
    expect(notesAddBtn).not.toBeNull();
    expect(notesAddBtn?.getAttribute("data-later-module")).toBeNull();

    // Reporting Contacts is NOT initially selected, so its plus button is not rendered
    const reportingLink = within(rail).getByRole("link", { name: "Reporting Contacts" });
    const reportingRow = reportingLink.closest("div[class*='flex items-center']");
    expect(reportingRow?.querySelector("button")).toBeNull();

    // Select Reporting Contacts by clicking its link
    await user.click(reportingLink);
    expect(onSelect).toHaveBeenCalledWith("reporting-contacts");

    // Now Reporting Contacts is selected, so its plus button (D-89, M2) appears and fires onAction
    const reportingAddBtn = reportingRow?.querySelector("button");
    expect(reportingAddBtn).not.toBeNull();
    expect(reportingAddBtn?.hasAttribute("data-later-module")).toBe(false);
    if (reportingAddBtn) {
      await user.click(reportingAddBtn);
      expect(onAddReporting).toHaveBeenCalledTimes(1);
    }

    // Notes is now no longer selected, so its plus button is gone
    expect(notesRow?.querySelector("button")).toBeNull();

    // D-14 (MEP-415): the Deals rail link is live, so selecting it triggers the callback
    onSelect.mockClear();
    const dealsLink = within(rail).getByRole("link", { name: "Deals" });
    expect(dealsLink.hasAttribute("data-later-module")).toBe(false);
    await user.click(dealsLink);
    expect(onSelect).toHaveBeenCalledWith("deals");
  });

  it("tracks the visible card when scrolling and displays the corresponding plus action", () => {
    const onSelect = vi.fn();
    const onAddReporting = vi.fn();

    const entries = contactsRelatedLists.map((item) => ({
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
            onAction: item.id === "reporting-contacts" ? onAddReporting : undefined,
          }
        : undefined,
    }));

    const { container } = render(
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
                  <div key={c.id} id={c.targetId} style={{ height: "200px" }}>
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
    const scroller = container.querySelector<HTMLElement>("[data-record-scroller]");
    expect(scroller).not.toBeNull();
    if (!scroller) throw new Error("Expected scroller");
    const activeScroller: HTMLElement = scroller;

    function scrollToCard(targetId: string) {
      vi.spyOn(activeScroller, "getBoundingClientRect").mockReturnValue({
        top: 0,
        bottom: 800,
        left: 0,
        right: 1000,
        width: 1000,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      const targetIndex = contactsRelatedLists.findIndex((i) => i.targetId === targetId);
      contactsRelatedLists.forEach((item, index) => {
        const el = container.querySelector<HTMLElement>(`#${item.targetId}`);
        if (!el) return;
        const diff = index - targetIndex;
        const top = diff === 0 ? 10 : diff < 0 ? -500 * Math.abs(diff) : 500 * diff;
        vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
          top,
          bottom: top + 200,
          left: 0,
          right: 1000,
          width: 1000,
          height: 200,
          x: 0,
          y: top,
          toJSON: () => {},
        });
      });

      fireEvent.scroll(activeScroller);
    }

    // 1. Scroll to Cases -> D-72 appears (live since MEP-900)
    scrollToCard("related-list-cases");
    expect(onSelect).toHaveBeenCalledWith("cases");
    const casesRow = within(rail)
      .getByRole("link", { name: "Cases" })
      .closest("div[class*='flex items-center']");
    const casesAddBtn = casesRow?.querySelector("button");
    expect(casesAddBtn).not.toBeNull();
    expect(casesAddBtn?.getAttribute("data-later-module")).toBeNull();

    // Notes row now has no button
    const notesRow = within(rail)
      .getByRole("link", { name: "Notes" })
      .closest("div[class*='flex items-center']");
    expect(notesRow?.querySelector("button")).toBeNull();

    // 2. Scroll to Invoices -> D-83 appears with laterModule P2
    scrollToCard("related-list-invoices");
    expect(onSelect).toHaveBeenCalledWith("invoices");
    const invoicesRow = within(rail)
      .getByRole("link", { name: "Invoices" })
      .closest("div[class*='flex items-center']");
    const invoicesAddBtn = invoicesRow?.querySelector("button");
    expect(invoicesAddBtn).not.toBeNull();
    expect(invoicesAddBtn?.getAttribute("data-later-module")).toBe("P2");
    expect(casesRow?.querySelector("button")).toBeNull();

    // 3. Scroll to Closed Activities -> Closed Activities is selected, no plus button
    scrollToCard("related-list-closed-activities");
    expect(onSelect).toHaveBeenCalledWith("closed-activities");
    // D-31: the card holds no records, so the rail draws a bare link row without a badge.
    const closedLink = within(rail).getByRole("link", { name: "Closed Activities" });
    const closedRow = closedLink.closest("div[class*='flex items-center']") ?? closedLink;
    expect(closedRow.querySelector("button")).toBeNull();
    expect(closedRow.querySelector("span[class*='rounded-full']")).toBeNull();
    expect(invoicesRow?.querySelector("button")).toBeNull();

    // 4. Scroll to Notes -> D-53 appears with laterModule M6
    scrollToCard("related-list-notes");
    expect(onSelect).toHaveBeenCalledWith("notes");
    const notesAddBtn = notesRow?.querySelector("button");
    expect(notesAddBtn).not.toBeNull();
    expect(notesAddBtn?.getAttribute("data-later-module")).toBeNull();
  });
});
