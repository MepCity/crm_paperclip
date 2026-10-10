import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import type { ClientRecordService } from "@/lib/api/client/http-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { writeRecordListContext } from "@/lib/records/record-list-context";
import { type LeadRecordPaths, LeadRecordScreen } from "./lead-record-screen";

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
      listQuery: { viewId: view.id, page: 1, perPage: 30 },
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

  it("keeps the new Lead_Status visible while the record refetch is in flight", async () => {
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

    const pendingGet: { release: (() => void) | null } = { release: null };
    let blockNextGet = false;
    const getRecord = service.get.bind(service);
    vi.spyOn(service, "get").mockImplementation(async (module, id) => {
      const data = await getRecord(module, id);
      if (blockNextGet) {
        blockNextGet = false;
        await new Promise<void>((resolve) => {
          pendingGet.release = resolve;
        });
      }
      return data;
    });

    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("region", { name: "Lead status" })).toBeTruthy());

    blockNextGet = true;
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Choose lead status" }));
    await user.click(screen.getByRole("menuitemradio", { name: nextStatus }));

    const expectNextStatusEverywhere = () => {
      expect(screen.getAllByText(nextStatus).length).toBeGreaterThanOrEqual(2);
    };

    await waitFor(expectNextStatusEverywhere);
    if (!pendingGet.release) throw new Error("Expected record refetch to be blocked.");
    expectNextStatusEverywhere();

    pendingGet.release();
    await waitFor(expectNextStatusEverywhere);
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

  it("shows not found for a missing record", async () => {
    const service = createService();
    renderScreen(service, "missing-record-id");
    await waitFor(() =>
      expect(screen.getByText("The requested page could not be found.")).toBeTruthy(),
    );
  });
});
