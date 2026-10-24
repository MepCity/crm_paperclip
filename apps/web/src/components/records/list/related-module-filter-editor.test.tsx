import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { FilterPanel, type FilterPanelProps } from "./filter-panel";

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => ({
    data: {
      fields: [
        { apiName: "Note_Title", label: "Note Title", dataType: "text" },
        { apiName: "Created_Time", label: "Created Time", dataType: "datetime" },
        { apiName: "Note_Content", label: "Note Content", dataType: "textarea" },
      ],
    },
  }),
}));

afterEach(cleanup);

const config = (module: "Notes" | "Tasks") => ({
  module,
  fieldModule: module,
  parentLabel: "Samples",
  fieldLabels: ["Note Title", "Created Time", "Note Content"],
});
const groups: FilterPanelProps["groups"] = [
  {
    id: "related",
    label: "Filter By Related Modules",
    items: [
      { id: "r0", label: "Notes", relatedModule: config("Notes") },
      { id: "r1", label: "Tasks", relatedModule: config("Tasks") },
      { id: "r2", label: "Calls", relatedModule: { ...config("Notes"), module: "Calls" } },
      { id: "r3", label: "Meetings", relatedModule: { ...config("Notes"), module: "Meetings" } },
    ],
  },
];

function Harness({ onApply }: { onApply: FilterPanelProps["onApply"] }) {
  const [ids, setIds] = useState<string[]>([]);
  return (
    <FilterPanel
      title="Filter"
      searchLabel="Search filter choices"
      searchPlaceholder="Search"
      groups={groups}
      selectedIds={ids}
      onSelectionChange={setIds}
      onApply={onApply}
    />
  );
}

test("checking a row shows the editor; applying sends presence and child criteria", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  render(<Harness onApply={onApply} />);
  expect(screen.queryByText("Any Notes")).toBeNull();
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  expect(screen.getByText("Any Notes")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /Notes presence/ }));
  await user.click(screen.getByRole("option", { name: "without" }));
  await user.click(screen.getByRole("button", { name: "+ Add Field" }));
  await user.keyboard("{Escape}");
  // Incomplete pending criterion blocks Apply.
  expect((screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  await user.click(screen.getByRole("button", { name: "Remove Notes criterion" }));
  await user.click(screen.getByRole("button", { name: "Apply Filter" }));
  const related = onApply.mock.calls[0]?.[5];
  expect(related).toEqual([{ module: "Notes", presence: "without", criteria: [] }]);
  // Unchecking removes the editor.
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  expect(screen.queryByText("Any Notes")).toBeNull();
});

test("a fourth related row cannot be selected", async () => {
  const user = userEvent.setup();
  render(<Harness onApply={() => {}} />);
  for (const name of ["Notes", "Tasks", "Calls"])
    await user.click(screen.getByRole("checkbox", { name }));
  expect((screen.getByRole("checkbox", { name: "Meetings" }) as HTMLInputElement).disabled).toBe(
    true,
  );
});

async function addField(user: ReturnType<typeof userEvent.setup>, option: string) {
  await user.click(screen.getByRole("button", { name: "+ Add Field" }));
  // The Select Field menu opens straight away; the pending criterion shows inactive controls.
  expect(await screen.findByRole("listbox")).toBeTruthy();
  expect(screen.getByText("is")).toBeTruthy();
  expect((screen.getByPlaceholderText("Type here") as HTMLInputElement).disabled).toBe(true);
  await user.click(screen.getByRole("option", { name: option }));
}

test("child criteria: text field defaults to contains and is sent on Apply", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  render(<Harness onApply={onApply} />);
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  await addField(user, "Note Title");
  expect((screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  await user.type(screen.getByPlaceholderText("Type here"), "Renewal");
  await user.click(screen.getByRole("button", { name: "Apply Filter" }));
  expect(onApply.mock.calls[0]?.[5]).toEqual([
    {
      module: "Notes",
      presence: "with",
      criteria: [{ field: "Note_Title", comparator: "contains", value: "Renewal" }],
    },
  ]);
});

test("date child field defaults to age in 2 days; textarea fields are selectable", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  render(<Harness onApply={onApply} />);
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  await addField(user, "Created Time");
  expect(screen.getByRole("button", { name: /operator/ }).textContent).toContain("age in");
  await user.click(screen.getByRole("button", { name: "Apply Filter" }));
  expect(onApply.mock.calls[0]?.[5]?.[0].criteria).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Remove Notes criterion" }));
  await addField(user, "Note Content");
  expect(screen.getByPlaceholderText("Type here")).toBeTruthy();
});

test("a sixth criterion cannot be added", async () => {
  const user = userEvent.setup();
  render(<Harness onApply={() => {}} />);
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  for (let i = 0; i < 5; i += 1) {
    await user.click(screen.getByRole("button", { name: "+ Add Field" }));
    await user.keyboard("{Escape}");
  }
  expect((screen.getByRole("button", { name: "+ Add Field" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
});
