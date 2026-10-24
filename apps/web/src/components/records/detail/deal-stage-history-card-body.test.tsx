import type { RecordData } from "@crm/core/records";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { DealStageHistoryCardBody } from "./deal-stage-history-card-body";

const rows: RecordData[] = [
  { id: "h1", fields: { Amount: 150000, Stage: "Qualification" } } as unknown as RecordData,
];

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => ({
    data: {
      fields: [
        { apiName: "Stage", label: "Stage", dataType: "text" },
        { apiName: "Amount", label: "Amount", dataType: "currency" },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useViews: () => ({ data: [], isLoading: false, isError: false, isSuccess: true }),
  useUsers: () => ({ data: [] }),
  useRecordList: () => ({ data: { records: rows }, isLoading: false, isError: false }),
}));

afterEach(cleanup);

test("body cells never wrap their values", () => {
  render(<DealStageHistoryCardBody dealId="deal-1" />);
  const cells = document.querySelectorAll("tbody td");
  expect(cells.length).toBe(2);
  for (const cell of cells) expect(cell.className).toContain("whitespace-nowrap");
});
