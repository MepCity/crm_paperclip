import { createFixtureRecordService } from "@crm/core/records/fixture";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
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
    <div className="h-[835px]">
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

afterEach(() => {
  sessionStorage.clear();
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

  it("shows not found for a missing record", async () => {
    const service = createService();
    renderScreen(service, "missing-record-id");
    await waitFor(() =>
      expect(screen.getByText("The requested page could not be found.")).toBeTruthy(),
    );
  });
});
