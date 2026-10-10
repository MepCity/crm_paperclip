import type { ListQuery, RecordData } from "@crm/core/records";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRecord, useRecordList } from "./hooks";
import type { ClientRecordService } from "./http-record-service";
import { ApiProvider } from "./provider";

function createMockService(record: RecordData): ClientRecordService {
  return {
    getHomeCurrency: vi.fn().mockResolvedValue({ currencyCode: "USD", symbol: "$" }),
    listUsers: vi.fn().mockResolvedValue([]),
    listViewSummaries: vi.fn().mockResolvedValue([]),
    listViews: vi.fn().mockResolvedValue([]),
    getView: vi.fn().mockResolvedValue({ id: "all", name: "All", systemDefined: true }),
    getModule: vi.fn().mockResolvedValue({
      apiName: "Leads",
      singularLabel: "Lead",
      pluralLabel: "Leads",
      fields: [],
      layouts: [],
    }),
    get: vi.fn().mockResolvedValue(record),
    list: vi.fn().mockResolvedValue({
      records: [record],
      info: { count: 1, page: 1, perPage: 10, moreRecords: false },
    }),
    count: vi.fn().mockResolvedValue(1),
    create: vi.fn().mockResolvedValue(record),
    update: vi.fn().mockResolvedValue(record),
    delete: vi.fn().mockResolvedValue({ count: 1 }),
    massUpdate: vi.fn().mockResolvedValue({ count: 1 }),
    changeOwner: vi.fn().mockResolvedValue({ count: 1 }),
  } as unknown as ClientRecordService;
}

function Consumer({ id, query }: { id: string; query: ListQuery }) {
  const record = useRecord("Leads", id);
  const list = useRecordList("Leads", query);

  return (
    <div>
      <div data-testid="record-status">{record.isLoading ? "loading" : "loaded"}</div>
      <div data-testid="record-company">{String(record.data?.fields?.Company ?? "empty")}</div>
      <div data-testid="list-status">{list.isLoading ? "loading" : "loaded"}</div>
      <div data-testid="list-companies">
        {list.data?.records.map((r) => String(r.fields.Company)).join(",") ?? "empty"}
      </div>
    </div>
  );
}

describe("ApiProvider organization cache isolation", () => {
  it("isolates cache when orgSlug changes on the same provider instance", async () => {
    const recordA: RecordData = {
      id: "lead-1",
      fields: {
        Last_Name: "Alpha",
        Company: "Company Alpha",
      },
    };
    const recordB: RecordData = {
      id: "lead-1",
      fields: {
        Last_Name: "Beta",
        Company: "Company Beta",
      },
    };

    const serviceA = createMockService(recordA);
    const serviceB = createMockService(recordB);
    const query: ListQuery = { viewId: "all", page: 1, perPage: 10 };

    const { rerender } = render(
      <ApiProvider orgSlug="org-a" service={serviceA}>
        <Consumer id="lead-1" query={query} />
      </ApiProvider>,
    );

    // Initial load under org-a
    await waitFor(() => {
      expect(screen.getByTestId("record-company").textContent).toBe("Company Alpha");
      expect(screen.getByTestId("list-companies").textContent).toBe("Company Alpha");
    });
    expect(serviceA.get).toHaveBeenCalledTimes(1);
    expect(serviceA.list).toHaveBeenCalledTimes(1);

    // Switch orgSlug from org-a to org-b on the same ApiProvider instance
    rerender(
      <ApiProvider orgSlug="org-b" service={serviceB}>
        <Consumer id="lead-1" query={query} />
      </ApiProvider>,
    );

    // The cached record and list for Org A must NOT appear on Org B's screen for even a moment
    expect(screen.queryAllByText("Company Alpha")).toEqual([]);
    expect(screen.getByTestId("record-company").textContent).not.toBe("Company Alpha");
    expect(screen.getByTestId("list-companies").textContent).not.toBe("Company Alpha");

    // A fresh request must be sent for Org B
    await waitFor(() => {
      expect(screen.getByTestId("record-company").textContent).toBe("Company Beta");
      expect(screen.getByTestId("list-companies").textContent).toBe("Company Beta");
    });
    expect(serviceB.get).toHaveBeenCalledWith("Leads", "lead-1");
    expect(serviceB.list).toHaveBeenCalledWith("Leads", query);
  });
});
