import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import type { ClientRecordService } from "@/lib/api/client/http-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { readRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import { AccountRecordScreen } from "./account-record-screen";
import { accountsScreenDefinition } from "./definition";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

const ctx = {
  orgId: "account-screen-org",
  orgSlug: "account-screen-org",
  orgName: "Account Screen Org",
  userId: "account-screen-user",
  role: "admin" as const,
};

const paths = {
  defaultList: (orgSlug: string, module: string) => `/crm/${orgSlug}/tab/${module}/list`,
  record: (orgSlug: string, module: string, recordId: string) =>
    `/crm/${orgSlug}/tab/${module}/${recordId}`,
  edit: (orgSlug: string, module: string, recordId: string) =>
    `/crm/${orgSlug}/tab/${module}/${recordId}/edit`,
  clone: (orgSlug: string, module: string, recordId: string) =>
    `/crm/${orgSlug}/tab/${module}/${recordId}/clone`,
  merge: (orgSlug: string, module: string, recordId: string) =>
    `/crm/${orgSlug}/tab/${module}/${recordId}/merge`,
};

function createService(): ClientRecordService {
  return createClientRecordService(createFixtureRecordService(ctx), {
    listUsers: async () => [
      { userId: ctx.userId, name: "Screen User", email: "screen@example.test" },
    ],
  });
}

function renderScreen(service: ClientRecordService, recordId: string) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        {children}
      </ApiProvider>
    );
  }
  return render(
    <div>
      <AccountRecordScreen
        definition={accountsScreenDefinition}
        orgSlug={ctx.orgSlug}
        recordId={recordId}
        paths={paths}
      />
    </div>,
    { wrapper: Wrapper },
  );
}

beforeEach(() => {
  navigation.push.mockReset();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

afterEach(cleanup);

describe("AccountRecordScreen with real RecordDetailScreen", () => {
  it("keeps Member Accounts rail link and Add action active without data-later-module", async () => {
    const user = userEvent.setup();
    const service = createService();
    renderScreen(service, "500000000000000000");

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Related List" })).toBeTruthy();
    });

    const rail = screen.getByRole("navigation", { name: "Related List" });

    // 1. Member Accounts rail link has NO data-later-module and is not aria-disabled
    const memberAccountsLink = within(rail).getByRole("link", { name: "Member Accounts" });
    expect(memberAccountsLink.getAttribute("data-later-module")).toBeNull();
    expect(memberAccountsLink.getAttribute("aria-disabled")).toBeNull();

    // 2. Clicking Member Accounts rail link selects it
    await user.click(memberAccountsLink);

    // 3. The rail action (Add) button appears and has NO data-later-module
    const memberAccountsRow = memberAccountsLink.closest("div[class*='flex items-center']");
    const addButton = memberAccountsRow?.querySelector("button");
    expect(addButton).not.toBeNull();
    expect(addButton?.getAttribute("data-later-module")).toBeNull();
    expect(addButton?.getAttribute("aria-disabled")).toBeNull();

    // 4. Clicking Add calls router.push to create child account with parent account lookup
    expect(addButton).toBeTruthy();
    if (!addButton) throw new Error("addButton missing");
    await user.click(addButton);
    expect(navigation.push).toHaveBeenCalledWith("/crm/account-screen-org/tab/Accounts/create");
    const prefill = readRecordCreatePrefill(ctx.orgSlug, "Accounts");
    expect(prefill?.fields.Parent_Account).toMatchObject({
      module: "Accounts",
      id: "500000000000000000",
    });

    // 5. Deals is live (MEP-415); Products is a later module and stays locked
    const dealsLink = within(rail).getByRole("link", { name: "Deals" });
    expect(dealsLink.getAttribute("data-later-module")).toBeNull();
    expect(dealsLink.getAttribute("aria-disabled")).toBeNull();

    const productsLink = within(rail).getByRole("link", { name: "Products" });
    expect(productsLink.getAttribute("data-later-module")).toBe("P2");
    expect(productsLink.getAttribute("aria-disabled")).toBe("true");
  });

  it("lists the account deals in the card and opens the prefilled create form", async () => {
    const user = userEvent.setup();
    const service = createService();
    renderScreen(service, "500000000000000000");

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Related List" })).toBeTruthy();
    });

    // AD-114: the card lists the Deals whose Account Name is this account, Deal Name links to detail
    const dealsCard = screen.getByRole("region", { name: "Deals" });
    await waitFor(() => {
      expect(within(dealsCard).getByRole("link", { name: "Deal 001" })).toBeTruthy();
    });
    expect(within(dealsCard).getByRole("columnheader", { name: "Deal Name" })).toBeTruthy();
    const dealLink = within(dealsCard).getByRole("link", { name: "Deal 001" });
    expect(dealLink.getAttribute("href")).toBe(
      "/crm/account-screen-org/tab/Deals/700000000000000000",
    );

    // New Deal opens the Deal create route with Account Name prefilled
    await user.click(within(dealsCard).getByRole("button", { name: "New Deal" }));
    expect(navigation.push).toHaveBeenCalledWith("/crm/account-screen-org/tab/Deals/create");
    const prefill = readRecordCreatePrefill(ctx.orgSlug, "Deals");
    expect(prefill?.fields.Account_Name).toMatchObject({
      module: "Accounts",
      id: "500000000000000000",
    });

    // AD-112: the rail plus for the selected Deals row opens the same form
    navigation.push.mockClear();
    const rail = screen.getByRole("navigation", { name: "Related List" });
    const dealsRailLink = within(rail).getByRole("link", { name: "Deals" });
    await user.click(dealsRailLink);
    const dealsRow = dealsRailLink.closest("div[class*='flex items-center']");
    const addButton = dealsRow?.querySelector("button");
    expect(addButton).toBeTruthy();
    if (!addButton) throw new Error("Deals rail plus missing");
    await user.click(addButton);
    expect(navigation.push).toHaveBeenCalledWith("/crm/account-screen-org/tab/Deals/create");
  });

  it("shows the Deals card empty state for an account without deals", async () => {
    const service = createService();
    renderScreen(service, "500000000000000249");

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Related List" })).toBeTruthy();
    });

    const dealsCard = screen.getByRole("region", { name: "Deals" });
    await waitFor(() => {
      expect(within(dealsCard).getByText("No records found")).toBeTruthy();
    });
    expect(within(dealsCard).queryByRole("table")).toBeNull();
    // Zero records draw no rail badge.
    const rail = screen.getByRole("navigation", { name: "Related List" });
    expect(within(rail).getByRole("link", { name: "Deals" })).toBeTruthy();
  });

  it("does not mount ContactHierarchyModal when closed, mounts on Hierarchy View click, and unmounts on close", async () => {
    const user = userEvent.setup();
    const service = createService();
    renderScreen(service, "500000000000000000");

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Related List" })).toBeTruthy();
    });

    // 1. Modal is not mounted when closed
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Contact Hierarchy")).toBeNull();

    // 2. Click Hierarchy View in Contacts card
    const hierarchyButton = screen.getByRole("button", { name: "Hierarchy View" });
    await user.click(hierarchyButton);

    // 3. Modal is now mounted
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
    expect(screen.getByText("Contact Hierarchy")).toBeTruthy();

    // 4. Close modal
    const closeButton = screen.getByRole("button", { name: "Close Modal" });
    await user.click(closeButton);

    // 5. Modal is unmounted
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
