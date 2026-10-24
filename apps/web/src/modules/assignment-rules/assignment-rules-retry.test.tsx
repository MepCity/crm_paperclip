import { createMemoryAutomationPort } from "@crm/core/automation";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    // Minimal route dispatcher: a click on a plain link does a "full-page GET" of
    // its href, re-running the page function. Only the click triggers the 2nd read.
    let mounted = first;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      e.preventDefault();
      expect(a.getAttribute("href")).toBe("/crm/synthetic/settings/assignment-rules");
      mounted.unmount();
      void renderPage().then((r) => {
        mounted = r;
      });
    };
    document.addEventListener("click", onClick);
    try {
      fireEvent.click(retry);
      await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
      await screen.findByRole("link", { name: "Synthetic regional routing" });
    } finally {
      document.removeEventListener("click", onClick);
    }
    expect(list.mock.calls[1]?.[1]).toMatchObject({ kind: "assignment", limit: 50 });
    expect(screen.queryByRole("link", { name: "Try again" })).toBeNull();
    expect(screen.getByRole("link", { name: "Synthetic regional routing" })).toBeTruthy();
  });
});
