import type { AutomationPort } from "@crm/core/automation";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { createSyntheticWorkflowRulesPort, leadWelcomeRule } from "./fixtures";
import { WorkflowRuleDetailScreen } from "./workflow-rule-detail-screen";
import { WorkflowRulesListScreen } from "./workflow-rules-list-screen";

afterEach(cleanup);

it("exposes table headers and tabs from the module filter to the rule link", async () => {
  const user = userEvent.setup();
  render(
    <WorkflowRulesListScreen
      orgSlug="synthetic"
      port={createSyntheticWorkflowRulesPort([leadWelcomeRule])}
    />,
  );
  const table = await screen.findByRole("table", { name: "Workflow rules table" });
  expect(within(table).getAllByRole("row")).toHaveLength(2);
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((h) => h.textContent),
  ).toEqual(["Name", "Module", "Trigger", "Status"]);
  await user.tab();
  const filter = screen.getByRole("combobox", { name: "Filter workflow rules by module" });
  expect(document.activeElement).toBe(filter);
  await user.keyboard("{Escape}");
  expect(document.activeElement).toBe(filter);
  await user.selectOptions(filter, "Leads");
  const link = await screen.findByRole("link", { name: leadWelcomeRule.name });
  await user.tab();
  expect(document.activeElement).toBe(link);
  expect(link.getAttribute("href")).toContain(leadWelcomeRule.id);
  const activate = vi.fn((event: Event) => event.preventDefault());
  link.addEventListener("click", activate);
  await user.keyboard("{Enter}");
  expect(activate).toHaveBeenCalledOnce();
});

it.each(["{Enter}", " "])("activates the named trigger retry with %s", async (key) => {
  const user = userEvent.setup();
  const get = vi.fn<AutomationPort["get"]>().mockResolvedValue({
    ok: false,
    error: { code: "unavailable" },
  });
  const port: AutomationPort = {
    list: async () => ({ ok: true, value: { items: [leadWelcomeRule], nextCursor: null } }),
    get,
  };
  render(<WorkflowRulesListScreen orgSlug="synthetic" port={port} />);
  const retry = await screen.findByRole("button", {
    name: `Retry loading trigger for ${leadWelcomeRule.name}`,
  });
  await user.tab();
  await user.tab();
  await user.tab();
  expect(document.activeElement).toBe(retry);
  await user.keyboard(key);
  expect(get).toHaveBeenCalledTimes(2);
});

it("provides one detail h1, ordered section headings and a keyboard back link", async () => {
  const user = userEvent.setup();
  render(
    <WorkflowRuleDetailScreen
      orgSlug="synthetic"
      ruleId={leadWelcomeRule.id}
      initialResult={{ ok: true, value: leadWelcomeRule }}
    />,
  );
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1, name: leadWelcomeRule.name })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: "Trigger" })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: "Condition Branches" })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 3, name: "Immediate Actions" })).toBeTruthy();
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("link", { name: "Back to Workflow Rules" }));
});

it("keeps one detail heading in a failed read", () => {
  render(
    <WorkflowRuleDetailScreen
      orgSlug="synthetic"
      ruleId="missing"
      initialResult={{ ok: false, error: { code: "not_found" } }}
    />,
  );
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});

it.each(["{Enter}", " "])("pages through rules with %s after the last row link", async (key) => {
  const user = userEvent.setup();
  const list = vi
    .fn<AutomationPort["list"]>()
    .mockResolvedValueOnce({ ok: true, value: { items: [leadWelcomeRule], nextCursor: "next" } })
    .mockResolvedValue({ ok: true, value: { items: [], nextCursor: null } });
  const port: AutomationPort = { list, get: async () => ({ ok: true, value: leadWelcomeRule }) };
  render(<WorkflowRulesListScreen orgSlug="synthetic" port={port} />);
  const next = await screen.findByRole("button", { name: "Next page" });
  await user.tab();
  await user.tab();
  await user.tab();
  expect(document.activeElement).toBe(next);
  await user.keyboard(key);
  await screen.findByText("No workflow rules have been configured yet.");
  expect(list).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ cursor: "next" }),
  );
});

it.each(["list", "detail"] as const)(
  "retries an unavailable %s read from the keyboard",
  async (view) => {
    const user = userEvent.setup();
    const unavailable = { ok: false, error: { code: "unavailable" } } as const;
    const list = vi.fn<AutomationPort["list"]>().mockResolvedValue({
      ok: true,
      value: { items: [], nextCursor: null },
    });
    const get = vi
      .fn<AutomationPort["get"]>()
      .mockResolvedValue({ ok: true, value: leadWelcomeRule });
    const port = { list, get };
    if (view === "list") {
      render(
        <WorkflowRulesListScreen orgSlug="synthetic" port={port} initialResult={unavailable} />,
      );
    } else {
      render(
        <WorkflowRuleDetailScreen
          orgSlug="synthetic"
          ruleId={leadWelcomeRule.id}
          port={port}
          initialResult={unavailable}
        />,
      );
    }
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Retry" }));
    await user.keyboard("{Enter}");
    if (view === "list") {
      await screen.findByText("No workflow rules have been configured yet.");
      expect(list).toHaveBeenCalledOnce();
    } else {
      await screen.findByRole("heading", { level: 1, name: leadWelcomeRule.name });
      expect(get).toHaveBeenCalledOnce();
    }
  },
);
