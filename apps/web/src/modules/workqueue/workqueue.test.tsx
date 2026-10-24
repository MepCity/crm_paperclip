import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { taskField } from "@/modules/tasks/test-metadata";
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
  expect(await screen.findByRole("dialog")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Get Started" }));
  expect(screen.queryByRole("dialog")).toBeNull();
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
  ])
    await user.click(screen.getByRole("button", { name }));
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
