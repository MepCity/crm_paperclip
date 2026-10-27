import type { ReportDefinition } from "@crm/core/definitions";
import type { FieldDefinition } from "@crm/core/records";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ReportBuilder, type ReportBuilderActions } from "./report-builder";

const field = (apiName: string, label: string, dataType = "text"): FieldDefinition => ({
  apiName,
  label,
  dataType: dataType as FieldDefinition["dataType"],
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: {} as FieldDefinition["views"],
});
const saved: ReportDefinition = {
  id: "report",
  revision: 2,
  module: "Leads",
  name: "Saved",
  description: "",
  columns: ["Last_Name"],
  criteria: null,
  grouping: null,
  createdAt: "2026-10-27",
  updatedAt: "2026-10-27",
  createdBy: "admin",
  updatedBy: "admin",
};
function setup(initial?: ReportDefinition) {
  const actions: ReportBuilderActions = {
    fields: vi.fn(async () => ({
      ok: true as const,
      value: [
        field("Last_Name", "Last Name"),
        field("Company", "Company"),
        field("Score", "Score", "integer"),
      ],
    })),
    save: vi.fn(async () => ({ ok: true as const, value: saved })),
    run: vi.fn(async () => ({
      ok: true as const,
      value: {
        ...saved,
        folder: null,
        lastAccessedDate: null,
        headings: ["Last Name"],
        rows: [["Visible"]],
      },
    })),
  };
  const onSaved = vi.fn();
  render(
    <ReportBuilder
      module="Leads"
      actions={actions}
      onCancel={vi.fn()}
      onSaved={onSaved}
      initial={initial}
    />,
  );
  return { actions, onSaved, user: userEvent.setup() };
}
afterEach(cleanup);
it("selects ordered columns, builds typed criteria, previews without saving and then creates", async () => {
  const { user, actions, onSaved } = setup();
  await user.type(await screen.findByRole("textbox", { name: "Report Name" }), "My report");
  await user.click(await screen.findByRole("checkbox", { name: "Last Name" }));
  await user.click(screen.getByRole("checkbox", { name: "Company" }));
  await user.click(screen.getByRole("button", { name: "Move Company up" }));
  await user.click(screen.getByRole("button", { name: "Add filter" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Filter 1 field" }), "Score");
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Filter 1 operator" }),
    "greater_than",
  );
  await user.type(screen.getByRole("textbox", { name: "Filter 1 value" }), "10");
  await user.click(screen.getByRole("button", { name: "Run" }));
  await screen.findByText("Visible");
  expect(actions.save).not.toHaveBeenCalled();
  expect(actions.run).toHaveBeenCalledWith(
    expect.objectContaining({
      columns: ["Company", "Last_Name"],
      criteria: {
        groupOperator: "and",
        group: [{ field: "Score", comparator: "greater_than", value: 10 }],
      },
      grouping: null,
    }),
  );
  expect(screen.getByRole("combobox", { name: "Grouping" })).toHaveProperty("disabled", true);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(actions.save).toHaveBeenCalledWith(expect.objectContaining({ name: "My report" }), {
    idempotencyKey: expect.any(String),
  });
  expect(onSaved).toHaveBeenCalledWith(saved);
});
it("preserves a failed draft and idempotency key on retry; editing sends the loaded revision", async () => {
  const { user, actions } = setup();
  const save = vi.mocked(actions.save);
  save.mockResolvedValue({ ok: false as const, error: { code: "unavailable" as const } });
  await user.type(await screen.findByRole("textbox", { name: "Report Name" }), "Retry report");
  await user.click(await screen.findByRole("checkbox", { name: "Last Name" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByRole("alert");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(save.mock.calls[1]).toEqual(save.mock.calls[0]);
  expect(screen.getByRole("textbox", { name: "Report Name" })).toHaveProperty(
    "value",
    "Retry report",
  );
  cleanup();
  const editing = setup(saved);
  await screen.findByRole("checkbox", { name: "Last Name" });
  vi.mocked(editing.actions.save).mockResolvedValue({
    ok: false as const,
    error: { code: "conflict" },
  });
  await editing.user.click(screen.getByRole("button", { name: "Save" }));
  expect(editing.actions.save).toHaveBeenCalledWith(expect.objectContaining({ name: "Saved" }), {
    id: "report",
    expectedRevision: 2,
  });
  expect((await screen.findByRole("alert")).textContent).toContain("Reload");
  expect(editing.onSaved).not.toHaveBeenCalled();
});

it("does not silently flatten nested saved criteria", async () => {
  const nested = {
    ...saved,
    criteria: {
      groupOperator: "and" as const,
      group: [
        {
          groupOperator: "or" as const,
          group: [{ field: "Last_Name", comparator: "equal" as const, value: "A" }],
        },
      ],
    },
  };
  setup(nested);
  await screen.findByRole("checkbox", { name: "Last Name" });
  expect(screen.getByRole("alert").textContent).toContain("nested conditions");
  expect(screen.getByRole("button", { name: "Save" })).toHaveProperty("disabled", true);
  expect(screen.getByRole("button", { name: "Run" })).toHaveProperty("disabled", true);
});
