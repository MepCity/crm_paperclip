import type { ListQuery, RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { ReportingContactsCardBody } from "./reporting-contacts-card-body";

const { listCalls } = vi.hoisted(() => ({
  listCalls: [] as Array<{ query: ListQuery; enabled: boolean }>,
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => ({
    data: {
      fields: [
        {
          apiName: "Full_Name",
          label: "Full Name",
          dataType: "text",
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
    data: [{ id: "contacts-default-view", isDefault: true }],
    isLoading: false,
  }),
  useRecordList: (_module: string, query: ListQuery, options?: { enabled?: boolean }) => {
    const enabled = options?.enabled ?? Boolean(query.viewId);
    listCalls.push({ query, enabled });
    return {
      data: { records: [] },
      isLoading: false,
    };
  },
}));

afterEach(() => {
  cleanup();
  listCalls.length = 0;
});

function managerRecord(id: string, fullName?: string): RecordData {
  return {
    id,
    fields: fullName === undefined ? {} : { Full_Name: fullName },
  };
}

describe("ReportingContactsCardBody", () => {
  it("filters direct reports by manager record id, not Full_Name", () => {
    render(
      <ReportingContactsCardBody
        managerRecord={managerRecord("manager-a", "Same Name")}
        orgSlug="acme"
        recordPath={(recordId) => `/acme/Contacts/${recordId}`}
      />,
    );
    render(
      <ReportingContactsCardBody
        managerRecord={managerRecord("manager-b", "Same Name")}
        orgSlug="acme"
        recordPath={(recordId) => `/acme/Contacts/${recordId}`}
      />,
    );

    const enabledCalls = listCalls.filter((call) => call.enabled);
    expect(enabledCalls).toHaveLength(2);
    expect(enabledCalls[0]?.query.filters).toEqual({
      field: "Reporting_To",
      comparator: "equal",
      value: "manager-a",
    });
    expect(enabledCalls[1]?.query.filters).toEqual({
      field: "Reporting_To",
      comparator: "equal",
      value: "manager-b",
    });
  });

  it("still applies Reporting_To filter when manager Full_Name is empty", () => {
    render(
      <ReportingContactsCardBody
        managerRecord={managerRecord("manager-no-name", "")}
        orgSlug="acme"
        recordPath={(recordId) => `/acme/Contacts/${recordId}`}
      />,
    );

    const enabledCalls = listCalls.filter((call) => call.enabled);
    expect(enabledCalls).toHaveLength(1);
    expect(enabledCalls[0]?.query.filters).toEqual({
      field: "Reporting_To",
      comparator: "equal",
      value: "manager-no-name",
    });
    expect(screen.getByText("No records found")).toBeTruthy();
  });

  it("does not enable list fetch when manager id is missing", () => {
    render(
      <ReportingContactsCardBody
        managerRecord={{ id: "", fields: { Full_Name: "Named" } }}
        orgSlug="acme"
        recordPath={(recordId) => `/acme/Contacts/${recordId}`}
      />,
    );

    expect(listCalls.some((call) => call.enabled)).toBe(false);
  });
});
