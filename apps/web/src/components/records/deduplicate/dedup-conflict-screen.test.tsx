import type { FieldDefinition } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts, ToastProvider } from "@/components/ui/toast";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { render } from "@/test/render";
import { DedupConflictGroups } from "./dedup-conflict-screen";

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

const LIST_HREF = "/crm/org-1/Leads/list";
let fixtureOrgSequence = 0;
let records: ReturnType<typeof createFixtureRecordService>;
let service: ReturnType<typeof createClientRecordService>;
let leadsFields: readonly FieldDefinition[];

beforeEach(async () => {
  ctx.orgId = `dedup-groups-${++fixtureOrgSequence}`;
  records = createFixtureRecordService(ctx);
  service = createClientRecordService(records, {
    listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
  });
  leadsFields = (await service.getModule("Leads")).fields;
});

afterEach(() => {
  cleanup();
  clearToasts();
  navigation.push.mockClear();
  navigation.replace.mockClear();
  vi.restoreAllMocks();
});

function renderScreen(apiNames: readonly string[]) {
  render(
    <ToastProvider>
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        <DedupConflictGroups
          module="Leads"
          pluralLabel="Leads"
          linkField="Full_Name"
          fields={leadsFields}
          apiNames={apiNames}
          listHref={LIST_HREF}
        />
      </ApiProvider>
    </ToastProvider>,
  );
}

async function createLead(input: Record<string, string>) {
  return records.create("Leads", input);
}

function groupTable() {
  return screen.getByRole("table", { name: "Duplicate groups with conflicts" });
}

describe("DedupConflictGroups", () => {
  it("lists each conflicting group under every selected field", async () => {
    const email = "conflict-lead@example.test";
    await createLead({
      First_Name: "Ada",
      Last_Name: "Lovelace",
      Company: "Analytical Engine",
      Email: email,
      Phone: "111-000",
    });
    await createLead({
      First_Name: "Ada",
      Last_Name: "Lovelace",
      Company: "Analytical Engine",
      Email: email,
      Phone: "222-000",
    });
    renderScreen(["Email", "Company"]);

    await waitFor(() => expect(within(groupTable()).getByText(email)).toBeTruthy());
    expect(
      screen.getByText(
        "Duplicates with conflicts based on the field Email and Company are listed below. View and merge them manually.",
      ),
    ).toBeTruthy();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Email", "Company"]);
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(within(groupTable()).getByRole("columnheader", { name: "Email" })).toBeTruthy();
    expect(within(groupTable()).getByRole("columnheader", { name: "Duplicates" })).toBeTruthy();
    expect(within(groupTable()).getByText("2")).toBeTruthy();
    expect(within(groupTable()).getAllByRole("button", { name: "View" })).toHaveLength(1);
    expect(screen.getByText("1 - 1")).toBeTruthy();

    await userEvent.setup().click(screen.getByRole("tab", { name: "Company" }));
    expect(within(groupTable()).getByRole("columnheader", { name: "Company" })).toBeTruthy();
    expect(within(groupTable()).getByText("Analytical Engine")).toBeTruthy();
  });

  it("asks for three records first when a group holds more", async () => {
    const user = userEvent.setup();
    const email = "large-group@example.test";
    for (const phone of ["111-111", "222-222", "333-333", "444-444"]) {
      await createLead({
        First_Name: "Alan",
        Last_Name: "Turing",
        Company: "Bletchley",
        Email: email,
        Phone: phone,
      });
    }
    renderScreen(["Email"]);

    await waitFor(() => expect(within(groupTable()).getByText("4")).toBeTruthy());
    await user.click(within(groupTable()).getByRole("button", { name: "View" }));

    const choose = await screen.findByRole("table", { name: "Matching records" });
    expect(
      screen.getByText("This group has more than 3 duplicates. Choose 3 records to merge."),
    ).toBeTruthy();
    const checkboxes = within(choose).getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes).toHaveLength(4);
    expect(checkboxes.filter((box) => box.checked)).toHaveLength(3);
    expect(checkboxes.filter((box) => !box.checked).every((box) => box.disabled)).toBe(true);
  });

  it("opens the shared comparison for a group and returns to the list once it is empty", async () => {
    const user = userEvent.setup();
    const email = "merge-me@example.test";
    await createLead({
      First_Name: "Ada",
      Last_Name: "Lovelace",
      Company: "Analytical Engine",
      Email: email,
      Phone: "111-000",
    });
    await createLead({
      First_Name: "Ada",
      Last_Name: "Lovelace",
      Company: "Analytical Engine",
      Email: email,
      Phone: "222-000",
    });
    renderScreen(["Email"]);

    await waitFor(() =>
      expect(within(groupTable()).getByRole("button", { name: "View" })).toBeTruthy(),
    );
    await user.click(within(groupTable()).getByRole("button", { name: "View" }));

    expect(await screen.findByRole("heading", { name: "Merge Records" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Show Conflicts Only" })).toBeTruthy();
    expect(screen.getAllByRole("radio", { name: /Record/ })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Merge" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Merge" }));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(LIST_HREF));
    expect(await records.findDuplicateGroups("Leads", ["Email"])).toHaveLength(0);
  });

  it("cancels back to the module list", async () => {
    const email = "cancel-me@example.test";
    await createLead({
      First_Name: "Ada",
      Last_Name: "Lovelace",
      Company: "Analytical Engine",
      Email: email,
      Phone: "111-000",
    });
    await createLead({
      First_Name: "Ada",
      Last_Name: "Lovelace",
      Company: "Analytical Engine",
      Email: email,
      Phone: "222-000",
    });
    renderScreen(["Email"]);
    await waitFor(() => expect(within(groupTable()).getByText(email)).toBeTruthy());
    await userEvent.setup().click(screen.getByRole("button", { name: "Cancel" }));
    expect(navigation.push).toHaveBeenCalledWith(LIST_HREF);
  });
});
