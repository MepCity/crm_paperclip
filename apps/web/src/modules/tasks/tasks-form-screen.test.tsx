import type { RecordData } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { RecordFormScreen } from "@/components/records/form/record-form-screen";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { render } from "@/test/render";
import { tasksScreenDefinition } from "./definition";
import { TASKS_FORM_INFORMATION_COLUMNS, tasksFormRules } from "./tasks-form-rules";

let counter = 0;
function harness(record?: RecordData) {
  const ctx = {
    orgId: `task-form-${++counter}`,
    orgSlug: "task-form",
    orgName: "Task Form",
    userId: "form-author",
    role: "admin" as const,
  };
  const fixture = createFixtureRecordService(ctx);
  const service = createClientRecordService(fixture, {
    listUsers: async () => [
      { userId: ctx.userId, name: "Form Author", email: "author@example.test" },
    ],
  });
  if (record) vi.spyOn(service, "get").mockResolvedValue(record);
  const navigate = vi.fn();
  render(
    <ApiProvider orgSlug={ctx.orgSlug} service={service}>
      <RecordFormScreen
        currentUserId={ctx.userId}
        recordId={record?.id}
        config={{
          module: "Tasks",
          variant: tasksScreenDefinition.form.variant,
          inventoryChrome: true,
          rules: tasksFormRules,
          sectionColumnOverrides: { "Task Information": TASKS_FORM_INFORMATION_COLUMNS },
          paths: { detail: (id) => `detail:${id}`, create: "create", cancel: "origin" },
          navigate,
        }}
      />
    </ApiProvider>,
  );
  return { service, navigate };
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("Task label selectors sit outside inputs and open the existing lookup dialogs", async () => {
  harness();
  await screen.findByRole("heading", { name: "Create Task" });
  const user = userEvent.setup();
  for (const [label, selected] of [
    ["Contact Name", "Contact"],
    ["Related To", "Account"],
  ]) {
    const selector = screen.getByRole("button", { name: `${label} module` });
    expect(selector.textContent).toContain(selected);
    expect(selector.closest(".record-form-row__label")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: label }).querySelector("button")).toBeNull();
    await user.click(screen.getByRole("button", { name: `Open ${label} lookup` }));
    const dialog = await screen.findByRole("dialog", { name: `Choose ${selected}` });
    expect(dialog).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: `Choose ${selected}` })).toBeNull(),
    );
  }
  expect(screen.queryByText("Create Form Views :")).toBeNull();
  expect(screen.queryByRole("button", { name: "Client Script" })).toBeNull();
});

test("edit preserves target modules and changing type clears the old record in the update", async () => {
  const { service, navigate } = harness({
    id: "task-1",
    fields: {
      Subject: "Call back",
      Who_Id: { module: "Leads", id: "lead-1", name: "Synthetic Lead" },
      What_Id: { module: "Deals", id: "deal-1", name: "Synthetic Deal" },
    },
  });
  const update = vi.spyOn(service, "update").mockResolvedValue({ id: "task-1", fields: {} });
  await screen.findByRole("heading", { name: "Edit Task" });
  const user = userEvent.setup();
  expect(screen.getByRole("button", { name: "Contact Name module" }).textContent).toContain("Lead");
  expect(screen.getByRole("button", { name: "Related To module" }).textContent).toContain("Deal");
  for (const [label, next] of [
    ["Contact Name", "Contact"],
    ["Related To", "Account"],
  ]) {
    await user.click(screen.getByRole("button", { name: `${label} module` }));
    await user.click(screen.getByRole("option", { name: next }));
    expect((screen.getByRole("textbox", { name: label }) as HTMLInputElement).value).toBe("");
  }
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith("detail:task-1"));
  expect(update).toHaveBeenCalledWith(
    "Tasks",
    "task-1",
    expect.objectContaining({ Who_Id: null, What_Id: null }),
  );
});

test("Repeat stays editable despite its subdued off appearance", async () => {
  harness();
  await screen.findByRole("heading", { name: "Create Task" });
  const repeat = screen.getByRole("switch", { name: "Repeat" });
  expect(repeat.closest("[data-form-field]")?.hasAttribute("data-form-toggle-subdued")).toBe(true);
  expect(repeat.hasAttribute("disabled")).toBe(false);
  await userEvent.setup().click(repeat);
  expect(
    document
      .querySelector('[data-form-field="Recurring_Activity"] [data-switch-track]')
      ?.hasAttribute("data-selected"),
  ).toBe(true);
});
