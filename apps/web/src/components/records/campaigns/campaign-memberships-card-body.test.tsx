import type { RecordData } from "@crm/core/records";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { CampaignMembershipsCardBody } from "./campaign-memberships-card-body";

const state = vi.hoisted(() => ({
  members: [] as RecordData[],
  campaigns: [] as RecordData[],
  update: vi.fn(async (_: unknown) => ({})),
  remove: vi.fn(async (_: unknown) => ({})),
  calls: [] as { module: string; query: unknown }[],
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useViews: () => ({ data: [{ id: "all", isDefault: true }], isLoading: false, isError: false }),
  useRecordList: (module: string, query: unknown) => {
    state.calls.push({ module, query });
    return {
      data: { records: module === "Campaign_Members" ? state.members : state.campaigns },
      isLoading: false,
      isError: false,
    };
  },
  useUpdateRecord: () => ({ mutateAsync: state.update, isPending: false }),
  useDeleteRecords: () => ({ mutateAsync: state.remove, isPending: false }),
}));

beforeEach(() => {
  state.update.mockClear();
  state.remove.mockClear();
  state.calls = [];
  state.members = [
    {
      id: "m1",
      fields: { Campaign: { module: "Campaigns", id: "k1" }, Member_Status: "Invited" },
    },
  ];
  state.campaigns = [
    {
      id: "k1",
      fields: {
        Campaign_Name: "Spring Launch",
        Status: "Active",
        Type: "Email",
        Start_Date: "2026-03-01",
        End_Date: "2026-04-01",
      },
    },
  ];
});
afterEach(cleanup);

const props = {
  module: "Leads" as const,
  recordId: "l1",
  campaignPath: (id: string) => `/campaigns/${id}`,
};

test("renders a membership row linking to the campaign", () => {
  render(<CampaignMembershipsCardBody {...props} />);
  expect(screen.getByRole("link", { name: "Spring Launch" }).getAttribute("href")).toBe(
    "/campaigns/k1",
  );
  for (const value of ["Active", "Email", "Invited"]) {
    expect(screen.getByText(value)).toBeTruthy();
  }
  expect(screen.queryByText("2026-03-01")).toBeNull();
  expect(screen.queryByText("2026-04-01")).toBeNull();
  expect(screen.getByText(/2026/, { selector: "td:nth-child(4) *" })).toBeTruthy();
  expect(state.calls[0]?.query).toMatchObject({
    filters: { field: "Lead", comparator: "equal", value: "l1" },
  });
});

test("shows the empty state without memberships", () => {
  state.members = [];
  render(<CampaignMembershipsCardBody {...props} />);
  expect(screen.getByText("No records found")).toBeTruthy();
});

test("Remove asks for confirmation and deletes only the membership", async () => {
  const user = userEvent.setup();
  render(<CampaignMembershipsCardBody {...props} />);
  await user.click(screen.getByRole("button", { name: "Remove Spring Launch" }));
  await user.click(await screen.findByRole("button", { name: "Remove" }));
  await waitFor(() => expect(state.remove).toHaveBeenCalledWith(["m1"]));
});

test("Edit saves the Member Status of the membership", async () => {
  const user = userEvent.setup();
  render(<CampaignMembershipsCardBody {...props} />);
  await user.click(screen.getByRole("button", { name: "Edit Spring Launch" }));
  await user.click(await screen.findByRole("button", { name: /Member Status/ }));
  await user.click(await screen.findByRole("option", { name: "Opened" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(state.update).toHaveBeenCalledWith({ id: "m1", input: { Member_Status: "Opened" } }),
  );
});

test("shows a dash for missing campaign dates", () => {
  state.campaigns = [{ id: "k1", fields: { Campaign_Name: "Spring Launch" } }];
  render(<CampaignMembershipsCardBody {...props} />);
  expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
});
