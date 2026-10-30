import type { AutomationPort } from "@crm/core/automation";
import type { OrgContext } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { createAutomationPort } from "../automation/port";
import { leadWelcomeRule } from "../automation/synthetic-workflow-fixture";
import { readWorkflowRule, readWorkflowRules } from "./reads";

const ctx: OrgContext = {
  orgId: "workflow-org",
  orgSlug: "workflow",
  orgName: "Synthetic Populated Workflow",
  userId: "admin",
  role: "admin",
};

describe("server workflow reads", () => {
  it("returns synthetic workflows only for opted-in organizations", async () => {
    const port = createAutomationPort();
    const populated = await readWorkflowRules(port, ctx, {});
    expect(populated.result.ok && populated.result.value.items).toHaveLength(4);
    expect(populated.triggerResults[leadWelcomeRule.id]).toEqual({
      ok: true,
      value: leadWelcomeRule,
    });
    const emptyCtx = { ...ctx, orgId: "empty-org", orgName: "Ordinary organization" };
    expect((await readWorkflowRules(port, emptyCtx, {})).result).toEqual({
      ok: true,
      value: { items: [], nextCursor: null },
    });
    expect(await readWorkflowRule(port, emptyCtx, leadWelcomeRule.id)).toEqual({
      ok: false,
      error: { code: "not_found" },
    });
  });
  it("never exposes another tenant's rule through list or detail", async () => {
    const port = createAutomationPort({ fixtures: { [ctx.orgId]: [leadWelcomeRule] } });
    const other = { ...ctx, orgId: "other-org" };
    expect((await readWorkflowRules(port, other, {})).result).toEqual({
      ok: true,
      value: { items: [], nextCursor: null },
    });
    expect(await readWorkflowRule(port, other, leadWelcomeRule.id)).toEqual({
      ok: false,
      error: { code: "not_found" },
    });
  });
  it("filters on the server and preserves unknown-id results", async () => {
    expect(
      (await readWorkflowRules(createAutomationPort(), ctx, { module: "Leads" })).result,
    ).toMatchObject({ ok: true, value: { items: [{ id: leadWelcomeRule.id }] } });
    expect(await readWorkflowRule(createAutomationPort(), ctx, "missing")).toEqual({
      ok: false,
      error: { code: "not_found" },
    });
  });
  it("preserves admin-only access and rejects a wrong-kind detail", async () => {
    const member = { ...ctx, role: "member" as const };
    expect((await readWorkflowRules(createAutomationPort(), member, {})).result).toEqual({
      ok: false,
      error: { code: "forbidden" },
    });
    expect(await readWorkflowRule(createAutomationPort(), member, leadWelcomeRule.id)).toEqual({
      ok: false,
      error: { code: "forbidden" },
    });
    const wrongKind: AutomationPort = {
      list: async () => ({ ok: true, value: { items: [], nextCursor: null } }),
      get: async () => ({
        ok: true,
        value: { ...leadWelcomeRule, kind: "assignment", entries: [], fallback: null },
      }),
    };
    expect(await readWorkflowRule(wrongKind, ctx, leadWelcomeRule.id)).toEqual({
      ok: false,
      error: { code: "unavailable" },
    });
  });
  it("preserves read failures and catches rejected reads", async () => {
    const port = createAutomationPort({ inject: () => ({ code: "unavailable" }) });
    expect((await readWorkflowRules(port, ctx, {})).result).toEqual({
      ok: false,
      error: { code: "unavailable" },
    });
    expect(await readWorkflowRule(port, ctx, leadWelcomeRule.id)).toEqual({
      ok: false,
      error: { code: "unavailable" },
    });
    const rejecting: AutomationPort = {
      list: async () => {
        throw Error("read");
      },
      get: async () => {
        throw Error("read");
      },
    };
    expect((await readWorkflowRules(rejecting, ctx, {})).result).toEqual({
      ok: false,
      error: { code: "unavailable" },
    });
    expect(await readWorkflowRule(rejecting, ctx, "missing")).toEqual({
      ok: false,
      error: { code: "unavailable" },
    });
  });
});
