import type { FieldDefinition, RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { RelatedDealsCardBody } from "./related-deals-card-body";

const sampleFields: FieldDefinition[] = [
  {
    apiName: "Deal_Name",
    label: "Deal Name",
    dataType: "text",
    required: true,
    readOnly: false,
    massUpdate: true,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Amount",
    label: "Amount",
    dataType: "currency",
    required: false,
    readOnly: false,
    massUpdate: true,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Stage",
    label: "Stage",
    dataType: "picklist",
    required: true,
    readOnly: false,
    massUpdate: true,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Closing_Date",
    label: "Closing Date",
    dataType: "date",
    required: false,
    readOnly: false,
    massUpdate: true,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Account_Name",
    label: "Account Name",
    dataType: "lookup",
    required: false,
    readOnly: false,
    massUpdate: true,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
    lookup: { module: "Accounts" },
  },
  {
    apiName: "Contact_Name",
    label: "Contact Name",
    dataType: "lookup",
    required: false,
    readOnly: false,
    massUpdate: true,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
    lookup: { module: "Contacts" },
  },
  {
    apiName: "Owner",
    label: "Deal Owner",
    dataType: "ownerlookup",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
  },
];

const dealsColumns = [
  "Deal_Name",
  "Amount",
  "Stage",
  "Closing_Date",
  "Account_Name",
  "Contact_Name",
  "Owner",
];

const hookState = vi.hoisted(() => ({
  list: { data: { records: [] as RecordData[] }, isLoading: false, isError: false },
  module: { data: { fields: [] as FieldDefinition[] }, isLoading: false, isError: false },
  views: {
    data: [{ id: "all-deals", name: "All Deals", isDefault: true }],
    isLoading: false,
    isError: false,
  },
  view: { data: { id: "all-deals", columns: [] as string[] }, isLoading: false, isError: false },
  users: { data: [] as { userId: string; name: string }[], isLoading: false, isError: false },
  calls: [] as { module: string; query: { viewId: string; filters?: unknown } }[],
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => hookState.module,
  useViews: () => hookState.views,
  useView: () => hookState.view,
  useUsers: () => hookState.users,
  useRecordList: (module: string, query: { viewId: string; filters?: unknown }) => {
    hookState.calls.push({ module, query });
    return hookState.list;
  },
}));

afterEach(() => {
  cleanup();
  hookState.list = { data: { records: [] }, isLoading: false, isError: false };
  hookState.module = { data: { fields: [] }, isLoading: false, isError: false };
  hookState.views = {
    data: [{ id: "all-deals", name: "All Deals", isDefault: true }],
    isLoading: false,
    isError: false,
  };
  hookState.view = { data: { id: "all-deals", columns: [] }, isLoading: false, isError: false };
  hookState.users = { data: [], isLoading: false, isError: false };
  hookState.calls = [];
});

const accountRecord: RecordData = { id: "acc-1", fields: { Account_Name: "Acme" } };

function renderCard(manager: RecordData, filterField: string) {
  return render(
    <RelatedDealsCardBody
      managerRecord={manager}
      filterField={filterField}
      dealRecordPath={(id) => `/acme/Deals/${id}`}
    />,
  );
}

describe("RelatedDealsCardBody", () => {
  it("filters the default Deals view on the card lookup field", () => {
    hookState.view = {
      data: { id: "all-deals", columns: dealsColumns },
      isLoading: false,
      isError: false,
    };

    renderCard(accountRecord, "Account_Name");

    expect(hookState.calls[0]?.module).toBe("Deals");
    expect(hookState.calls[0]?.query).toMatchObject({
      viewId: "all-deals",
      filters: { field: "Account_Name", comparator: "equal", value: "acc-1" },
    });
  });

  it("shows error state when the list request fails", () => {
    hookState.list = { data: { records: [] }, isLoading: false, isError: true };

    renderCard(accountRecord, "Account_Name");

    expect(screen.getByText("Unable to load records.")).toBeTruthy();
    expect(screen.queryByText("No records found")).toBeNull();
    expect(document.querySelector('[data-part="error"]')).toBeTruthy();
  });

  it("shows empty state when the list succeeds with no rows", () => {
    renderCard(accountRecord, "Account_Name");

    expect(screen.getByText("No records found")).toBeTruthy();
    expect(screen.queryByText("Unable to load records.")).toBeNull();
  });

  it("draws the default view columns with the Deal Name detail link", () => {
    hookState.module = { data: { fields: sampleFields }, isLoading: false, isError: false };
    hookState.view = {
      data: { id: "all-deals", columns: dealsColumns },
      isLoading: false,
      isError: false,
    };
    hookState.users = {
      data: [{ userId: "usr_deal_owner", name: "Alice DealOwner" }],
      isLoading: false,
      isError: false,
    };
    hookState.list = {
      data: {
        records: [
          {
            id: "deal-1",
            fields: {
              Deal_Name: "Deal 001",
              Amount: 5000,
              Stage: "Qualification",
              Closing_Date: "2026-01-10",
              Account_Name: { module: "Accounts", id: "acc-1", name: "Acme" },
              Contact_Name: null,
              Owner: "usr_deal_owner",
            },
          },
        ],
      },
      isLoading: false,
      isError: false,
    };

    renderCard(accountRecord, "Account_Name");

    const table = screen.getByRole("table");
    expect(table).toBeTruthy();
    for (const label of [
      "Deal Name",
      "Amount",
      "Stage",
      "Closing Date",
      "Account Name",
      "Contact Name",
      "Deal Owner",
    ]) {
      expect(screen.getByRole("columnheader", { name: label })).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: "Deal 001" }).getAttribute("href")).toBe(
      "/acme/Deals/deal-1",
    );
    expect(screen.getByText("Alice DealOwner")).toBeTruthy();
    expect(screen.queryByText("usr_deal_owner")).toBeNull();
  });

  it("links the related account reference on a row", () => {
    hookState.module = { data: { fields: sampleFields }, isLoading: false, isError: false };
    hookState.view = {
      data: { id: "all-deals", columns: dealsColumns },
      isLoading: false,
      isError: false,
    };
    hookState.list = {
      data: {
        records: [
          {
            id: "deal-1",
            fields: {
              Deal_Name: "Deal 001",
              Account_Name: { module: "Accounts", id: "acc-1", name: "Acme" },
            },
          },
        ],
      },
      isLoading: false,
      isError: false,
    };

    renderCard(accountRecord, "Contact_Name");

    expect(screen.getByRole("link", { name: "Acme" })).toBeTruthy();
  });
});
