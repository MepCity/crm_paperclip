import type { OrgContext } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { createAutomationPort } from "../automation/port";
import {
  contactRenewalRule,
  dealDiscountRule,
  leadWelcomeRule,
} from "../automation/synthetic-workflow-fixture";
import { readWorkflowRule, readWorkflowRules } from "./reads";
import { WorkflowRuleDetailScreen } from "./workflow-rule-detail-screen";
import { WorkflowRulesListScreen } from "./workflow-rules-list-screen";
import { WorkflowRulesLoading } from "./workflow-rules-loading";

afterEach(cleanup);
const ctx: OrgContext = {
  orgId: "test-org",
  orgSlug: "test-org",
  orgName: "Synthetic Populated Workflow",
  userId: "admin-user",
  role: "admin",
};

describe("WorkflowRulesListScreen server projections", () => {
  it("renders WL1–WL5 with server trigger reads and no write controls", async () => {
    const props = await readWorkflowRules(createAutomationPort(), ctx, {});
    render(<WorkflowRulesListScreen orgSlug={ctx.orgSlug} {...props} />);
    expect(screen.getAllByRole("columnheader").map((el) => el.textContent)).toEqual([
      "Name",
      "Module",
      "Trigger",
      "Status",
    ]);
    expect(screen.getByRole("link", { name: leadWelcomeRule.name }).getAttribute("href")).toBe(
      `/crm/test-org/settings/workflow-rules/${leadWelcomeRule.id}`,
    );
    expect(screen.getByText("On record creation")).toBeDefined();
    expect(screen.getByText("When fields change: Stage, Amount")).toBeDefined();
    expect(screen.getAllByRole("row")).toHaveLength(5);
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByRole("button", { name: /edit|delete|clone/i })).toBeNull();
  });
  it("shows server-selected filter, trigger failure and GET retry preserving the filter", async () => {
    const port = createAutomationPort();
    const props = await readWorkflowRules(
      { ...port, get: async () => ({ ok: false, error: { code: "unavailable" } }) },
      ctx,
      { module: "Leads" },
    );
    render(<WorkflowRulesListScreen orgSlug={ctx.orgSlug} {...props} module="Leads" />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("Leads");
    expect(screen.queryByRole("link", { name: dealDiscountRule.name })).toBeNull();
    expect(screen.getByText("Trigger unavailable")).toBeDefined();
    expect(screen.getByRole("link", { name: /Retry loading trigger/ }).getAttribute("href")).toBe(
      "/crm/test-org/settings/workflow-rules?module=Leads",
    );
  });
  it("renders an ordinary organization's empty state", async () => {
    const props = await readWorkflowRules(createAutomationPort(), { ...ctx, orgName: "Empty" }, {});
    render(<WorkflowRulesListScreen orgSlug={ctx.orgSlug} {...props} />);
    expect(screen.getByText("No workflow rules have been configured yet.")).toBeDefined();
    expect(screen.queryByRole("table")).toBeNull();
  });
  it("distinguishes filtered empty results", () => {
    render(
      <WorkflowRulesListScreen
        orgSlug={ctx.orgSlug}
        result={{ ok: true, value: { items: [], nextCursor: null } }}
        triggerResults={{}}
        module="Leads"
      />,
    );
    expect(screen.getByText('No workflow rules found for module "Leads".')).toBeDefined();
  });
  it.each(["forbidden", "unavailable", "invalid_query"] as const)(
    "renders %s with only safe GET retries",
    (code) => {
      render(
        <WorkflowRulesListScreen
          orgSlug={ctx.orgSlug}
          result={{ ok: false, error: { code } }}
          triggerResults={{}}
          module="Leads"
          cursor="scoped-cursor"
        />,
      );
      expect(screen.getByRole("alert")).toBeDefined();
      if (code === "forbidden") expect(screen.queryByRole("link", { name: "Retry" })).toBeNull();
      else
        expect(screen.getByRole("link", { name: "Retry" }).getAttribute("href")).toBe(
          "/crm/test-org/settings/workflow-rules?module=Leads&cursor=scoped-cursor",
        );
    },
  );
  it("renders next-page GET link only when a cursor exists", () => {
    render(
      <WorkflowRulesListScreen
        orgSlug={ctx.orgSlug}
        result={{ ok: true, value: { items: [leadWelcomeRule], nextCursor: "opaque+/=" } }}
        triggerResults={{ [leadWelcomeRule.id]: { ok: true, value: leadWelcomeRule } }}
        module="Leads"
      />,
    );
    expect(screen.getByRole("link", { name: "Next page" }).getAttribute("href")).toBe(
      "/crm/test-org/settings/workflow-rules?module=Leads&cursor=opaque%2B%2F%3D",
    );
  });
});

describe("WorkflowRuleDetailScreen server projections", () => {
  it("renders WD1–WD5 including ordered conditions, actions and timing", async () => {
    const result = await readWorkflowRule(createAutomationPort(), ctx, leadWelcomeRule.id);
    render(
      <WorkflowRuleDetailScreen
        orgSlug={ctx.orgSlug}
        ruleId={leadWelcomeRule.id}
        result={result}
      />,
    );
    expect(screen.getByRole("heading", { name: leadWelcomeRule.name })).toBeDefined();
    expect(screen.getByText(leadWelcomeRule.description)).toBeDefined();
    expect(screen.getByText("Module: Leads")).toBeDefined();
    expect(screen.getByText("On record creation")).toBeDefined();
    expect(screen.getByText('Lead_Source equals "Web Download"')).toBeDefined();
    expect(screen.getByText("template:lead_welcome_pack")).toBeDefined();
    expect(screen.getByText("1 day after event")).toBeDefined();
    expect(screen.getByText("task:introductory_call")).toBeDefined();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByRole("button", { name: /edit|delete|clone/i })).toBeNull();
  });
  it.each([dealDiscountRule, contactRenewalRule])(
    "preserves empty action sections for $id",
    (rule) => {
      render(
        <WorkflowRuleDetailScreen
          orgSlug={ctx.orgSlug}
          ruleId={rule.id}
          result={{ ok: true, value: rule }}
        />,
      );
      expect(
        screen.getByText(
          rule === dealDiscountRule
            ? "No scheduled actions configured."
            : "No immediate actions configured.",
        ),
      ).toBeDefined();
    },
  );
  it.each(["forbidden", "not_found", "unavailable"] as const)(
    "renders %s without falling back to a client fixture",
    (code) => {
      render(
        <WorkflowRuleDetailScreen
          orgSlug={ctx.orgSlug}
          ruleId="missing"
          result={{ ok: false, error: { code } }}
        />,
      );
      expect(screen.getByRole("alert")).toBeDefined();
      expect(
        screen.getByRole("link", { name: "Back to Workflow Rules" }).getAttribute("href"),
      ).toBe("/crm/test-org/settings/workflow-rules");
      expect(screen.queryByRole("heading", { name: leadWelcomeRule.name })).toBeNull();
      if (code === "unavailable")
        expect(screen.getByRole("link", { name: "Retry" }).getAttribute("href")).toBe(
          "/crm/test-org/settings/workflow-rules/missing",
        );
      if (code === "not_found") expect(screen.getByText("Workflow rule not found.")).toBeDefined();
    },
  );
});

describe("workflow pending reads", () => {
  it("shows list loading without fabricated rows", () => {
    render(<WorkflowRulesLoading />);
    expect(screen.getByRole("status").textContent).toContain("Loading workflow rules...");
    expect(screen.queryByRole("table")).toBeNull();
  });
  it("keeps return navigation while detail loads", () => {
    render(<WorkflowRulesLoading orgSlug="test-org" />);
    expect(screen.getByRole("status").textContent).toContain("Loading rule details...");
    expect(screen.getByRole("link", { name: "Back to Workflow Rules" }).getAttribute("href")).toBe(
      "/crm/test-org/settings/workflow-rules",
    );
  });
});
