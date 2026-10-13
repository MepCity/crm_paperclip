import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { accountsScreenDefinition } from "@/modules/accounts/definition";
import { leadsScreenDefinition } from "@/modules/leads/definition";
import type { ModuleScreenDefinition } from "@/modules/types";
import { MergeDuplicatesScreen } from "./merge-duplicates-screen";

const ctx = {
  orgId: "merge-screen-org",
  orgSlug: "merge-screen-org",
  orgName: "Merge Org",
  userId: "merge-user",
  role: "admin" as const,
};

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

function wrapper(service: ReturnType<typeof createClientRecordService>) {
  return function Provider({ children }: { children: ReactNode }) {
    return (
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        {children}
      </ApiProvider>
    );
  };
}

const paths = {
  record: (orgSlug: string, module: string, id: string) => `/${orgSlug}/${module}/${id}`,
  defaultList: (orgSlug: string, module: string) => `/${orgSlug}/${module}`,
};

const stubMergeDefinition: ModuleScreenDefinition = {
  ...leadsScreenDefinition,
  merge: {
    criterionFields: ["Email"],
    matchingColumns: ["Full_Name", "Email"],
  },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MergeDuplicatesScreen", () => {
  let service: ReturnType<typeof createClientRecordService>;
  let sourceId: string;

  beforeEach(async () => {
    service = createClientRecordService(createFixtureRecordService(ctx), {
      listUsers: async () => [
        { userId: ctx.userId, name: "Merge User", email: "merge@example.test" },
      ],
    });
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const leadId = page.records[0]?.id;
    if (!leadId) throw new Error("Missing fixture lead.");
    sourceId = leadId;
  });

  it("opens compare with selections from two result pages", async () => {
    const extraPage1 = {
      id: "merge-page1-extra",
      fields: { Full_Name: "Page One Extra", Email: "merge-cross@test", Company: "Acme" },
    };
    const extraPage2 = {
      id: "merge-page2-extra",
      fields: { Full_Name: "Page Two Extra", Email: "merge-cross@test", Company: "Acme" },
    };
    const realList = service.list.bind(service);
    const listSpy = vi.spyOn(service, "list").mockImplementation(async (module, query) => {
      const base = await realList(module, query);
      if (query.page === 1) {
        return { ...base, records: [extraPage1], moreRecords: true };
      }
      return { ...base, records: [extraPage2], page: 2, moreRecords: false };
    });

    const user = userEvent.setup();
    render(
      <MergeDuplicatesScreen
        orgSlug={ctx.orgSlug}
        recordId={sourceId}
        definition={leadsScreenDefinition}
        paths={paths}
      />,
      { wrapper: wrapper(service) },
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Find and Merge Duplicates" })).toBeTruthy(),
    );

    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(listSpy).toHaveBeenCalled());

    const matchingTable = screen.getByRole("table", { name: "Matching records" });
    await user.click(within(matchingTable).getByRole("checkbox", { name: "Page One Extra" }));

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() =>
      expect(within(matchingTable).getByRole("checkbox", { name: "Page Two Extra" })).toBeTruthy(),
    );
    await user.click(within(matchingTable).getByRole("checkbox", { name: "Page Two Extra" }));

    await user.click(screen.getByRole("button", { name: /^Next$/ }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Merge Records" })).toBeTruthy();
    });
    expect(document.querySelector('[data-merge-step="compare"]')).toBeTruthy();
    expect(screen.getAllByText("Page One Extra").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Page Two Extra").length).toBeGreaterThan(0);
  });

  it("renders criterion rows from a stub module merge definition", async () => {
    render(
      <MergeDuplicatesScreen
        orgSlug={ctx.orgSlug}
        recordId={sourceId}
        definition={stubMergeDefinition}
        paths={paths}
      />,
      { wrapper: wrapper(service) },
    );

    await waitFor(() => {
      const criteria = screen.getByLabelText("Search criteria");
      expect(within(criteria).getAllByRole("listitem")).toHaveLength(1);
      expect(within(criteria).queryByText("First Name")).toBeNull();
      expect(within(criteria).queryByText("Company")).toBeNull();
    });
  });

  it("does not search when merge definition is missing", async () => {
    const accountViews = await service.listViews("Accounts");
    const accountView = accountViews.find((item) => item.isDefault);
    if (!accountView) throw new Error("Missing default account view.");
    const accountPage = await service.list("Accounts", {
      viewId: accountView.id,
      page: 1,
      perPage: 30,
    });
    const accountId = accountPage.records[0]?.id;
    if (!accountId) throw new Error("Missing fixture account.");

    const listSpy = vi.spyOn(service, "list");
    render(
      <MergeDuplicatesScreen
        orgSlug={ctx.orgSlug}
        recordId={accountId}
        definition={accountsScreenDefinition}
        paths={paths}
      />,
      { wrapper: wrapper(service) },
    );

    await waitFor(() =>
      expect(screen.getByText("Find and merge is not available for this module.")).toBeTruthy(),
    );
    expect(listSpy).not.toHaveBeenCalled();
  });

  it("resets selection to source record on Clear and new Search", async () => {
    const extraRecord = {
      id: "merge-reset-extra",
      fields: { Full_Name: "Reset Extra", Email: "reset@test", Company: "Acme" },
    };
    const realList = service.list.bind(service);
    vi.spyOn(service, "list").mockImplementation(async (module, query) => {
      const base = await realList(module, query);
      return { ...base, records: [extraRecord], moreRecords: false };
    });

    const user = userEvent.setup();
    render(
      <MergeDuplicatesScreen
        orgSlug={ctx.orgSlug}
        recordId={sourceId}
        definition={leadsScreenDefinition}
        paths={paths}
      />,
      { wrapper: wrapper(service) },
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Find and Merge Duplicates" })).toBeTruthy(),
    );

    await user.click(screen.getByRole("button", { name: "Search" }));
    const matchingTable = await screen.findByRole("table", { name: "Matching records" });

    const nextButton = screen.getByRole("button", { name: /^Next$/ });
    expect(nextButton.hasAttribute("disabled")).toBe(true);

    await user.click(within(matchingTable).getByRole("checkbox", { name: "Reset Extra" }));
    expect(nextButton.hasAttribute("disabled")).toBe(false);

    await user.click(screen.getByRole("link", { name: "Clear" }));
    expect(nextButton.hasAttribute("disabled")).toBe(true);

    // Select again, then click Search to verify search resets selection
    await user.click(within(matchingTable).getByRole("checkbox", { name: "Reset Extra" }));
    expect(nextButton.hasAttribute("disabled")).toBe(false);

    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(nextButton.hasAttribute("disabled")).toBe(true);
  });
});
