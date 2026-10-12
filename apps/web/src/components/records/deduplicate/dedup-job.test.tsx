import { ConflictError, ForbiddenError } from "@crm/core/errors";
import type { DeduplicateResult, FieldDefinition } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts, ToastProvider } from "@/components/ui/toast";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { render } from "@/test/render";
import { DeduplicateJob, type DeduplicateJobProps } from "./dedup-job";

type DedupOutcome = DeduplicateResult;

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

let fixtureOrgSequence = 0;
let records: ReturnType<typeof createFixtureRecordService>;
let service: ReturnType<typeof createClientRecordService>;
let leadsFields: readonly FieldDefinition[];

beforeEach(async () => {
  ctx.orgId = `dedup-job-${++fixtureOrgSequence}`;
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
  vi.restoreAllMocks();
});

function renderJob(overrides: Partial<DeduplicateJobProps> = {}) {
  const props: DeduplicateJobProps = {
    module: "Leads",
    pluralLabel: "Leads",
    fields: leadsFields,
    conflictGroupsHref: (fields) => `/crm/org-1/Leads/deduplicate?fields=${fields.join(",")}`,
    onClose: vi.fn(),
    ...overrides,
  };
  render(
    <ToastProvider>
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        <DeduplicateJob {...props} />
      </ApiProvider>
    </ToastProvider>,
  );
  return props;
}

async function startRun(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Find And Merge Duplicates" }));
  await user.click(screen.getByRole("button", { name: "Yes, proceed" }));
}

describe("DeduplicateJob field panel", () => {
  it("shows the documented fields with the default one selected", () => {
    renderJob();
    expect(screen.getByRole("heading", { name: "Select Field" })).toBeTruthy();
    expect(screen.getByText("Maximum of 3 fields can be selected.")).toBeTruthy();
    expect(
      screen.getByText("Select the fields you want to identify duplicate Leads with."),
    ).toBeTruthy();
    const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes.slice(0, 4).map((box) => box.closest("label")?.textContent)).toEqual([
      "Email",
      "Company",
      "Phone",
      "Mobile",
    ]);
    expect(boxes[0]?.checked).toBe(true);
    expect(boxes[1]?.checked).toBe(false);
  });

  it("refuses a fourth field and keeps the three chosen ones", async () => {
    const user = userEvent.setup();
    renderJob();
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.click(screen.getByRole("checkbox", { name: "Phone" }));
    const mobile = screen.getByRole("checkbox", { name: "Mobile" }) as HTMLInputElement;
    expect(mobile.disabled).toBe(true);
    await user.click(mobile);
    expect(mobile.checked).toBe(false);
    const checked = screen
      .getAllByRole("checkbox")
      .filter((box) => (box as HTMLInputElement).checked)
      .map((box) => box.closest("label")?.textContent);
    expect(checked).toEqual(["Email", "Company", "Phone"]);
  });

  it("closes from Cancel without running anything", async () => {
    const user = userEvent.setup();
    const props = renderJob();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });
});

describe("DeduplicateJob run", () => {
  it("confirms, reports the notice and hands conflicts over to the resolution screen", async () => {
    const user = userEvent.setup();
    const email = "conflict-pair@example.test";
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
    renderJob();

    await user.click(screen.getByRole("button", { name: "Find And Merge Duplicates" }));
    const confirm = await screen.findByRole("dialog", { name: "Deduplicate Leads" });
    expect(within(confirm).getByText(/You are about to run the de-duplication check/)).toBeTruthy();
    expect(within(confirm).getByRole("link", { name: "Learn More" })).toBeTruthy();
    await user.click(within(confirm).getByRole("button", { name: "Yes, proceed" }));

    const notice = await screen.findByRole("dialog", { name: "Deduplication started" });
    expect(within(notice).getByText(/Deduplication will take few minutes/)).toBeTruthy();
    await user.click(within(notice).getByRole("button", { name: "OK" }));

    const popup = await screen.findByRole("dialog", { name: "Deduplicate Leads" });
    expect(
      within(popup).getByText("0 duplicate groups merged and 0 records removed."),
    ).toBeTruthy();
    expect(within(popup).getByText("A Few duplicate Leads with conflicts found.")).toBeTruthy();
    await user.click(within(popup).getByRole("button", { name: "Resolve Now" }));
    expect(navigation.push).toHaveBeenCalledWith("/crm/org-1/Leads/deduplicate?fields=Email");
  });

  it("summarises an automatic merge and closes when nothing conflicts", async () => {
    const user = userEvent.setup();
    const props = renderJob();
    const input = {
      First_Name: "Grace",
      Last_Name: "Hopper",
      Company: "Navy",
      Email: "identical-pair@example.test",
      Phone: "333-000",
    };
    await records.create("Leads", input);
    await records.create("Leads", input);

    await startRun(user);
    // The cleanup already finished, but its result waits for the acknowledged notice.
    const notice = await screen.findByRole("dialog", { name: "Deduplication started" });
    await user.click(within(notice).getByRole("button", { name: "OK" }));
    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
    expect(screen.getByRole("alert").textContent).toContain(
      "1 duplicate group merged and 1 record removed.",
    );
  });

  it("shows the result of a cleanup that finishes after the notice was acknowledged", async () => {
    const user = userEvent.setup();
    const props = renderJob();
    const deferred: { resolve?: (value: DedupOutcome) => void } = {};
    vi.spyOn(records, "deduplicate").mockReturnValue(
      new Promise<DedupOutcome>((resolve) => {
        deferred.resolve = resolve;
      }),
    );
    await startRun(user);
    const notice = screen.getByRole("dialog", { name: "Deduplication started" });
    await user.click(within(notice).getByRole("button", { name: "OK" }));
    expect(props.onClose).not.toHaveBeenCalled();

    await act(async () => {
      deferred.resolve?.({ mergedGroups: 2, removedRecords: 3, conflicts: [] });
    });
    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
    expect(screen.getByRole("alert").textContent).toContain(
      "2 duplicate groups merged and 3 records removed.",
    );
  });

  it("reports a running cleanup through the shared error notification", async () => {
    const user = userEvent.setup();
    vi.spyOn(records, "deduplicate").mockRejectedValue(
      new ConflictError("Deduplication is already running for this module."),
    );
    renderJob();
    await startRun(user);
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Deduplication is already running for this module.",
      ),
    );
    expect(screen.getByRole("heading", { name: "Select Field" })).toBeTruthy();
  });

  it("reports a permission refusal for a non-administrator", async () => {
    const user = userEvent.setup();
    vi.spyOn(records, "deduplicate").mockRejectedValue(new ForbiddenError());
    renderJob();
    await startRun(user);
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "You do not have permission to do this.",
      ),
    );
  });
});
