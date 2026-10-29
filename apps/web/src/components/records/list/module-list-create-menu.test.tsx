import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { accountsListPageConfig } from "@/modules/accounts/list-config";
import { callsListPageConfig } from "@/modules/calls/list-config";
import { campaignsListPageConfig } from "@/modules/campaigns/list-config";
import { casesListPageConfig } from "@/modules/cases/list-config";
import { contactsListPageConfig } from "@/modules/contacts/list-config";
import { dealsListPageConfig } from "@/modules/deals/list-config";
import { leadsListPageConfig } from "@/modules/leads/list-config";
import { meetingsListPageConfig } from "@/modules/meetings/list-config";
import { solutionsListPageConfig } from "@/modules/solutions/list-config";
import { tasksListPageConfig } from "@/modules/tasks/list-config";
import { ModuleListScreen } from "./module-list-screen";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Org",
  userId: "user-1",
  role: "admin" as const,
};

afterEach(() => {
  cleanup();
  navigation.push.mockClear();
});

function renderScreen(config: typeof leadsListPageConfig) {
  const service = createClientRecordService(createFixtureRecordService(ctx), {
    listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
  });
  const Provider = ({ children }: { children: ReactNode }) => (
    <ApiProvider orgSlug={ctx.orgSlug} service={service}>
      {children}
    </ApiProvider>
  );
  render(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} />, { wrapper: Provider });
}

describe("Create button chevron menu", () => {
  it.each([
    ["Leads", leadsListPageConfig, "Import Leads"],
    ["Contacts", contactsListPageConfig, "Import Contacts"],
    ["Accounts", accountsListPageConfig, "Import Accounts"],
    ["Deals", dealsListPageConfig, "Import Deals"],
    ["Campaigns", campaignsListPageConfig, "Import Campaigns"],
    ["Tasks", tasksListPageConfig, "Import Tasks"],
    ["Meetings", meetingsListPageConfig, "Import Meetings"],
    ["Calls", callsListPageConfig, "Import Calls"],
    ["Solutions", solutionsListPageConfig, "Import Solutions"],
    ["Cases", casesListPageConfig, "Import Cases"],
  ])(
    "opens on the first click for %s and navigates to the import page",
    async (_name, config, label) => {
      const user = userEvent.setup();
      renderScreen(config as typeof leadsListPageConfig);
      const more = await screen.findByRole("button", { name: "More" });
      await user.click(more);
      const item = await screen.findByRole("menuitem", { name: label });
      await user.click(item);
      await waitFor(() => expect(navigation.push).toHaveBeenCalledTimes(1));
      expect(String(navigation.push.mock.calls[0]?.[0])).toMatch(/\/import$/);
    },
  );

  it("closes on a second click of the chevron and reopens on a third", async () => {
    const user = userEvent.setup();
    renderScreen(leadsListPageConfig);
    const more = await screen.findByRole("button", { name: "More" });
    await user.click(more);
    expect(await screen.findByRole("menu")).toBeTruthy();
    await user.click(more);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    await user.click(more);
    expect(await screen.findByRole("menu")).toBeTruthy();
  });
});
