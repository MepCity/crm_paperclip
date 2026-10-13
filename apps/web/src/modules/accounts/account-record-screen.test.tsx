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

    // 5. Later module rail links (Deals M4, Products P2) remain locked with data-later-module
    const dealsLink = within(rail).getByRole("link", { name: "Deals" });
    expect(dealsLink.getAttribute("data-later-module")).toBe("M4");
    expect(dealsLink.getAttribute("aria-disabled")).toBe("true");

    const productsLink = within(rail).getByRole("link", { name: "Products" });
    expect(productsLink.getAttribute("data-later-module")).toBe("P2");
    expect(productsLink.getAttribute("aria-disabled")).toBe("true");
  });
});
