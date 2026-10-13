import type { ListQuery } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { AccountMemberAccountsCardBody } from "./account-member-accounts-card-body";

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => ({
    data: {
      fields: [
        {
          apiName: "Account_Name",
          label: "Account Name",
          dataType: "text",
          required: true,
          readOnly: false,
          massUpdate: true,
          unique: false,
          views: { view: true, create: true, edit: true, quickCreate: true },
        },
        {
          apiName: "Phone",
          label: "Phone",
          dataType: "phone",
          required: false,
          readOnly: false,
          massUpdate: true,
          unique: false,
          views: { view: true, create: true, edit: true, quickCreate: true },
        },
        {
          apiName: "Website",
          label: "Website",
          dataType: "website",
          required: false,
          readOnly: false,
          massUpdate: true,
          unique: false,
          views: { view: true, create: true, edit: true, quickCreate: true },
        },
        {
          apiName: "Owner",
          label: "Account Owner",
          dataType: "ownerlookup",
          required: false,
          readOnly: false,
          massUpdate: false,
          unique: false,
          views: { view: true, create: true, edit: true, quickCreate: false },
        },
      ],
    },
    isLoading: false,
  }),
  useViews: () => ({
    data: [{ id: "all-accounts", isDefault: true }],
    isLoading: false,
  }),
  useUsers: () => ({
    data: [
      { userId: "usr_member_owner_1", name: "Alice AccountOwner", email: "alice@example.com" },
    ],
    isLoading: false,
  }),
  useRecordList: (_module: string, _query: ListQuery) => ({
    data: {
      records: [
        {
          id: "acc_child_1",
          fields: {
            Account_Name: "Child Account Inc",
            Phone: "555-0100",
            Website: "https://child.example.com",
            Owner: "usr_member_owner_1",
          },
        },
      ],
    },
    isLoading: false,
  }),
}));

afterEach(() => {
  cleanup();
});

describe("AccountMemberAccountsCardBody", () => {
  it("renders owner user name instead of raw user ID in Account Owner column", () => {
    render(
      <AccountMemberAccountsCardBody
        parentRecord={{ id: "parent_1", fields: { Account_Name: "Parent Account" } }}
        orgSlug="acme"
        accountRecordPath={(recordId) => `/acme/Accounts/${recordId}`}
      />,
    );

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Child Account Inc" })).toBeTruthy();
    expect(screen.getByText("Alice AccountOwner")).toBeTruthy();
    expect(screen.queryByText("usr_member_owner_1")).toBeNull();
  });
});
