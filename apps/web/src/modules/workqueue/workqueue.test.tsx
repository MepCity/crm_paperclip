import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { taskField } from "@/modules/tasks/test-metadata";
import { describedBy } from "@/test/dom";
import { render } from "@/test/render";
import { type QueueData, queueDefinitions } from "./queues";
import { Workqueue } from "./workqueue";

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

it("shows synthetic populated and zero fixtures with consistent counts and unavailable boundaries", async () => {
  sessionStorage.setItem("workqueue-welcome:test:user", "dismissed");
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Synthetic tasks" }));
  const table = screen.getByRole("table");
  expect(within(table).getByRole("columnheader", { name: "Subject" })).toBeTruthy();
  expect(within(table).getByRole("columnheader", { name: "Due Date" })).toBeTruthy();
  expect(within(table).getByRole("columnheader", { name: "Status" })).toBeTruthy();
  expect(within(table).getAllByRole("link")).toHaveLength(3);
  expect(screen.getByTestId("preview-count").textContent).toBe("3 records");
  expect(within(table).getAllByRole("link")[0]?.getAttribute("href")).toMatch(
    /^\/crm\/test\/tab\/Tasks\/preview-task-/,
  );
  await user.click(screen.getByRole("button", { name: "All open" }));
  expect(within(table).getAllByRole("link")).toHaveLength(4);
  expect(screen.getByTestId("preview-count").textContent).toBe("4 records");
  await user.click(screen.getByRole("button", { name: "Synthetic zero result" }));
  expect(screen.getByTestId("preview-count").textContent).toBe("0 records");
  expect(screen.getByText(/provisional empty state/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Add Leads queue" }));
  expect(screen.getByRole("status").textContent).toMatch(/unavailable/);
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
