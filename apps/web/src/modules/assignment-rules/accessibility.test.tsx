import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { syntheticAssignmentRules } from "../automation/synthetic-fixture";
import { AssignmentRuleDetail } from "./assignment-rule-detail";
import { AssignmentRulesScreen } from "./assignment-rules-screen";

afterEach(cleanup);

it("names icon buttons and follows visual tab order through the filter and links", async () => {
  const user = userEvent.setup();
  render(
    <AssignmentRulesScreen
      orgSlug="synthetic"
      result={{ ok: true, value: { items: syntheticAssignmentRules, nextCursor: "next" } }}
    />,
  );
  expect(screen.getByRole("tablist", { name: "Assignment settings" })).toBeTruthy();
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Rules" }));
  await user.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Thresholds" }));
  await user.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Assistant" }));
  await user.keyboard("{Home}");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Rules" }));
  expect(screen.getByRole("tabpanel", { name: "Rules" })).toBeTruthy();
  for (const name of ["Assignment Rules help", "Contextual help"]) {
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name }));
    await user.keyboard("{Enter} {Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  }
  await user.tab();
  const filter = screen.getByRole("combobox", { name: "Module" });
  expect(document.activeElement).toBe(filter);
  await user.selectOptions(filter, "Leads");
  await user.keyboard("{Escape}");
  expect(document.activeElement).toBe(filter);
  await user.tab();
  const apply = screen.getByRole("button", { name: "Apply filter" });
  expect(document.activeElement).toBe(apply);
  const submit = vi.fn((event: Event) => event.preventDefault());
  apply.closest("form")?.addEventListener("submit", submit);
  await user.keyboard("{Enter} ");
  expect(submit).toHaveBeenCalledTimes(2);
  const table = screen.getByRole("table", { name: "Assignment rules" });
  expect(within(table).getAllByRole("columnheader")).toHaveLength(4);
  for (const rule of syntheticAssignmentRules) {
    await user.tab();
    expect(document.activeElement).toBe(within(table).getByRole("link", { name: rule.name }));
  }
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("link", { name: "Next page" }));
});

it("uses one h1 with h2 sections and a named entries table on detail", async () => {
  const user = userEvent.setup();
  const rule = syntheticAssignmentRules[0];
  if (!rule) throw new Error("Missing synthetic assignment rule");
  render(<AssignmentRuleDetail result={{ ok: true, value: rule }} listHref="/list" />);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1, name: rule.name })).toBeTruthy();
  for (const name of ["Rule entries", "Default recipient"]) {
    expect(screen.getByRole("heading", { level: 2, name })).toBeTruthy();
  }
  const table = screen.getByRole("table", { name: "Assignment rule entries" });
  expect(within(table).getAllByRole("columnheader")).toHaveLength(5);
  await user.tab();
  const back = screen.getByRole("link", { name: "Back to Assignment Rules" });
  expect(document.activeElement).toBe(back);
  const activate = vi.fn((event: Event) => event.preventDefault());
  back.addEventListener("click", activate);
  await user.keyboard("{Enter}");
  expect(activate).toHaveBeenCalledOnce();
});

it("keeps one detail h1 on an unavailable read", () => {
  render(
    <AssignmentRuleDetail
      result={{ ok: false, error: { code: "unavailable" } }}
      listHref="/list"
    />,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Assignment Rule" })).toBeTruthy();
});
