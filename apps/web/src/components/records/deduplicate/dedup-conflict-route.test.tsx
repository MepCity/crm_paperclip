import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts, ToastProvider } from "@/components/ui/toast";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { UnexpectedApiError } from "@/lib/api/wire/errors";
import { moduleListDefaultPath } from "@/lib/crm-paths";
import { leadsScreenDefinition } from "@/modules/leads/definition";
import { render } from "@/test/render";
import { DedupConflictRoute } from "./dedup-conflict-route";

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Org",
  userId: "user-1",
  role: "admin" as const,
};

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));

const LIST_HREF = moduleListDefaultPath(ctx.orgSlug, leadsScreenDefinition.tab);
let fixtureOrgSequence = 0;
let records: ReturnType<typeof createFixtureRecordService>;
let service: ReturnType<typeof createClientRecordService>;

beforeEach(() => {
  ctx.orgId = `dedup-route-${++fixtureOrgSequence}`;
  records = createFixtureRecordService(ctx);
  service = createClientRecordService(records, {
    listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
  });
  navigation.params = new URLSearchParams({ fields: "Email" });
});

afterEach(() => {
  cleanup();
  clearToasts();
  navigation.push.mockClear();
  navigation.replace.mockClear();
  navigation.params = new URLSearchParams();
  vi.restoreAllMocks();
});

function renderRoute() {
  render(
    <ToastProvider>
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        <DedupConflictRoute orgSlug={ctx.orgSlug} definition={leadsScreenDefinition} />
      </ApiProvider>
    </ToastProvider>,
  );
}

async function createConflictPair(email: string) {
  await records.create("Leads", {
    First_Name: "Ada",
    Last_Name: "Lovelace",
    Company: "Analytical Engine",
    Email: email,
    Phone: "111-000",
  });
  await records.create("Leads", {
    First_Name: "Ada",
    Last_Name: "Lovelace",
    Company: "Analytical Engine",
    Email: email,
    Phone: "222-000",
  });
}

function groupTable() {
  return screen.getByRole("table", { name: "Duplicate groups with conflicts" });
}

describe("DedupConflictRoute", () => {
  it("shows the error notice with a retry when the module metadata is rejected", async () => {
    const user = userEvent.setup();
    const email = "route-rejected-metadata@example.test";
    await createConflictPair(email);
    const metadata = vi
      .spyOn(service, "getModule")
      .mockRejectedValueOnce(new UnexpectedApiError(400));
    renderRoute();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "The page could not be loaded. Please try again.",
    );
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(screen.queryByRole("table", { name: "Duplicate groups with conflicts" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getByText(email)).toBeTruthy());
    expect(groupTable()).toBeTruthy();
    expect(metadata).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("returns to the module list when the metadata offers no requested field", async () => {
    navigation.params = new URLSearchParams({ fields: "Unknown_Field" });
    renderRoute();
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(LIST_HREF));
  });

  it("shows the conflict groups when the metadata resolves the requested field", async () => {
    const email = "route-success@example.test";
    await createConflictPair(email);
    renderRoute();

    await waitFor(() => expect(screen.getByText(email)).toBeTruthy());
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
