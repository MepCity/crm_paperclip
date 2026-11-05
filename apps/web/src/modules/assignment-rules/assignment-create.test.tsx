import type { AssignmentRule } from "@crm/core/automation";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AssignmentRulesScreen } from "./assignment-rules-screen";

afterEach(cleanup);
it("Next persists an inactive shell and continues to its detail without activation controls", async () => {
  const user = userEvent.setup();
  const value: AssignmentRule = {
    id: "persisted-rule",
    kind: "assignment",
    module: "Leads",
    name: "Routing",
    description: "",
    enabled: false,
    entries: [],
    fallback: null,
    revision: "1",
    position: 0,
  };
  const onCreate = vi.fn(async () => ({ ok: true as const, value }));
  render(
    <AssignmentRulesScreen
      orgSlug="sample"
      result={{ ok: true, value: { items: [], nextCursor: null } }}
      onCreate={onCreate}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Create Assignment Rule" }));
  expect(screen.getByRole("button", { name: "Next" })).toHaveProperty("disabled", true);
  await user.selectOptions(screen.getByRole("combobox", { name: "Module" }), "Leads");
  await user.type(screen.getByRole("textbox", { name: "Rule Name" }), "Routing");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(onCreate).toHaveBeenCalledWith(
    { module: "Leads", name: "Routing", description: "" },
    expect.any(String),
  );
  const link = await screen.findByRole("link", { name: "Open rule" });
  expect(link.getAttribute("href")).toBe("/crm/sample/settings/assignment-rules/persisted-rule");
  expect(screen.getByRole("status").textContent).toContain("inactive");
  expect(screen.queryByRole("switch")).toBeNull();
});
