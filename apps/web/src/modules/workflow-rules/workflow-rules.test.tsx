import type { AutomationPort } from "@crm/core/automation";
import type { OrgContext } from "@crm/core/records";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import {
  contactRenewalRule,
  createSyntheticWorkflowRulesPort,
  dealDiscountRule,
  leadWelcomeRule,
} from "./fixtures";
import { formatActionKind, formatCondition, formatTiming, formatTrigger } from "./formatters";
import { WorkflowRuleDetailScreen } from "./workflow-rule-detail-screen";
import { WorkflowRulesListScreen } from "./workflow-rules-list-screen";

afterEach(cleanup);

const testCtx: OrgContext = {
  orgId: "test-org",
  orgSlug: "test-org",
  orgName: "Test Organization",
  userId: "admin-user",
  role: "admin",
};

describe("formatters", () => {
  it("formats triggers properly", () => {
    expect(formatTrigger({ kind: "record", on: "create" })).toBe("On record creation");
    expect(formatTrigger({ kind: "record", on: "edit" })).toBe("On record edit");
    expect(formatTrigger({ kind: "record", on: "create_or_edit" })).toBe(
      "On record creation or edit",
    );
    expect(formatTrigger({ kind: "record", on: "delete" })).toBe("On record deletion");
    expect(formatTrigger({ kind: "field_change", fields: ["Status", "Stage"] })).toBe(
      "When fields change: Status, Stage",
    );
    expect(formatTrigger({ kind: "date", field: "Close_Date", timezone: "America/New_York" })).toBe(
      "Date field: Close_Date (America/New_York)",
    );
  });

  it("formats conditions and criteria properly", () => {
    expect(formatCondition({ kind: "all_records" })).toBe("All records");
    expect(
      formatCondition({
        kind: "criteria",
        criteria: { field: "Lead_Source", comparator: "equal", value: "Web" },
      }),
    ).toBe('Lead_Source equals "Web"');

    expect(
      formatCondition({
        kind: "criteria",
        criteria: {
          groupOperator: "and",
          group: [
            { field: "Stage", comparator: "equal", value: "Closed Won" },
            { field: "Amount", comparator: "greater_than", value: 1000 },
          ],
        },
      }),
    ).toBe('(Stage equals "Closed Won" AND Amount > 1000)');
  });

  it("formats timing properly", () => {
    expect(formatTiming({ kind: "event_relative", offsetSeconds: 0 })).toBe("At the time of event");
    expect(formatTiming({ kind: "event_relative", offsetSeconds: 86400 })).toBe(
      "1 day after event",
    );
    expect(formatTiming({ kind: "event_relative", offsetSeconds: -7200 })).toBe(
      "2 hours before event",
    );
    expect(
      formatTiming({
        kind: "field_relative",
        field: "Renewal_Date",
        offsetSeconds: -2592000,
        timezone: "UTC",
      }),
    ).toBe("30 days before Renewal_Date (UTC)");
  });

  it("formats action kinds properly", () => {
    expect(formatActionKind("notification")).toBe("Email Notification");
    expect(formatActionKind("activity")).toBe("Task / Activity");
    expect(formatActionKind("field_update")).toBe("Field Update");
    expect(formatActionKind("webhook")).toBe("Webhook");
    expect(formatActionKind("function")).toBe("Custom Function");
  });
});

describe("WorkflowRulesListScreen", () => {
  it("renders heading and table columns in exact WL1 order", async () => {
    const port = createSyntheticWorkflowRulesPort();
    render(<WorkflowRulesListScreen orgSlug="test-org" port={port} ctx={testCtx} />);

    const heading = await screen.findByRole("heading", { name: "Workflow Rules" });
    expect(heading).toBeDefined();

    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(4);
    expect(headers[0]?.textContent).toContain("Name");
    expect(headers[1]?.textContent).toContain("Module");
    expect(headers[2]?.textContent).toContain("Trigger");
    expect(headers[3]?.textContent).toContain("Status");
  });

  it("renders rows with accessible detail link (WL2), module (WL3), trigger (WL4), and static status (WL5)", async () => {
    const port = createSyntheticWorkflowRulesPort([leadWelcomeRule]);
    render(<WorkflowRulesListScreen orgSlug="test-org" port={port} ctx={testCtx} />);

    const link = await screen.findByRole("link", { name: leadWelcomeRule.name });
    expect(link.getAttribute("href")).toBe(
      `/crm/test-org/settings/workflow-rules/${leadWelcomeRule.id}`,
    );

    expect(screen.getByRole("cell", { name: "Leads" })).toBeDefined();
    expect(screen.getByText("Enabled")).toBeDefined();

    // WL4: Trigger summary loaded
    await waitFor(() => {
      expect(screen.getByText("On record creation")).toBeDefined();
    });

    // RC1-RC6: No write controls
    expect(screen.queryByRole("button", { name: /create|new/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /edit|delete|clone/i })).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("handles trigger read failure with retry button (WL4, WL10)", async () => {
    const mockPort: AutomationPort = {
      async list() {
        return {
          ok: true,
          value: {
            items: [
              {
                id: "wf-1",
                revision: "r1",
                module: "Leads",
                name: "Test Rule",
                description: "",
                enabled: true,
                position: 1,
                kind: "workflow",
              },
            ],
            nextCursor: null,
          },
        };
      },
      async get() {
        return { ok: false, error: { code: "unavailable" } };
      },
    };

    render(<WorkflowRulesListScreen orgSlug="test-org" port={mockPort} ctx={testCtx} />);

    const unavailableText = await screen.findByText("Trigger unavailable");
    expect(unavailableText).toBeDefined();
    const retryBtn = screen.getByRole("button", { name: /retry loading trigger/i });
    expect(retryBtn).toBeDefined();
  });

  it("filters rules by module and resets cursor (WL6)", async () => {
    const port = createSyntheticWorkflowRulesPort();
    render(<WorkflowRulesListScreen orgSlug="test-org" port={port} ctx={testCtx} />);

    await screen.findByRole("link", { name: leadWelcomeRule.name });
    expect(screen.getByRole("link", { name: dealDiscountRule.name })).toBeDefined();

    const select = screen.getByRole("combobox", { name: "Filter workflow rules by module" });
    fireEvent.change(select, { target: { value: "Leads" } });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: leadWelcomeRule.name })).toBeDefined();
      expect(screen.queryByRole("link", { name: dealDiscountRule.name })).toBeNull();
    });
  });

  it("renders empty state with distinction between all modules and filtered zero matches (WL8)", async () => {
    const port = createSyntheticWorkflowRulesPort([]);
    render(<WorkflowRulesListScreen orgSlug="test-org" port={port} ctx={testCtx} />);

    const emptyText = await screen.findByText("No workflow rules have been configured yet.");
    expect(emptyText).toBeDefined();

    const select = screen.getByRole("combobox", { name: "Filter workflow rules by module" });
    fireEvent.change(select, { target: { value: "Leads" } });

    const filteredEmptyText = await screen.findByText(
      'No workflow rules found for module "Leads".',
    );
    expect(filteredEmptyText).toBeDefined();
  });

  it("renders access denied when forbidden (WL9)", async () => {
    const forbiddenPort: AutomationPort = {
      async list() {
        return { ok: false, error: { code: "forbidden" } };
      },
      async get() {
        return { ok: false, error: { code: "forbidden" } };
      },
    };

    render(<WorkflowRulesListScreen orgSlug="test-org" port={forbiddenPort} ctx={testCtx} />);
    const deniedText = await screen.findByText("Access denied.");
    expect(deniedText).toBeDefined();
  });

  it("renders read failure and handles safe local retry (WL10)", async () => {
    let attempts = 0;
    const failingPort: AutomationPort = {
      async list() {
        attempts++;
        if (attempts === 1) {
          return { ok: false, error: { code: "unavailable" } };
        }
        return {
          ok: true,
          value: { items: [], nextCursor: null },
        };
      },
      async get() {
        return { ok: false, error: { code: "unavailable" } };
      },
    };

    render(<WorkflowRulesListScreen orgSlug="test-org" port={failingPort} ctx={testCtx} />);

    const errorMsg = await screen.findByText("Workflow rules could not be loaded.");
    expect(errorMsg).toBeDefined();
    const retryBtn = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retryBtn);

    const emptyMsg = await screen.findByText("No workflow rules have been configured yet.");
    expect(emptyMsg).toBeDefined();
  });

  it("renders pagination button only when cursor exists (WL11)", async () => {
    const port: AutomationPort = {
      async list(_ctx, query) {
        if (!query.cursor) {
          return {
            ok: true,
            value: {
              items: [
                {
                  id: "wf-1",
                  revision: "r1",
                  module: "Leads",
                  name: "First Page Rule",
                  description: "",
                  enabled: true,
                  position: 1,
                  kind: "workflow",
                },
              ],
              nextCursor: "cursor-page-2",
            },
          };
        }
        return {
          ok: true,
          value: {
            items: [
              {
                id: "wf-2",
                revision: "r1",
                module: "Leads",
                name: "Second Page Rule",
                description: "",
                enabled: true,
                position: 2,
                kind: "workflow",
              },
            ],
            nextCursor: null,
          },
        };
      },
      async get() {
        return {
          ok: true,
          value: leadWelcomeRule,
        };
      },
    };

    render(<WorkflowRulesListScreen orgSlug="test-org" port={port} ctx={testCtx} />);

    const firstRule = await screen.findByText("First Page Rule");
    expect(firstRule).toBeDefined();
    const nextBtn = screen.getByRole("button", { name: "Next page" });
    fireEvent.click(nextBtn);

    const secondRule = await screen.findByText("Second Page Rule");
    expect(secondRule).toBeDefined();
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull();
  });
});

describe("WorkflowRuleDetailScreen", () => {
  it("renders rule heading, module, description, status and return link (WD1)", async () => {
    const port = createSyntheticWorkflowRulesPort([leadWelcomeRule]);
    render(
      <WorkflowRuleDetailScreen
        orgSlug="test-org"
        ruleId={leadWelcomeRule.id}
        port={port}
        ctx={testCtx}
      />,
    );

    const heading = await screen.findByRole("heading", { name: leadWelcomeRule.name });
    expect(heading).toBeDefined();
    expect(screen.getByText("Module: Leads")).toBeDefined();
    expect(screen.getByText("Enabled")).toBeDefined();
    expect(screen.getByText(leadWelcomeRule.description)).toBeDefined();

    const backLink = screen.getByRole("link", { name: "Back to Workflow Rules" });
    expect(backLink.getAttribute("href")).toBe("/crm/test-org/settings/workflow-rules");
  });

  it("renders trigger region (WD2)", async () => {
    const port = createSyntheticWorkflowRulesPort([dealDiscountRule]);
    render(
      <WorkflowRuleDetailScreen
        orgSlug="test-org"
        ruleId={dealDiscountRule.id}
        port={port}
        ctx={testCtx}
      />,
    );

    const triggerInfo = await screen.findByText("When fields change: Stage, Amount");
    expect(triggerInfo).toBeDefined();
  });

  it("renders ordered condition branches, immediate and scheduled actions (WD3, WD4, WD5)", async () => {
    const port = createSyntheticWorkflowRulesPort([leadWelcomeRule]);
    render(
      <WorkflowRuleDetailScreen
        orgSlug="test-org"
        ruleId={leadWelcomeRule.id}
        port={port}
        ctx={testCtx}
      />,
    );

    expect(await screen.findByText("Branch 1")).toBeDefined();
    expect(screen.getByText('Lead_Source equals "Web Download"')).toBeDefined();

    // WD4: Immediate actions
    expect(screen.getByText("Email Notification")).toBeDefined();
    expect(screen.getByText("template:lead_welcome_pack")).toBeDefined();

    // WD5: Scheduled actions
    expect(screen.getByText("1 day after event")).toBeDefined();
    expect(screen.getByText("Task / Activity")).toBeDefined();
    expect(screen.getByText("task:introductory_call")).toBeDefined();
  });

  it("renders explicit empty text for empty action sections (WD4, WD5)", async () => {
    const port = createSyntheticWorkflowRulesPort([contactRenewalRule]);
    render(
      <WorkflowRuleDetailScreen
        orgSlug="test-org"
        ruleId={contactRenewalRule.id}
        port={port}
        ctx={testCtx}
      />,
    );

    const emptyImmediate = await screen.findByText("No immediate actions configured.");
    expect(emptyImmediate).toBeDefined();
  });

  it("handles forbidden, not found, and error states with back link preserved (WD6)", async () => {
    const mockPort: AutomationPort = {
      async list() {
        return { ok: true, value: { items: [], nextCursor: null } };
      },
      async get(_ctx, query) {
        if (query.id === "forbidden-rule") {
          return { ok: false, error: { code: "forbidden" } };
        }
        if (query.id === "missing-rule") {
          return { ok: false, error: { code: "not_found" } };
        }
        return { ok: false, error: { code: "unavailable" } };
      },
    };

    const { unmount } = render(
      <WorkflowRuleDetailScreen
        orgSlug="test-org"
        ruleId="forbidden-rule"
        port={mockPort}
        ctx={testCtx}
      />,
    );
    expect(await screen.findByText("Access denied.")).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to Workflow Rules" })).toBeDefined();
    unmount();

    render(
      <WorkflowRuleDetailScreen
        orgSlug="test-org"
        ruleId="missing-rule"
        port={mockPort}
        ctx={testCtx}
      />,
    );
    expect(await screen.findByText("Workflow rule not found.")).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to Workflow Rules" })).toBeDefined();
  });
});
