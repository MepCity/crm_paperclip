import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  navigation.push.mockReset();
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

  it("deletes the record from More Options and returns to the list context href", async () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [
        { userId: ctx.userId, name: "Screen User", email: "screen@example.test" },
      ],
    });
    const deleteSpy = vi.spyOn(service, "delete");
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[0];
    if (!record) throw new Error("Expected a list row.");
    const listHref = `${paths.defaultList(ctx.orgSlug, "Leads")}?page=2`;
    writeRecordListContext(ctx.orgSlug, {
      module: "Leads",
      viewId: view.id,
      listHref,
      page: 2,
      perPage: 30,
      recordIds: page.records.map((row) => row.id),
      listQuery: { viewId: view.id, page: 2, perPage: 30 },
    });
    const user = userEvent.setup();
    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy());
    const more = screen.getByRole("button", { name: "More Options" });
    await user.click(more);
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Delete" })).toBeTruthy());
    await user.keyboard("{ArrowDown}{Enter}");
    const dialog = await waitFor(() => screen.getByRole("alertdialog"));
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("Leads", [record.id]);
    });
    await waitFor(() => {
      expect(navigation.push).toHaveBeenCalledWith(listHref);
    });
    const raw = sessionStorage.getItem(recordListContextKey(ctx.orgSlug, "Leads"));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? "") as { recordIds: string[] };
    expect(parsed.recordIds).not.toContain(record.id);
  });

  it("keeps the delete dialog open when delete fails", async () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [
        { userId: ctx.userId, name: "Screen User", email: "screen@example.test" },
      ],
    });
    vi.spyOn(service, "delete").mockRejectedValueOnce(new Error("Server error"));
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const page = await service.list("Leads", { viewId: view.id, page: 1, perPage: 30 });
    const record = page.records[0];
    if (!record) throw new Error("Expected a list row.");
    const user = userEvent.setup();
    renderScreen(service, record.id);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy());
    const more = screen.getByRole("button", { name: "More Options" });
    await user.click(more);
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Delete" })).toBeTruthy());
    await user.keyboard("{ArrowDown}{Enter}");
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
