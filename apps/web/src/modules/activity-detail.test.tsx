import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ActivitySidePanel } from "./activity-detail";

const empty = { data: undefined, isLoading: false, isError: false };
vi.mock("@/lib/api/client/hooks", () => ({
  useRecord: () => ({ data: { id: "c1", fields: { Full_Name: "Ada" } } }),
  useModule: () => ({ data: { fields: [] } }),
  useViews: () => ({ data: [{ id: "v", isDefault: true }] }),
  useRecordList: () => ({ data: { records: [] } }),
  useAllRecordPages: () => empty,
  useUsers: () => empty,
}));
vi.mock("@/lib/records/use-parent-activities", () => ({
  useParentActivities: () => ({
    isLoading: false,
    isError: false,
    closed: [],
    open: [
      {
        kind: "task",
        count: 2,
        rows: [
          { id: "t1", subject: "Call back", href: "/tab/Tasks/t1" },
          { id: "t2", subject: "Send quote", href: "/tab/Tasks/t2" },
        ],
      },
      { kind: "meeting", count: 0, rows: [] },
      { kind: "call", count: 0, rows: [] },
    ],
  }),
}));

afterEach(cleanup);

test("opening a non-empty group lists its live rows", () => {
  render(
    <ActivitySidePanel
      orgSlug="org"
      record={
        { id: "a1", fields: { Who_Id: { id: "c1", name: "Ada", module: "Contacts" } } } as never
      }
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Tasks/ }));
  expect(screen.getByRole("link", { name: "Call back" }).getAttribute("href")).toBe(
    "/tab/Tasks/t1",
  );
  expect(screen.getByRole("link", { name: "Send quote" })).toBeTruthy();
});
