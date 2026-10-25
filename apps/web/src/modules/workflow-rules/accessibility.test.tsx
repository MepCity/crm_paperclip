import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { leadWelcomeRule } from "../automation/synthetic-workflow-fixture";
import { WorkflowRuleDetailScreen } from "./workflow-rule-detail-screen";
import { WorkflowRulesListScreen } from "./workflow-rules-list-screen";
import { WorkflowRulesLoading } from "./workflow-rules-loading";

afterEach(cleanup);
const result = { ok: true, value: { items: [leadWelcomeRule], nextCursor: null } } as const;
const triggerResults = { [leadWelcomeRule.id]: { ok: true, value: leadWelcomeRule } } as const;

async function activateLink(user: ReturnType<typeof userEvent.setup>, link: HTMLElement) {
  expect(document.activeElement).toBe(link);
  const activate = vi.fn((event: Event) => event.preventDefault());
  link.addEventListener("click", activate);
  await user.keyboard("{Enter}");
  expect(activate).toHaveBeenCalledOnce();
}

it("exposes table headers and tabs from the module filter to the rule link", async () => {
  const user = userEvent.setup();
  render(
    <WorkflowRulesListScreen orgSlug="synthetic" result={result} triggerResults={triggerResults} />,
  );
  const table = screen.getByRole("table", { name: "Workflow rules table" });
  expect(within(table).getAllByRole("row")).toHaveLength(2);
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((h) => h.textContent),
  ).toEqual(["Name", "Module", "Trigger", "Status"]);
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Create Rule" }));
  await user.tab();
  const filter = screen.getByRole("combobox", { name: "Filter workflow rules by module" });
  expect(document.activeElement).toBe(filter);
  await user.keyboard("{Escape}");
  expect(document.activeElement).toBe(filter);
  await user.tab();
  const link = screen.getByRole("link", { name: leadWelcomeRule.name });
  expect(link.getAttribute("href")).toContain(leadWelcomeRule.id);
  await activateLink(user, link);
});

it("activates the named trigger retry GET link with Enter", async () => {
  const user = userEvent.setup();
  render(
    <WorkflowRulesListScreen
      orgSlug="synthetic"
      result={result}
      triggerResults={{}}
      module="Leads"
      cursor="current"
    />,
  );
  const retry = screen.getByRole("link", {
    name: `Retry loading trigger for ${leadWelcomeRule.name}`,
  });
  expect(retry.getAttribute("href")).toBe(
    "/crm/synthetic/settings/workflow-rules?module=Leads&cursor=current",
  );
  await user.tab();
  await user.tab();
  await user.tab();
  await user.tab();
  await activateLink(user, retry);
});

it("provides one detail h1, ordered section headings and a keyboard back link", async () => {
  const user = userEvent.setup();
  render(
    <WorkflowRuleDetailScreen
      orgSlug="synthetic"
      ruleId={leadWelcomeRule.id}
      result={{ ok: true, value: leadWelcomeRule }}
    />,
  );
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1, name: leadWelcomeRule.name })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: "Trigger" })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: "Condition Branches" })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 3, name: "Immediate Actions" })).toBeTruthy();
  await user.tab();
  await activateLink(user, screen.getByRole("link", { name: "Back to Workflow Rules" }));
});

it.each(["forbidden", "not_found", "unavailable"] as const)(
  "keeps one detail heading for %s",
  (code) => {
    render(
      <WorkflowRuleDetailScreen
        orgSlug="synthetic"
        ruleId="missing"
        result={{ ok: false, error: { code } }}
      />,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  },
);

it("keeps one detail heading during server navigation", () => {
  render(<WorkflowRulesLoading orgSlug="synthetic" />);
  expect(screen.getByRole("heading", { level: 1, name: "Workflow Rule Details" })).toBeTruthy();
  expect(screen.getByRole("status")).toBeTruthy();
});

it("activates the next-page GET link after the last row link", async () => {
  const user = userEvent.setup();
  render(
    <WorkflowRulesListScreen
      orgSlug="synthetic"
      result={{ ok: true, value: { items: [leadWelcomeRule], nextCursor: "next" } }}
      triggerResults={triggerResults}
      module="Leads"
    />,
  );
  const next = screen.getByRole("link", { name: "Next page" });
  expect(next.getAttribute("href")).toBe(
    "/crm/synthetic/settings/workflow-rules?module=Leads&cursor=next",
  );
  await user.tab();
  await user.tab();
  await user.tab();
  await user.tab();
  await activateLink(user, next);
});

it.each(["list", "detail"] as const)(
  "retries an unavailable %s read with a keyboard GET link",
  async (view) => {
    const user = userEvent.setup();
    const unavailable = { ok: false, error: { code: "unavailable" } } as const;
    if (view === "list") {
      render(
        <WorkflowRulesListScreen
          orgSlug="synthetic"
          result={unavailable}
          triggerResults={{}}
          module="Leads"
          cursor="current"
        />,
      );
    } else {
      render(
        <WorkflowRuleDetailScreen
          orgSlug="synthetic"
          ruleId={leadWelcomeRule.id}
          result={unavailable}
        />,
      );
    }
    const retry = screen.getByRole("link", { name: "Retry" });
    expect(retry.getAttribute("href")).toBe(
      view === "list"
        ? "/crm/synthetic/settings/workflow-rules?module=Leads&cursor=current"
        : `/crm/synthetic/settings/workflow-rules/${leadWelcomeRule.id}`,
    );
    await user.tab();
    await user.tab();
    await activateLink(user, retry);
  },
);
