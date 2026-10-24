import { createMemoryAutomationPort } from "@crm/core/automation";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { syntheticAssignmentRules } from "../automation/synthetic-fixture";
import { AssignmentRuleDetail } from "./assignment-rule-detail";
import { AssignmentRulesScreen } from "./assignment-rules-screen";

afterEach(cleanup);
const ctx = {
  orgId: "o",
  orgSlug: "synthetic",
  orgName: "Synthetic Populated",
  userId: "u",
  role: "admin" as const,
};
const port = createMemoryAutomationPort({ fixtures: { o: syntheticAssignmentRules } });

describe("populated Assignment list (AL1–AL5)", () => {
  it("renders rows with detail links and no write controls", async () => {
    const result = await port.list(ctx, { kind: "assignment", limit: 50 });
    render(<AssignmentRulesScreen result={result} orgSlug="synthetic" />);
    expect(screen.queryByTestId("assignment-introduction")).toBeNull();
    const link = screen.getByRole("link", { name: "Synthetic regional routing" });
    expect(link.getAttribute("href")).toBe(
      "/crm/synthetic/settings/assignment-rules/synthetic-rule-1",
    );
    expect(screen.getByText("Inactive")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create Assignment Rule" })).toBeNull();
  });
  it("shows a next-page link only when a cursor exists", async () => {
    const result = await port.list(ctx, { kind: "assignment", limit: 1 });
    render(<AssignmentRulesScreen result={result} orgSlug="synthetic" module="Leads" />);
    expect(screen.getByRole("link", { name: "Next page" }).getAttribute("href")).toContain(
      "module=Leads&cursor=",
    );
  });
  it("distinguishes filtered zero matches from the introduction", () => {
    render(
      <AssignmentRulesScreen
        result={{ ok: true, value: { items: [], nextCursor: null } }}
        module="Deals"
      />,
    );
    expect(screen.getByTestId("assignment-no-matches")).toBeTruthy();
    expect(screen.queryByTestId("assignment-introduction")).toBeNull();
  });
  it.each(["forbidden", "unavailable"] as const)("shows a %s state", (code) => {
    render(<AssignmentRulesScreen result={{ ok: false, error: { code } }} />);
    expect(screen.getByTestId(`assignment-list-${code}`)).toBeTruthy();
    expect(screen.queryByTestId("assignment-introduction")).toBeNull();
  });
});

describe("Assignment detail (AD1–AD7)", () => {
  it("renders ordered entries, recipients, distribution, availability and fallback", async () => {
    const result = await port.get(ctx, { kind: "assignment", id: "synthetic-rule-1" });
    render(<AssignmentRuleDetail result={result} listHref="/list" />);
    expect(screen.getByRole("heading", { name: "Synthetic regional routing" })).toBeTruthy();
    expect(screen.getByTestId("assignment-detail-status").textContent).toBe("Active");
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.map((r) => within(r).getAllByRole("cell")[0]?.textContent)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(rows[0]?.textContent).toContain("Round robin");
    expect(rows[0]?.textContent).toContain("Require available");
    expect(rows[0]?.textContent).toContain("synthetic-user-a, synthetic-user-b");
    expect(rows[0]?.textContent).toContain("${CURRENTUSER}");
    expect(rows[1]?.textContent).toContain("All records");
    expect(rows[1]?.textContent).toContain("Ignore availability");
    expect(rows[2]?.textContent).toContain("Definition: synthetic-definition-1");
    expect(rows[2]?.textContent).toContain("Unresolved");
    expect(screen.getByTestId("assignment-detail-fallback").textContent).toContain(
      "synthetic-group-a",
    );
    expect(screen.getByRole("link", { name: "Back to Assignment Rules" })).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("shows empty entries and null fallback explicitly", async () => {
    const result = await port.get(ctx, { kind: "assignment", id: "synthetic-rule-2" });
    render(<AssignmentRuleDetail result={result} listHref="/list" />);
    expect(screen.getByTestId("assignment-detail-no-entries")).toBeTruthy();
    expect(screen.getByTestId("assignment-detail-fallback").textContent).toContain(
      "No default recipient is configured.",
    );
  });
  it.each(["forbidden", "not_found", "unavailable"] as const)("shows %s", (code) => {
    render(<AssignmentRuleDetail result={{ ok: false, error: { code } }} listHref="/list" />);
    expect(screen.getByTestId(`assignment-detail-${code}`)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to Assignment Rules" })).toBeTruthy();
  });
});
