import type { RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { AccountMemberAccountsCardBody } from "./account-member-accounts-card-body";

const hookState = vi.hoisted(() => ({
  list: { data: { records: [] as RecordData[] }, isLoading: false, isError: false },
  module: { data: { fields: [] }, isLoading: false, isError: false },
  views: { data: [{ id: "all-accounts", isDefault: true }], isLoading: false, isError: false },
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => hookState.module,
  useViews: () => hookState.views,
  useRecordList: () => hookState.list,
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
});
