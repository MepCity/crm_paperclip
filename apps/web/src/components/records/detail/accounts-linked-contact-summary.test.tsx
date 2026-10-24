import type { RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { AccountsLinkedContactSummary } from "./accounts-linked-contact-summary";

const hookState = vi.hoisted(() => ({
  list: { data: { records: [] as RecordData[] }, isLoading: false, isError: false },
  views: {
    data: [{ id: "contacts-default", isDefault: true }] as
      | { id: string; isDefault: boolean }[]
      | undefined,
    isLoading: false,
    isError: false,
  },
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useViews: () => hookState.views,
  useRecordList: () => hookState.list,
}));

afterEach(() => {
  cleanup();
  hookState.list = { data: { records: [] }, isLoading: false, isError: false };
  hookState.views = {
    data: [{ id: "contacts-default", isDefault: true }],
    isLoading: false,
    isError: false,
  };
});

const accountRecord: RecordData = { id: "account-123", fields: { Account_Name: "Acme Corp" } };

describe("AccountsLinkedContactSummary", () => {
  it("renders nothing when views or list query is loading", () => {
    hookState.views = { data: undefined, isLoading: true, isError: false };
    const { container } = render(
      <AccountsLinkedContactSummary
        accountRecord={accountRecord}
        contactRecordPath={(id) => `/contacts/${id}`}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when no linked contact is returned (empty state)", () => {
    hookState.list = { data: { records: [] }, isLoading: false, isError: false };
    const { container } = render(
      <AccountsLinkedContactSummary
        accountRecord={accountRecord}
        contactRecordPath={(id) => `/contacts/${id}`}
      />,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("region", { name: "Contacts summary" })).toBeNull();
  });

  it("renders linked contact name and email link with given props", () => {
    hookState.list = {
      data: {
        records: [
          {
            id: "contact-456",
            fields: {
              Full_Name: "Jane Doe",
              Email: "jane@example.com",
            },
          },
        ],
      },
      isLoading: false,
      isError: false,
    };

    render(
      <AccountsLinkedContactSummary
        accountRecord={accountRecord}
        contactRecordPath={(id) => `/org/Contacts/${id}`}
      />,
    );

    const section = screen.getByRole("region", { name: "Contacts summary" });
    expect(section).toBeTruthy();
    expect(section.hasAttribute("data-accounts-contacts-summary")).toBe(true);

    const nameLink = screen.getByRole("link", { name: "Jane Doe" });
    expect(nameLink.getAttribute("href")).toBe("/org/Contacts/contact-456");

    const emailLink = screen.getByRole("link", { name: "jane@example.com" });
    expect(emailLink.textContent).toBe("jane@example.com");
    expect(emailLink.getAttribute("data-later-module")).toBe("M10");
    expect(emailLink.getAttribute("aria-disabled")).toBe("true");
  });

  it("falls back to contact id when Full_Name is missing, and omits email when missing", () => {
    hookState.list = {
      data: {
        records: [
          {
            id: "contact-789",
            fields: {},
          },
        ],
      },
      isLoading: false,
      isError: false,
    };

    render(
      <AccountsLinkedContactSummary
        accountRecord={accountRecord}
        contactRecordPath={(id) => `/org/Contacts/${id}`}
      />,
    );

    const nameLink = screen.getByRole("link", { name: "contact-789" });
    expect(nameLink.getAttribute("href")).toBe("/org/Contacts/contact-789");
    expect(screen.queryByRole("link", { name: /@/ })).toBeNull();
  });
});
