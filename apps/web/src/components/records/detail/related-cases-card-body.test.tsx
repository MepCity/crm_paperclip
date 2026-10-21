import type { FieldDefinition, RecordData } from "@crm/core/records";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { RelatedCasesCardBody } from "./related-cases-card-body";

const caseFields: FieldDefinition[] = [
  {
    apiName: "Subject",
    label: "Subject",
    dataType: "text",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Case_Number",
    label: "Case Number",
    dataType: "text",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Status",
    label: "Status",
    dataType: "picklist",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Priority",
    label: "Priority",
    dataType: "picklist",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Owner",
    label: "Case Owner",
    dataType: "ownerlookup",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Description",
    label: "Description",
    dataType: "text",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
];

const hookState = vi.hoisted(() => ({
  list: {
    data: { records: [] as RecordData[] } as { records: RecordData[]; moreRecords?: boolean },
    isLoading: false,
    isError: false,
  },
  module: { data: { fields: [] as FieldDefinition[] }, isLoading: false, isError: false },
  views: {
    data: [{ id: "all-cases", name: "All Cases", isDefault: true }],
    isLoading: false,
    isError: false,
  },
  view: { data: { id: "all-cases", columns: [] as string[] }, isLoading: false, isError: false },
  users: { data: [] as { userId: string; name: string }[], isLoading: false, isError: false },
  listFor: undefined as
    | undefined
    | ((page: number) => {
        data: { records: RecordData[]; moreRecords?: boolean };
        isLoading: boolean;
        isError: boolean;
      }),
  calls: [] as { module: string; query: { viewId: string; filters?: unknown; page?: number } }[],
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => hookState.module,
  useViews: () => hookState.views,
  useView: () => hookState.view,
  useUsers: () => hookState.users,
  useRecordList: (module: string, query: { viewId: string; filters?: unknown; page?: number }) => {
    hookState.calls.push({ module, query });
    return hookState.listFor ? hookState.listFor(query.page ?? 1) : hookState.list;
  },
}));

afterEach(() => {
  cleanup();
  hookState.list = { data: { records: [] }, isLoading: false, isError: false };
  hookState.module = { data: { fields: [] }, isLoading: false, isError: false };
  hookState.views = {
    data: [{ id: "all-cases", name: "All Cases", isDefault: true }],
    isLoading: false,
    isError: false,
  };
  hookState.view = { data: { id: "all-cases", columns: [] }, isLoading: false, isError: false };
  hookState.users = { data: [], isLoading: false, isError: false };
  hookState.calls = [];
  hookState.listFor = undefined;
});

const accountRecord: RecordData = { id: "acc-1", fields: { Account_Name: "Acme" } };

function renderCard(filterField: string) {
  return render(
    <RelatedCasesCardBody
      managerRecord={accountRecord}
      filterField={filterField}
      caseRecordPath={(id) => `/acme/Cases/${id}`}
    />,
  );
}

describe("RelatedCasesCardBody", () => {
  it.each(["Account_Name", "Related_To", "Deal_Name"])(
    "filters Cases on the %s lookup",
    (filterField) => {
      renderCard(filterField);
      expect(hookState.calls[0]?.module).toBe("Cases");
      expect(hookState.calls[0]?.query).toMatchObject({
        viewId: "all-cases",
        filters: { field: filterField, comparator: "equal", value: "acc-1" },
      });
    },
  );

  it("shows the empty state", () => {
    renderCard("Account_Name");
    expect(screen.getByText("No records found")).toBeTruthy();
  });

  it("draws the provisional columns with a Subject detail link", () => {
    hookState.module = { data: { fields: caseFields }, isLoading: false, isError: false };
    hookState.list = {
      data: {
        records: [
          { id: "case-1", fields: { Subject: "Broken login", Case_Number: "101", Status: "New" } },
        ],
      },
      isLoading: false,
      isError: false,
    };
    renderCard("Account_Name");
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Subject",
      "Case Number",
      "Status",
      "Priority",
      "Case Owner",
    ]);
    expect(screen.getByRole("link", { name: "Broken login" }).getAttribute("href")).toBe(
      "/acme/Cases/case-1",
    );
  });

  it("shows a Next control when more than one page of cases exists", () => {
    hookState.module = { data: { fields: caseFields }, isLoading: false, isError: false };
    hookState.list = {
      data: {
        records: Array.from({ length: 100 }, (_, i) => ({
          id: `case-${i}`,
          fields: { Subject: `Case ${i}` },
        })),
        moreRecords: true,
      },
      isLoading: false,
      isError: false,
    };
    renderCard("Account_Name");
    const next = screen.getByRole("button", { name: "Next" }) as HTMLButtonElement;
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    expect(hookState.calls.at(-1)?.query).toMatchObject({ page: 2 });
  });
  it("reaches the 101st case on page 2 and can go back", () => {
    hookState.module = { data: { fields: caseFields }, isLoading: false, isError: false };
    hookState.listFor = (page) => ({
      data:
        page === 1
          ? {
              records: Array.from({ length: 100 }, (_, i) => ({
                id: `case-${i}`,
                fields: { Subject: `Case ${i}` },
              })),
              moreRecords: true,
            }
          : { records: [{ id: "case-100", fields: { Subject: "Case 101" } }], moreRecords: false },
      isLoading: false,
      isError: false,
    });
    renderCard("Account_Name");
    expect(screen.queryByRole("link", { name: "Case 101" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("link", { name: "Case 101" }).getAttribute("href")).toBe(
      "/acme/Cases/case-100",
    );
    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("link", { name: "Case 0" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Case 101" })).toBeNull();
  });
});
