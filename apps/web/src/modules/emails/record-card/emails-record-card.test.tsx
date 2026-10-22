import { act, cleanup, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { isValidElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { accountsRelatedLists } from "@/modules/accounts/accounts-related-lists";
import { contactsRelatedLists } from "@/modules/contacts/contacts-related-lists";
import { dealsRelatedLists } from "@/modules/deals/deals-related-lists";
import { createLeadsRelatedLists } from "@/modules/leads/leads-related-lists";
import { render } from "@/test/render";
import type { EmailConversation } from "../inbox/view-model";
import { emailsCard } from "./emails-card";
import { EmailsRecordCard } from "./emails-record-card";
import {
  COMPOSE_EMAIL_TOOLTIP,
  EMAIL_CARD_TABS,
  EMPTY_STATE_TEXT,
  emptyEmailRecordCardFixture,
  loadEmailRecordCardFixture,
} from "./fixtures";
import type { EmailRecordCardLoader } from "./types";

function deferred<T>() {
  let resolve!: (val: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const sampleConversations: EmailConversation[] = [
  {
    id: "conv-1",
    folder: "inbox",
    subject: "Contract discussion",
    snippet: "Let's review the updated contract terms.",
    unread: true,
    messages: [
      {
        id: "msg-1",
        from: { name: "Alice Smith", address: "alice@example.com" },
        to: [{ name: "Alex Morgan", address: "alex@example.com" }],
        cc: [],
        date: "2026-10-21T10:00:00Z",
        body: "Let's review the updated contract terms.",
        attachments: [],
      },
    ],
  },
  {
    id: "conv-2",
    folder: "inbox",
    subject: "Product roadmap update",
    snippet: "Here is the timeline for Q4 delivery.",
    unread: false,
    messages: [
      {
        id: "msg-2",
        from: { name: "Bob Jones", address: "bob@example.com" },
        to: [{ name: "Alex Morgan", address: "alex@example.com" }],
        cc: [],
        date: "2026-10-20T14:30:00Z",
        body: "Here is the timeline for Q4 delivery.",
        attachments: [],
      },
    ],
  },
];

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

  it("shows loading state while loader is unresolved", async () => {
    const pending = deferred<EmailConversation[]>();
    const loader = vi.fn<EmailRecordCardLoader>(() => pending.promise);
    render(<EmailsRecordCard parentModule="Contacts" recordId="rec-1" loader={loader} />);

    expect(loader).toHaveBeenCalledWith("Contacts", "rec-1");
    const statusEl = screen.getByRole("status");
    expect(statusEl.textContent).toBe("Loading emails...");
    expect(screen.queryByText(EMPTY_STATE_TEXT)).toBeNull();

    await act(async () => pending.resolve([]));
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText(EMPTY_STATE_TEXT)).toBeTruthy();
  });

  it("shows error state with inbox error text pattern when loader rejects", async () => {
    const loader = vi.fn<EmailRecordCardLoader>().mockRejectedValue(new Error("network failure"));
    render(<EmailsRecordCard parentModule="Contacts" loader={loader} />);

    const alertEl = await screen.findByRole("alert");
    expect(alertEl.textContent).toBe("Unable to load emails");
    expect(screen.queryByText("network failure")).toBeNull();
    expect(screen.queryByText(EMPTY_STATE_TEXT)).toBeNull();
  });

  it("shows empty state when loader resolves with empty list", async () => {
    const loader = vi.fn<EmailRecordCardLoader>().mockResolvedValue([]);
    render(<EmailsRecordCard parentModule="Contacts" loader={loader} />);

    const empty = await screen.findByText(EMPTY_STATE_TEXT);
    expect(empty).toBeTruthy();
    expect(empty.getAttribute("data-part")).toBe("empty");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("default loader keeps the empty state without loading delay and loadEmailRecordCardFixture returns empty list", async () => {
    const result = await loadEmailRecordCardFixture("Contacts", "rec-1");
    expect(result).toEqual([]);

    render(<EmailsRecordCard parentModule="Contacts" />);
    const empty = screen.getByText(EMPTY_STATE_TEXT);
    expect(empty).toBeTruthy();
    expect(empty.getAttribute("data-part")).toBe("empty");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders conversation list with sender, subject, snippet, date and unread in bold", async () => {
    const loader = vi.fn<EmailRecordCardLoader>().mockResolvedValue(sampleConversations);
    render(<EmailsRecordCard parentModule="Contacts" loader={loader} />);

    const list = await screen.findByRole("list", { name: "Emails list" });
    expect(list).toBeTruthy();

    // Unread row
    const unreadRow = screen.getByRole("button", { name: /Contract discussion/ });
    expect(unreadRow.textContent).toContain("Alice Smith");
    expect(unreadRow.textContent).toContain("Contract discussion");
    expect(unreadRow.textContent).toContain("Let's review the updated contract terms.");
    expect(unreadRow.textContent).toContain("Unread");
    expect(unreadRow.className).toContain("font-semibold");

    // Read row
    const readRow = screen.getByRole("button", { name: /Product roadmap update/ });
    expect(readRow.textContent).toContain("Bob Jones");
    expect(readRow.textContent).toContain("Product roadmap update");
    expect(readRow.textContent).toContain("Here is the timeline for Q4 delivery.");
    expect(readRow.textContent).not.toContain("Unread");
    expect(readRow.className).toContain("font-normal");
  });

  it("clicking a row does nothing (no navigation)", async () => {
    const user = userEvent.setup();
    const loader = vi.fn<EmailRecordCardLoader>().mockResolvedValue(sampleConversations);
    render(<EmailsRecordCard parentModule="Contacts" loader={loader} />);

    const row = await screen.findByRole("button", { name: /Contract discussion/ });
    const originalHref = window.location.href;
    await user.click(row);
    expect(window.location.href).toBe(originalHref);
  });

  it("drafts and scheduled tabs show empty state even when emails are loaded in mails tab", async () => {
    const user = userEvent.setup();
    const loader = vi.fn<EmailRecordCardLoader>().mockResolvedValue(sampleConversations);
    render(<EmailsRecordCard parentModule="Contacts" loader={loader} />);

    await screen.findByRole("list", { name: "Emails list" });

    // Switch to Drafts
    const draftsTab = screen.getByRole("tab", { name: "Drafts" });
    await user.click(draftsTab);
    expect(screen.queryByRole("list", { name: "Emails list" })).toBeNull();
    expect(screen.getByText(EMPTY_STATE_TEXT)).toBeTruthy();

    // Switch to Scheduled
    const scheduledTab = screen.getByRole("tab", { name: "Scheduled" });
    await user.click(scheduledTab);
    expect(screen.queryByRole("list", { name: "Emails list" })).toBeNull();
    expect(screen.getByText(EMPTY_STATE_TEXT)).toBeTruthy();

    // Switch back to Mails
    const mailsTab = screen.getByRole("tab", { name: "Mails" });
    await user.click(mailsTab);
    expect(await screen.findByRole("list", { name: "Emails list" })).toBeTruthy();
  });

  it("supports load prop as an alias for loader", async () => {
    const load = vi.fn<EmailRecordCardLoader>().mockResolvedValue(sampleConversations);
    render(<EmailsRecordCard parentModule="Deals" recordId="deal-99" load={load} />);

    expect(load).toHaveBeenCalledWith("Deals", "deal-99");
    expect(await screen.findByRole("list", { name: "Emails list" })).toBeTruthy();
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

  it("passes custom loader when provided to emailsCard", () => {
    const customLoader: EmailRecordCardLoader = async () => [];
    const renderCard = emailsCard("Leads", customLoader);
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
      expect((element.props as Record<string, unknown>).loader).toBe(customLoader);
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
