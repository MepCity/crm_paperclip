import type { FieldDefinition, RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { AccountMemberAccountsCardBody } from "./account-member-accounts-card-body";

const sampleFields: FieldDefinition[] = [
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
];

const hookState = vi.hoisted(() => ({
  list: { data: { records: [] as RecordData[] }, isLoading: false, isError: false },
  module: { data: { fields: [] as FieldDefinition[] }, isLoading: false, isError: false },
  views: { data: [{ id: "all-accounts", isDefault: true }], isLoading: false, isError: false },
  users: {
    data: [
      { userId: "usr_member_owner_1", name: "Alice AccountOwner", email: "alice@example.com" },
    ],
    isLoading: false,
    isError: false,
  },
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => hookState.module,
  useViews: () => hookState.views,
  useRecordList: () => hookState.list,
  useUsers: () => hookState.users,
}));

afterEach(() => {
  cleanup();
  hookState.list = { data: { records: [] }, isLoading: false, isError: false };
  hookState.module = { data: { fields: [] }, isLoading: false, isError: false };
  hookState.views = {
    data: [{ id: "all-accounts", isDefault: true }],
    isLoading: false,
    isError: false,
  };
  hookState.users = {
    data: [
      { userId: "usr_member_owner_1", name: "Alice AccountOwner", email: "alice@example.com" },
    ],
    isLoading: false,
    isError: false,
  };
});

const parentRecord: RecordData = { id: "parent-1", fields: { Account_Name: "Parent" } };

describe("AccountMemberAccountsCardBody", () => {
  it("shows error state when the list request fails", () => {
    hookState.list = { data: { records: [] }, isLoading: false, isError: true };

    render(
      <AccountMemberAccountsCardBody
        parentRecord={parentRecord}
        orgSlug="acme"
        accountRecordPath={(id) => `/acme/Accounts/${id}`}
      />,
    );

    expect(screen.getByText("Unable to load records.")).toBeTruthy();
    expect(screen.queryByText("No records found")).toBeNull();
    expect(document.querySelector('[data-part="error"]')).toBeTruthy();
  });

  it("shows empty state when the list succeeds with no rows", () => {
    render(
      <AccountMemberAccountsCardBody
        parentRecord={parentRecord}
        orgSlug="acme"
        accountRecordPath={(id) => `/acme/Accounts/${id}`}
      />,
    );

    expect(screen.getByText("No records found")).toBeTruthy();
    expect(screen.queryByText("Unable to load records.")).toBeNull();
  });

  it("renders owner user name instead of raw user ID in Account Owner column", () => {
    hookState.module = { data: { fields: sampleFields }, isLoading: false, isError: false };
    hookState.list = {
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
      isError: false,
    };

    render(
      <AccountMemberAccountsCardBody
        parentRecord={parentRecord}
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
