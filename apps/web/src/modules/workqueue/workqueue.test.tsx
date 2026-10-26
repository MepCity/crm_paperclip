import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/client-provider";
import { taskField } from "@/modules/tasks/test-metadata";
import { describedBy } from "@/test/dom";
import { render } from "@/test/render";
import { type QueueData, queueDefinitions } from "./queues";
import { overdueLabel, Workqueue } from "./workqueue";

const refresh = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace }) }));
const queues: QueueData[] = queueDefinitions.map((queue) => ({
  id: queue.id,
  count: queue.id === "tasks" ? 1 : 0,
  columns: [taskField(queue.linkField, { label: queue.linkField })],
  result: {
    records:
      queue.id === "tasks" ? [{ id: "task-test", fields: { Subject: "Synthetic task" } }] : [],
    page: 1,
    perPage: 10,
    moreRecords: false,
    sort: { field: "id", order: "asc" },
  },
}));
function mount(page = 1) {
  return render(
    <Workqueue
      orgSlug="test"
      user={{ id: "user", name: "Test User", role: "Member" }}
      queues={queues}
      page={page}
    />,
  );
}
beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});
it("dismisses the welcome for the session and switches queues without a write", async () => {
  const user = userEvent.setup();
  const view = mount();
  const dialog = await screen.findByRole("dialog", {
    name: "Workqueue - Stay on top of your day",
  });
  expect(dialog).toBeTruthy();
  const getStarted = screen.getByRole("button", { name: "Get Started" });
  expect(document.activeElement).toBe(getStarted);
  await user.click(getStarted);
  expect(screen.queryByRole("dialog")).toBeNull();
  const tasksButton = screen.getByRole("button", { name: "Tasks 1" });
  expect(document.activeElement).toBe(tasksButton);
  const rail = screen.getByRole("complementary", { name: "Workqueue queues" });
  for (const section of [
    "My Open Activity",
    "My Jobs",
    "My Workqueue",
    "Leads",
    "Contacts",
    "Deals",
    "Campaigns",
  ])
    expect(within(rail).getByRole("heading", { name: section })).toBeTruthy();
  expect(within(rail).getByRole("button", { name: "Tasks 1" }).getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(
    within(rail).getByRole("button", { name: "Meetings 0" }).getAttribute("aria-pressed"),
  ).toBe("false");
  expect(screen.getByRole("link", { name: "Synthetic task" }).getAttribute("href")).toBe(
    "/crm/test/tab/Tasks/task-test",
  );
  await user.click(within(rail).getByRole("button", { name: "My Deals 0" }));
  expect(screen.getByRole("region", { name: "My Deals queue" })).toBeTruthy();
  expect(replace).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Refresh queue" }));
  expect(refresh).toHaveBeenCalledOnce();
  for (const name of [
    "Filter",
    "View Settings",
    "Alphabet filter",
    "Help",
    "Select users",
    "Customize queue",
    "Suggested queue",
    "Add Leads queue",
  ]) {
    const btn = screen.getByRole("button", { name });
    expect(describedBy(btn)).toBe(
      "Action is unavailable in this preview: no changes are made or saved.",
    );
    await user.click(btn);
  }
  expect(refresh).toHaveBeenCalledOnce();
  view.unmount();
  mount();
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("resets paging when changing queue", async () => {
  sessionStorage.setItem("workqueue-welcome:test:user", "dismissed");
  mount(2);
  await userEvent.click(screen.getByRole("button", { name: "My Deals 0" }));
  expect(replace).toHaveBeenCalledWith("/crm/test/workqueue", { scroll: false });
});

afterEach(cleanup);

it("keeps test controls out of the product and shows the observed task columns", () => {
  sessionStorage.setItem("workqueue-welcome:test:user", "dismissed");
  mount();
  expect(screen.queryByText("Preview data")).toBeNull();
  expect(screen.queryByRole("button", { name: /Synthetic/ })).toBeNull();
  expect(screen.getByRole("button", { name: "Activity period: Today & Overdue" })).toBeTruthy();
  const rail = screen.getByRole("complementary", { name: "Workqueue queues" });
  for (const button of rail.querySelectorAll(".workqueue-row")) {
    expect(button.querySelector("svg")).toBeTruthy();
    expect(button.querySelector(".workqueue-count")).toBeTruthy();
  }
});

it("renders overdue task dates in red and hides default lookup columns", () => {
  sessionStorage.setItem("workqueue-welcome:test:user", "dismissed");
  const populated = queues.map((queue) =>
    queue.id === "tasks"
      ? {
          ...queue,
          columns: [
            taskField("Subject"),
            taskField("Due_Date", { label: "Due Date", dataType: "date" }),
            taskField("Status"),
            taskField("Priority"),
            taskField("What_Id", { label: "Related To" }),
            taskField("Who_Id", { label: "Contact Name" }),
          ],
          result: {
            ...queue.result,
            records: [
              {
                id: "overdue",
                fields: {
                  Subject: "Past due task",
                  Due_Date: "2000-01-01",
                  Status: "Not Started",
                  Priority: "High",
                },
              },
            ],
          },
        }
      : queue,
  );
  render(
    <Workqueue
      orgSlug="test"
      user={{ id: "user", name: "Test User", role: "Member" }}
      queues={populated}
      page={1}
    />,
  );
  expect(screen.getByText(/^Late by \d+ days$/).className).toBe("text-danger");
  expect(screen.getByRole("columnheader", { name: "Priority" })).toBeTruthy();
  expect(screen.queryByRole("columnheader", { name: "Related To" })).toBeNull();
  expect(screen.queryByRole("columnheader", { name: "Contact Name" })).toBeNull();
});

it("formats overdue dates as calendar-day lateness", () => {
  const today = new Date(2026, 9, 24, 12);
  expect(overdueLabel("2026-10-23", today)).toBe("Late by 1 day");
  expect(overdueLabel("2026-10-21", today)).toBe("Late by 3 days");
  expect(overdueLabel("2026-10-24", today)).toBeNull();
  expect(overdueLabel("2026-10-25", today)).toBeNull();
  expect(overdueLabel(null, today)).toBeNull();
  expect(overdueLabel("invalid", today)).toBeNull();
});

it("activates queue buttons via keyboard Enter and Space", async () => {
  sessionStorage.setItem("workqueue-welcome:test:user", "dismissed");
  const user = userEvent.setup();
  mount();
  const meetingsBtn = screen.getByRole("button", { name: "Meetings 0" });
  meetingsBtn.focus();
  expect(document.activeElement).toBe(meetingsBtn);
  await user.keyboard("{Enter}");
  expect(screen.getByRole("region", { name: "Meetings queue" })).toBeTruthy();
  expect(meetingsBtn.getAttribute("aria-pressed")).toBe("true");

  const callsBtn = screen.getByRole("button", { name: "Calls 0" });
  callsBtn.focus();
  await user.keyboard(" ");
  expect(screen.getByRole("region", { name: "Calls queue" })).toBeTruthy();
  expect(callsBtn.getAttribute("aria-pressed")).toBe("true");
  expect(meetingsBtn.getAttribute("aria-pressed")).toBe("false");
});

it("shows all observed period choices with Today & Overdue checked, without changing queue data", async () => {
  sessionStorage.setItem("workqueue-welcome:test:user", "dismissed");
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Activity period: Today & Overdue" }));
  const options = screen.getAllByRole("menuitemradio");
  expect(options.map((option) => option.textContent)).toEqual([
    "Today & Overdue",
    "Today",
    "Tomorrow",
    "Overdue",
    "This Week",
    "Next Week",
    "This Month",
    "Next Month",
    "On a Specific Date",
  ]);
  expect(options[0]?.getAttribute("aria-checked")).toBe("true");
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Activity period: Today & Overdue" })).toBeDefined();
  expect(replace).not.toHaveBeenCalled();
});

it("translates all nine period choices into Turkish and keeps the observed default", async () => {
  sessionStorage.setItem("workqueue-welcome:test:user", "dismissed");
  const user = userEvent.setup();
  render(
    <LanguageProvider language="tr">
      <Workqueue
        orgSlug="test"
        user={{ id: "user", name: "Test User", role: "Member" }}
        queues={queues}
        page={1}
      />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Etkinlik dönemi: Bugün & Geciken" }));
  const options = screen.getAllByRole("menuitemradio");
  expect(options.map((option) => option.textContent)).toEqual([
    "Bugün & Geciken",
    "Bugün",
    "Yarın",
    "Geciken",
    "Bu Hafta",
    "Gelecek Hafta",
    "Bu Ay",
    "Önümüzdeki Ay",
    "Belirli Bir Tarihte",
  ]);
  expect(options[0]?.getAttribute("aria-checked")).toBe("true");
  await user.click(screen.getByRole("menuitemradio", { name: "Yarın" }));
  expect(screen.getByRole("button", { name: "Etkinlik dönemi: Bugün & Geciken" })).toBeDefined();
  expect(replace).not.toHaveBeenCalled();
});

it("shows the permission state without exposing queue rows or table actions", () => {
  sessionStorage.setItem("workqueue-welcome:test:user", "dismissed");
  render(
    <Workqueue
      accessDenied
      orgSlug="test"
      user={{ id: "user", name: "Test User", role: "Member" }}
      queues={queues}
      page={1}
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain(
    "You do not have permission to view this queue",
  );
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByText("Synthetic task")).toBeNull();
});

it("translates built-in task statuses while preserving custom display labels and stored values", () => {
  sessionStorage.setItem("workqueue-welcome:test:user", "dismissed");
  const field = taskField("Status", {
    label: "Status",
    dataType: "picklist",
    picklist: [
      { storedValue: "In Progress", displayValue: "In Progress" },
      { storedValue: "Completed", displayValue: "Team approval" },
    ],
  });
  const taskQueue = queues[0] as QueueData;
  const localized: QueueData = {
    ...taskQueue,
    columns: [field],
    result: {
      ...taskQueue.result,
      records: [
        { id: "a", fields: { Status: "In Progress" } },
        { id: "b", fields: { Status: "Completed" } },
      ],
    },
  };
  render(
    <LanguageProvider language="tr">
      <Workqueue
        orgSlug="test"
        user={{ id: "user", name: "Test User", role: "Member" }}
        queues={[localized]}
        page={1}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("columnheader", { name: "Durum" })).toBeTruthy();
  expect(screen.getByText("Devam Ediyor")).toBeTruthy();
  expect(screen.getByText("Team approval")).toBeTruthy();
  expect(field.picklist?.[0]?.storedValue).toBe("In Progress");
});
