import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import {
  initialSystemFilterDraft,
  isSystemFilterComplete,
  type SystemEditorKind,
  SystemFilterEditor,
  systemFilterValue,
} from "./system-filter-editor";

afterEach(cleanup);
const users = [{ id: "u1", label: "First user" }];
const relatedModules = [
  { id: "Notes", label: "Notes" },
  { id: "Events", label: "Meetings" },
];
function Editor({ kind }: { kind: SystemEditorKind }) {
  const [value, onChange] = useState(initialSystemFilterDraft(kind));
  return (
    <SystemFilterEditor
      kind={kind}
      label="Sample"
      value={value}
      onChange={onChange}
      users={users}
      relatedModules={relatedModules}
    />
  );
}
test("Locked defaults to locked and allows not locked", async () => {
  const user = userEvent.setup();
  render(<Editor kind="locked" />);
  await user.click(screen.getByRole("button", { name: /Sample state/ }));
  await user.click(screen.getByRole("option", { name: "Not locked" }));
  expect(screen.getByRole("button", { name: /Sample state/ }).textContent).toContain("Not locked");
  expect(screen.queryByRole("button", { name: /Sample period/ })).toBeNull();
});
test.each(["record_action", "related_records_action", "touched", "untouched"] as const)(
  "%s offers users and four periods",
  async (kind) => {
    const user = userEvent.setup();
    render(<Editor kind={kind} />);
    const period = screen.getByRole("button", { name: /Sample period/ });
    expect(period.textContent).toContain("Last 7 days");
    await user.click(period);
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Today",
      "Yesterday",
      "Last 7 days",
      "Last 30 days",
    ]);
    await user.click(screen.getByRole("option", { name: "Yesterday" }));
    expect(period.textContent).toContain("Yesterday");
    expect(screen.getByRole("button", { name: "Sample By" })).toBeTruthy();
  },
);
test("record actions omit unsupported conversion and merge; related selection maps Meetings to Events", async () => {
  const user = userEvent.setup();
  const view = render(<Editor kind="record_action" />);
  await user.click(screen.getByRole("button", { name: /Sample action/ }));
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "Created",
    "Modified",
  ]);
  await user.keyboard("{Escape}");
  view.unmount();
  render(<Editor kind="related_records_action" />);
  await user.click(screen.getByRole("button", { name: /Sample module/ }));
  await user.click(screen.getByRole("option", { name: "Meetings" }));
  expect(screen.getByRole("button", { name: /Sample module/ }).getAttribute("data-value")).toBe(
    "Events",
  );
  await user.click(screen.getByRole("button", { name: /Sample action/ }));
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "Added",
    "Modified",
    "Deleted",
  ]);
});
test("completion rejects missing relations, unsupported actions and invalid or excessive actors", () => {
  const draft = initialSystemFilterDraft("related_records_action");
  expect(isSystemFilterComplete("related_records_action", draft, { relatedModules }, users)).toBe(
    false,
  );
  expect(
    isSystemFilterComplete(
      "related_records_action",
      { ...draft, module: "Notes" },
      { relatedModules },
      users,
    ),
  ).toBe(true);
  expect(isSystemFilterComplete("record_action", { ...draft, action: "converted" })).toBe(false);
  expect(isSystemFilterComplete("touched", { ...draft, actorIds: ["unknown"] }, {}, users)).toBe(
    false,
  );
  expect(
    isSystemFilterComplete("untouched", { ...draft, actorIds: Array(26).fill("u1") }, {}, users),
  ).toBe(false);
});
test("Apply values use display-zone boundaries including DST and preserve selected actors", () => {
  const draft = {
    ...initialSystemFilterDraft("touched"),
    time: "today" as const,
    actorIds: ["u1"],
  };
  const now = new Date("2026-03-08T12:00:00Z");
  expect(systemFilterValue("touched", draft, now, "America/New_York")).toEqual({
    touched: {
      actorIds: ["u1"],
      period: { from: "2026-03-08T00:00:00-05:00", to: "2026-03-09T00:00:00-04:00" },
    },
  });
  expect(systemFilterValue("locked", { ...draft, locked: false }, now, "Europe/Istanbul")).toEqual({
    locked: { locked: false },
  });
});

test("By selects actor IDs, and deselecting returns to any user", async () => {
  const user = userEvent.setup();
  render(<Editor kind="touched" />);
  await user.click(screen.getByRole("button", { name: "Sample By" }));
  await user.click(screen.getByRole("option", { name: /First user/ }));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Sample By" }).textContent).toContain("First user");
  await user.click(screen.getByRole("button", { name: "Sample By" }));
  await user.click(screen.getByRole("option", { name: /First user/ }));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Sample By" }).textContent).toContain("Any user");
});
