import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import type { ClientRecordService } from "@/lib/api/client/http-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { recordListContextKey, writeRecordListContext } from "@/lib/records/record-list-context";
import { type LeadRecordPaths, LeadRecordScreen } from "./lead-record-screen";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

const ctx = {
  orgId: "lead-screen-org",
  orgSlug: "lead-screen-org",
  orgName: "Lead Screen Org",
  userId: "lead-screen-user",
  role: "admin" as const,
};

const paths: LeadRecordPaths = {
  defaultList: (orgSlug, module) => `/crm/${orgSlug}/tab/${module}/list`,
  record: (orgSlug, module, recordId) => `/crm/${orgSlug}/tab/${module}/${recordId}`,
  edit: (orgSlug, module, recordId) => `/crm/${orgSlug}/tab/${module}/${recordId}/edit`,
  clone: (orgSlug, module, recordId) => `/crm/${orgSlug}/tab/${module}/${recordId}/clone`,
};

function createService(): ClientRecordService {
  return createClientRecordService(createFixtureRecordService(ctx), {
    listUsers: async () => [
      { userId: ctx.userId, name: "Screen User", email: "screen@example.test" },
    ],
  });
}

function expectLeadStatusOnRibbonStep(label: string) {
  const ribbon = screen.getByRole("region", { name: "Lead status" });
  const currentStage = ribbon.querySelector("[aria-current='step']");
  expect(currentStage?.textContent).toContain(label);
}

function expectLeadStatusOnBusinessCard(label: string) {
  const row = screen
    .getByLabelText("Business card")
    .querySelector('[data-detail-field="Lead_Status"] .detail-field-value-wrap');
  expect(row?.textContent).toBe(label);
}

function expectLeadStatusOnDetailsCard(label: string) {
  const row = screen
    .getByLabelText("Details card")
    .querySelector('[data-detail-field="Lead_Status"] .detail-field-value-wrap');
  expect(row?.textContent).toBe(label);
}

function expectLeadStatusEverywhere(label: string) {
  expectLeadStatusOnRibbonStep(label);
  expectLeadStatusOnBusinessCard(label);
  expectLeadStatusOnDetailsCard(label);
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
      <LeadRecordScreen
        orgSlug={ctx.orgSlug}
        recordId={recordId}
        paths={paths}
        now={new Date("2026-06-01T12:00:00Z")}
      />
    </div>,
    { wrapper: Wrapper },
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  navigation.push.mockReset();
  vi.unstubAllGlobals();
});

describe("LeadRecordScreen", () => {
  it("renders header, business card, and detail rows", async () => {
    const service = createService();
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[1];
    const previous = page.records[0];
    const next = page.records[2];
    if (!record || !previous || !next) throw new Error("Expected three list rows.");
    writeRecordListContext(ctx.orgSlug, {
      module: "Leads",
      viewId: view.id,
      listHref: paths.defaultList(ctx.orgSlug, "Leads"),
      page: 1,
      perPage: 30,
      recordIds: page.records.map((row) => row.id),
    });
    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy());
    expect(screen.getByRole("link", { name: "Edit" }).getAttribute("href")).toBe(
      paths.edit(ctx.orgSlug, "Leads", record.id),
    );
    expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe(
      paths.defaultList(ctx.orgSlug, "Leads"),
    );
    expect(screen.getByRole("link", { name: "Previous Record" }).getAttribute("href")).toBe(
      paths.record(ctx.orgSlug, "Leads", previous.id),
    );
    expect(screen.getByRole("link", { name: "Next Record" }).getAttribute("href")).toBe(
      paths.record(ctx.orgSlug, "Leads", next.id),
    );
    expect(screen.getByLabelText("Business card")).toBeTruthy();
    expect(screen.getByText("Lead Name")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("does not fetch view summaries when list context is present", async () => {
    const service = createService();
    const listViewSummaries = vi.spyOn(service, "listViewSummaries");
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[0];
    if (!record) throw new Error("Expected list rows.");
    writeRecordListContext(ctx.orgSlug, {
      module: "Leads",
      viewId: view.id,
      listHref: paths.defaultList(ctx.orgSlug, "Leads"),
      page: 1,
      perPage: 30,
      recordIds: page.records.map((row) => row.id),
    });
    listViewSummaries.mockClear();
    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy());
    expect(listViewSummaries).not.toHaveBeenCalled();
  });

  it("shows the status ribbon and updates Lead_Status from the stage menu", async () => {
    const service = createService();
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[3];
    if (!record) throw new Error("Expected seeded lead.");
    const updateSpy = vi.spyOn(service, "update");
    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("region", { name: "Lead status" })).toBeTruthy());
    const current = record.fields.Lead_Status;
    if (typeof current !== "string") throw new Error("Expected string status.");
    expect(screen.getAllByText(current).length).toBeGreaterThan(0);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Choose lead status" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Contacted" }));
    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith("Leads", record.id, { Lead_Status: "Contacted" }),
    );
    expect(screen.getAllByText("Contacted").length).toBeGreaterThan(0);
    updateSpy.mockClear();
    await user.click(screen.getByRole("button", { name: "Choose lead status" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Contacted" }));
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("navigates to clone from More Options", async () => {
    const service = createService();
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[0];
    if (!record) throw new Error("Expected a list row.");
    const user = userEvent.setup();
    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "More Options" }));
    await user.click(screen.getByRole("menuitem", { name: "Clone" }));
    expect(navigation.push).toHaveBeenCalledWith(paths.clone(ctx.orgSlug, "Leads", record.id));
  });

  it("shows the new Lead_Status on ribbon, business card, and details without refetching the record", async () => {
    const service = createService();
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[3];
    if (!record) throw new Error("Expected seeded lead.");
    const current = record.fields.Lead_Status;
    if (typeof current !== "string") throw new Error("Expected string status.");
    const nextStatus = current === "Contacted" ? "Pre-Qualified" : "Contacted";
    const getSpy = vi.spyOn(service, "get");
    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("region", { name: "Lead status" })).toBeTruthy());
    const getCallsAfterLoad = getSpy.mock.calls.length;
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Choose lead status" }));
    await user.click(screen.getByRole("menuitemradio", { name: nextStatus }));
    await waitFor(() => expectLeadStatusEverywhere(nextStatus));
    expect(getSpy.mock.calls.length).toBe(getCallsAfterLoad);
  });

  it("ends on the latest Lead_Status after A then B then A without extra record reads", async () => {
    const service = createService();
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[3];
    if (!record) throw new Error("Expected seeded lead.");
    const originalStatus = record.fields.Lead_Status;
    if (typeof originalStatus !== "string") throw new Error("Expected string status.");
    const interimStatus = originalStatus === "Contacted" ? "Pre-Qualified" : "Contacted";
    const updateSpy = vi.spyOn(service, "update");
    const getSpy = vi.spyOn(service, "get");
    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("region", { name: "Lead status" })).toBeTruthy());
    const getCallsAfterLoad = getSpy.mock.calls.length;
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Choose lead status" }));
    await user.click(screen.getByRole("menuitemradio", { name: interimStatus }));
    await waitFor(() => expectLeadStatusEverywhere(interimStatus));
    await user.click(screen.getByRole("button", { name: "Choose lead status" }));
    await user.click(screen.getByRole("menuitemradio", { name: originalStatus }));
    await waitFor(() => expectLeadStatusEverywhere(originalStatus));
    expect(updateSpy).toHaveBeenCalledTimes(2);
    expect(getSpy.mock.calls.length).toBe(getCallsAfterLoad);
  });

  it("reverts the ribbon and shows an error when the update fails", async () => {
    const service = createService();
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[4];
    if (!record) throw new Error("Expected seeded lead.");
    const current = record.fields.Lead_Status;
    if (typeof current !== "string") throw new Error("Expected string status.");
    vi.spyOn(service, "update").mockRejectedValueOnce(new Error("Server error"));
    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("region", { name: "Lead status" })).toBeTruthy());
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Choose lead status" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Pre-Qualified" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Unable to update lead status."),
    );
    expect(screen.getAllByText(current).length).toBeGreaterThan(0);
  });

  it("deletes the record from More Options and returns to the list context href", async () => {
    const deleteCtx = {
      ...ctx,
      orgId: "lead-screen-delete-org",
      orgSlug: "lead-screen-delete-org",
    };
    const deletePaths: LeadRecordPaths = {
      defaultList: (orgSlug, module) => `/crm/${orgSlug}/tab/${module}/list`,
      record: (orgSlug, module, recordId) => `/crm/${orgSlug}/tab/${module}/${recordId}`,
      edit: (orgSlug, module, recordId) => `/crm/${orgSlug}/tab/${module}/${recordId}/edit`,
      clone: (orgSlug, module, recordId) => `/crm/${orgSlug}/tab/${module}/${recordId}/clone`,
    };
    const records = createFixtureRecordService(deleteCtx);
    const service = createClientRecordService(records, {
      listUsers: async () => [
        { userId: deleteCtx.userId, name: "Screen User", email: "screen@example.test" },
      ],
    });
    const deleteSpy = vi.spyOn(service, "delete");
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[0];
    if (!record) throw new Error("Expected a list row.");
    const listHref = `${deletePaths.defaultList(deleteCtx.orgSlug, "Leads")}?page=2`;
    writeRecordListContext(deleteCtx.orgSlug, {
      module: "Leads",
      viewId: view.id,
      listHref,
      page: 2,
      perPage: 30,
      recordIds: page.records.map((row) => row.id),
    });
    function DeleteWrapper({ children }: { children: ReactNode }) {
      return (
        <ApiProvider orgSlug={deleteCtx.orgSlug} service={service}>
          {children}
        </ApiProvider>
      );
    }
    const user = userEvent.setup();
    render(
      <div>
        <LeadRecordScreen
          orgSlug={deleteCtx.orgSlug}
          recordId={record.id}
          paths={deletePaths}
          now={new Date("2026-06-01T12:00:00Z")}
        />
      </div>,
      { wrapper: DeleteWrapper },
    );
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy());
    const more = screen.getByRole("button", { name: "More Options" });
    await user.click(more);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = await waitFor(() => screen.getByRole("alertdialog"));
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("Leads", [record.id]);
    });
    await waitFor(() => {
      expect(navigation.push).toHaveBeenCalledWith(listHref);
    });
    const raw = sessionStorage.getItem(recordListContextKey(deleteCtx.orgSlug, "Leads"));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? "") as { recordIds: string[] };
    expect(parsed.recordIds).not.toContain(record.id);
  });

  it("keeps the delete dialog open when delete fails", async () => {
    const deleteCtx = {
      ...ctx,
      orgId: "lead-screen-delete-fail-org",
      orgSlug: "lead-screen-delete-fail-org",
    };
    const deletePaths: LeadRecordPaths = {
      defaultList: (orgSlug, module) => `/crm/${orgSlug}/tab/${module}/list`,
      record: (orgSlug, module, recordId) => `/crm/${orgSlug}/tab/${module}/${recordId}`,
      edit: (orgSlug, module, recordId) => `/crm/${orgSlug}/tab/${module}/${recordId}/edit`,
      clone: (orgSlug, module, recordId) => `/crm/${orgSlug}/tab/${module}/${recordId}/clone`,
    };
    const records = createFixtureRecordService(deleteCtx);
    const service = createClientRecordService(records, {
      listUsers: async () => [
        { userId: deleteCtx.userId, name: "Screen User", email: "screen@example.test" },
      ],
    });
    vi.spyOn(service, "delete").mockRejectedValueOnce(new Error("Server error"));
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[0];
    if (!record) throw new Error("Expected a list row.");
    function DeleteWrapper({ children }: { children: ReactNode }) {
      return (
        <ApiProvider orgSlug={deleteCtx.orgSlug} service={service}>
          {children}
        </ApiProvider>
      );
    }
    const user = userEvent.setup();
    render(
      <div>
        <LeadRecordScreen
          orgSlug={deleteCtx.orgSlug}
          recordId={record.id}
          paths={deletePaths}
          now={new Date("2026-06-01T12:00:00Z")}
        />
      </div>,
      { wrapper: DeleteWrapper },
    );
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy());
    const more = screen.getByRole("button", { name: "More Options" });
    await user.click(more);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = await waitFor(() => screen.getByRole("alertdialog"));
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeTruthy();
      expect(within(dialog).getByText("Server error")).toBeTruthy();
    });
  });

  it("shows not found for a missing record", async () => {
    const service = createService();
    renderScreen(service, "missing-record-id");
    await waitFor(() =>
      expect(screen.getByText("The requested page could not be found.")).toBeTruthy(),
    );
  });
});
