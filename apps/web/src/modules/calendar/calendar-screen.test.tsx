import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { CalendarScreen } from "./calendar-screen";

const { push, list } = vi.hoisted(() => ({ push: vi.fn(), list: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/client/provider", () => ({ useClientRecordService: () => ({ list }) }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function mount(date = "2026-01-31") {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <CalendarScreen orgSlug="acme" userId="user-a" initialDate={date} />
    </QueryClientProvider>,
  );
}

test("switches views, navigates dates, clamps month end and returns to today", async () => {
  list.mockResolvedValue({ records: [], moreRecords: false });
  const user = userEvent.setup();
  mount();
  await screen.findByText("No events in this date range.");
  expect(screen.getByRole("grid", { name: "day calendar 2026-01-31" })).toBeTruthy();
  const selector = within(screen.getByRole("group", { name: "Calendar view" }));
  await user.click(selector.getByRole("button", { name: "Week" }));
  await screen.findByRole("grid", { name: "week calendar 2026-01-31" });
  await user.click(screen.getByRole("button", { name: "Next week" }));
  await screen.findByRole("grid", { name: "week calendar 2026-02-07" });
  await user.click(screen.getByRole("button", { name: "Previous week" }));
  await user.click(selector.getByRole("button", { name: "Month" }));
  await user.click(
    within(screen.getByRole("region", { name: "Calendar schedule" })).getByRole("button", {
      name: "Next month",
    }),
  );
  await screen.findByRole("grid", { name: "Month calendar 2026-02" });
  expect((screen.getByLabelText("Calendar date") as HTMLInputElement).value).toBe("2026-02-28");
  await user.click(screen.getByRole("button", { name: "Today" }));
  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  expect((screen.getByLabelText("Calendar date") as HTMLInputElement).value).toBe(expected);
});

test("shows loading, recovers errors, changes calendar scope and opens existing details", async () => {
  list.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({
    records: [
      {
        id: "meeting-a",
        fields: {
          Event_Title: "Planning",
          All_day: true,
          Start_DateTime: "2026-01-31T00:00:00Z",
          End_DateTime: "2026-01-31T23:59:59Z",
        },
      },
    ],
    moreRecords: false,
  });
  const user = userEvent.setup();
  mount();
  expect(screen.getByRole("status").textContent).toContain("Loading calendar");
  await screen.findByRole("alert");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await user.click(await screen.findByRole("button", { name: /^Planning,/ }));
  expect(push).toHaveBeenCalledWith("/crm/acme/tab/Meetings/meeting-a");
  await user.click(screen.getByRole("button", { name: "All Users" }));
  await waitFor(() =>
    expect(list).toHaveBeenLastCalledWith(
      "Events",
      expect.not.objectContaining({ filters: expect.anything() }),
    ),
  );
  await user.click(screen.getByRole("button", { name: "Select date 2026-02-01" }));
  await screen.findByRole("grid", { name: "day calendar 2026-02-01" });
});

test("opens the calendar creation menu and routes the selected activity to its form", async () => {
  list.mockResolvedValue({ records: [], moreRecords: false });
  const user = userEvent.setup();
  mount();
  await screen.findByRole("grid");
  await user.click(screen.getByRole("button", { name: "Create" }));
  expect(push).not.toHaveBeenCalled();
  await user.click(screen.getByRole("menuitem", { name: "Meeting" }));
  expect(push).toHaveBeenCalledWith("/crm/acme/tab/Meetings/create");
});
