import { createMemoryAutomationPort } from "@crm/core/automation";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AssignmentRulesPage from "../../app/crm/[orgSlug]/settings/assignment-rules/page";
import { syntheticAssignmentRules } from "../automation/synthetic-fixture";

const ctx = { orgId: "o", orgSlug: "synthetic", orgName: "S", userId: "u", role: "admin" as const };
const memory = createMemoryAutomationPort({ fixtures: { o: syntheticAssignmentRules } });
const list = vi.fn();

vi.mock("@/lib/session", () => ({ requireOrgContext: async () => ctx }));
vi.mock("@/components/shell/page-title", () => ({ PageTitle: () => null }));
vi.mock("@/modules/automation/port", () => ({ createAutomationPort: () => ({ list }) }));

afterEach(() => {
  cleanup();
  list.mockReset();
});

const renderPage = async () => {
  const el = await AssignmentRulesPage({
    params: Promise.resolve({ orgSlug: "synthetic" }),
    searchParams: Promise.resolve({}),
  });
  return render(el);
};

describe("Assignment list retry recovery (AL5)", () => {
  it("retry link re-runs the page's server list read and recovers", async () => {
    list
      .mockResolvedValueOnce({ ok: false, error: { code: "unavailable" } })
      .mockImplementationOnce((c, q) => memory.list(c, q));
    const first = await renderPage();
    const retry = screen.getByRole("link", { name: "Try again" });
    expect(list).toHaveBeenCalledTimes(1);
    // Follow the real link: a full-page GET re-renders the same route.
    expect(retry.getAttribute("href")).toBe("/crm/synthetic/settings/assignment-rules");
    fireEvent.click(retry);
    first.unmount();
    await renderPage();
    expect(list).toHaveBeenCalledTimes(2);
    expect(list.mock.calls[1]?.[1]).toMatchObject({ kind: "assignment", limit: 50 });
    expect(screen.queryByRole("link", { name: "Try again" })).toBeNull();
    expect(screen.getByRole("link", { name: "Synthetic regional routing" })).toBeTruthy();
  });
});
