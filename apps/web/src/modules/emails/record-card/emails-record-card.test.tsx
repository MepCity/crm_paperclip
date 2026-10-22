import { cleanup, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { isValidElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { accountsRelatedLists } from "@/modules/accounts/accounts-related-lists";
import { contactsRelatedLists } from "@/modules/contacts/contacts-related-lists";
import { dealsRelatedLists } from "@/modules/deals/deals-related-lists";
import { createLeadsRelatedLists } from "@/modules/leads/leads-related-lists";
import { render } from "@/test/render";
import { emailsCard } from "./emails-card";
import { EmailsRecordCard } from "./emails-record-card";
import {
  COMPOSE_EMAIL_TOOLTIP,
  EMAIL_CARD_TABS,
  EMPTY_STATE_TEXT,
  emptyEmailRecordCardFixture,
} from "./fixtures";

afterEach(cleanup);

describe("EmailsRecordCard component", () => {
  it("renders card header with title 'Emails' and disabled Compose Email button with tooltip", () => {
    const { unmount } = render(
      <EmailsRecordCard parentModule="Contacts" targetId="related-list-emails" />,
    );

    const section = screen.getByRole("region", { name: "Emails" });
    expect(section).toBeTruthy();
    expect(section.getAttribute("id")).toBe("related-list-emails");
    expect(section.getAttribute("data-related-card")).toBe("emails");

    const header = within(section).getByRole("heading", { name: "Emails" });
    expect(header).toBeTruthy();

    const composeBtn = within(section).getByRole("button", { name: "Compose Email" });
    expect(composeBtn).toBeTruthy();
    expect(
      composeBtn.hasAttribute("disabled") || composeBtn.getAttribute("aria-disabled") === "true",
    ).toBe(true);

    unmount();

    // With tooltip open
    render(
      <EmailsRecordCard
        parentModule="Contacts"
        targetId="related-list-emails"
        tooltipOpen={true}
      />,
    );
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toBe(COMPOSE_EMAIL_TOOLTIP);
  });

  it("renders tabs Mails, Drafts, Scheduled with Mails selected first and empty state", () => {
    render(<EmailsRecordCard parentModule="Contacts" />);

    const tablist = screen.getByRole("tablist", { name: "Email folders" });
    expect(tablist).toBeTruthy();

    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent?.trim())).toEqual(["Mails", "Drafts", "Scheduled"]);

    const mailsTab = within(tablist).getByRole("tab", { name: "Mails" });
    const draftsTab = within(tablist).getByRole("tab", { name: "Drafts" });
    const scheduledTab = within(tablist).getByRole("tab", { name: "Scheduled" });

    expect(mailsTab.getAttribute("aria-selected")).toBe("true");
    expect(draftsTab.getAttribute("aria-selected")).toBe("false");
    expect(scheduledTab.getAttribute("aria-selected")).toBe("false");

    const empty = screen.getByText(EMPTY_STATE_TEXT);
    expect(empty).toBeTruthy();
    expect(empty.getAttribute("data-part")).toBe("empty");
  });

  it("switches tabs on click with local state and shows empty state in each tab", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<EmailsRecordCard parentModule="Contacts" onTabChange={onTabChange} />);

    const tablist = screen.getByRole("tablist", { name: "Email folders" });
    const mailsTab = within(tablist).getByRole("tab", { name: "Mails" });
    const draftsTab = within(tablist).getByRole("tab", { name: "Drafts" });
    const scheduledTab = within(tablist).getByRole("tab", { name: "Scheduled" });

    // Initial state: Mails
    expect(mailsTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText(EMPTY_STATE_TEXT)).toBeTruthy();

    // Click Drafts
    await user.click(draftsTab);
    expect(draftsTab.getAttribute("aria-selected")).toBe("true");
    expect(mailsTab.getAttribute("aria-selected")).toBe("false");
    expect(scheduledTab.getAttribute("aria-selected")).toBe("false");
    expect(screen.getByText(EMPTY_STATE_TEXT)).toBeTruthy();
    expect(onTabChange).toHaveBeenCalledWith("drafts");

    // Click Scheduled
    await user.click(scheduledTab);
    expect(scheduledTab.getAttribute("aria-selected")).toBe("true");
    expect(draftsTab.getAttribute("aria-selected")).toBe("false");
    expect(mailsTab.getAttribute("aria-selected")).toBe("false");
    expect(screen.getByText(EMPTY_STATE_TEXT)).toBeTruthy();
    expect(onTabChange).toHaveBeenCalledWith("scheduled");

    // Click back to Mails
    await user.click(mailsTab);
    expect(mailsTab.getAttribute("aria-selected")).toBe("true");
    expect(scheduledTab.getAttribute("aria-selected")).toBe("false");
    expect(screen.getByText(EMPTY_STATE_TEXT)).toBeTruthy();
    expect(onTabChange).toHaveBeenCalledWith("mails");
  });

  it("renders subtabRowEndControl when provided", () => {
    render(
      <EmailsRecordCard
        parentModule="Accounts"
        subtabRowEndControl={{
          id: "sent-mail-source",
          label: "Sent",
          type: "select",
          moduleKey: "M10",
        }}
      />,
    );

    const sentBtn = screen.getByRole("button", { name: "Sent" });
    expect(sentBtn).toBeTruthy();
    expect(sentBtn.getAttribute("data-later-module")).toBe("M10");
  });
});

describe("emailsCard factory", () => {
  it("returns a renderCard function that produces an EmailsRecordCard element", () => {
    const supportedModules = ["Leads", "Contacts", "Accounts", "Deals"] as const;

    for (const mod of supportedModules) {
      const renderCard = emailsCard(mod);
      expect(typeof renderCard).toBe("function");

      const element = renderCard({
        record: { id: "rec-test", fields: {} },
        orgSlug: "org-1",
        recordPath: () => "#",
        definition: {
          id: "emails",
          title: "Emails",
          moduleKey: "M10",
          order: 4,
          targetId: "related-list-emails",
        },
      });

      expect(isValidElement(element)).toBe(true);
      if (isValidElement(element)) {
        expect(element.type).toBe(EmailsRecordCard);
        expect((element.props as Record<string, unknown>).parentModule).toBe(mod);
        expect((element.props as Record<string, unknown>).recordId).toBe("rec-test");
        expect((element.props as Record<string, unknown>).targetId).toBe("related-list-emails");
      }
    }
  });

  it("fixture matches expected defaults", () => {
    expect(emptyEmailRecordCardFixture.activeTab).toBe("mails");
    expect(emptyEmailRecordCardFixture.tabs).toEqual(EMAIL_CARD_TABS);
    expect(emptyEmailRecordCardFixture.emptyStateText).toBe("No records found");
    expect(emptyEmailRecordCardFixture.composeTooltip).toBe(
      "Available when a mailbox is connected",
    );
    expect(emptyEmailRecordCardFixture.composeDisabled).toBe(true);
  });

  it("every supported module mounts the emails card with renderCard", () => {
    const listMap = {
      Leads: createLeadsRelatedLists(),
      Contacts: contactsRelatedLists,
      Accounts: accountsRelatedLists,
      Deals: dealsRelatedLists,
    };
    for (const [mod, lists] of Object.entries(listMap)) {
      const emails = lists.find((c) => c.id === "emails");
      expect(emails, `${mod} emails card`).toBeDefined();
      expect(emails?.renderCard, `${mod} renderCard`).toBeDefined();
      expect(emails?.moduleKey).toBe("M10");
      expect(emails?.targetId).toBe("related-list-emails");
    }
  });
});
