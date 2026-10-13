import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { ContactHierarchyModal } from "./contact-hierarchy-modal";

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Test Org",
  userId: "user-1",
  role: "admin" as const,
};

function createTestService(records: ReturnType<typeof createFixtureRecordService>) {
  return createClientRecordService(records, {
    listUsers: async () => [{ userId: ctx.userId, name: "User One", email: "u1@example.test" }],
  });
}

function wrapper(service: ReturnType<typeof createClientRecordService>) {
  return function Provider({ children }: { children: ReactNode }) {
    return (
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        {children}
      </ApiProvider>
    );
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ContactHierarchyModal", () => {
  it("renders Contact Hierarchy title and Close Modal button", async () => {
    const records = createFixtureRecordService(ctx);
    const service = createTestService(records);
    const onClose = vi.fn();

    render(
      <ContactHierarchyModal
        isOpen
        onClose={onClose}
        orgSlug={ctx.orgSlug}
        account={{ id: "acc-1", name: "Acme Corp" }}
      />,
      { wrapper: wrapper(service) },
    );

    expect(screen.getByRole("heading", { name: "Contact Hierarchy" })).toBeDefined();
    const closeBtn = screen.getByRole("button", { name: "Close Modal" });
    expect(closeBtn).toBeDefined();

    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape key press", async () => {
    const records = createFixtureRecordService(ctx);
    const service = createTestService(records);
    const onClose = vi.fn();

    render(
      <ContactHierarchyModal
        isOpen
        onClose={onClose}
        orgSlug={ctx.orgSlug}
        account={{ id: "acc-1", name: "Acme Corp" }}
      />,
      { wrapper: wrapper(service) },
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("renders account root row as plain text and contact link targeting contact detail", async () => {
    const records = createFixtureRecordService(ctx);
    // Create an account and contact
    const account = await records.create("Accounts", { Account_Name: "Test Account Co" });
    const contact = await records.create("Contacts", {
      First_Name: "Jane",
      Last_Name: "Doe",
      Account_Name: { module: "Accounts", id: account.id },
    });

    const service = createTestService(records);
    const onClose = vi.fn();

    render(
      <ContactHierarchyModal
        isOpen
        onClose={onClose}
        orgSlug={ctx.orgSlug}
        account={{ id: account.id, name: "Test Account Co" }}
      />,
      { wrapper: wrapper(service) },
    );

    // Wait for tree to load
    await waitFor(() => {
      expect(screen.getByText("Test Account Co")).toBeDefined();
    });

    // Root row is plain text, NOT a link
    expect(screen.queryByRole("link", { name: "Test Account Co" })).toBeNull();
    const rootRow = screen.getByLabelText("Test Account Co");
    expect(rootRow.getAttribute("data-part")).toBe("account-root");

    // Contact is a link targeting contact detail
    const contactLink = await screen.findByRole("link", { name: "Jane Doe" });
    expect(contactLink.getAttribute("href")).toBe(`/crm/${ctx.orgSlug}/tab/Contacts/${contact.id}`);

    // Clicking contact link triggers navigation and closes modal (Rule 6)
    await userEvent.click(contactLink);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render unexpected controls (no column headers, search, footer, badge)", async () => {
    const records = createFixtureRecordService(ctx);
    const account = await records.create("Accounts", { Account_Name: "Clean Corp" });
    await records.create("Contacts", {
      Last_Name: "Clean Contact",
      Account_Name: { module: "Accounts", id: account.id },
    });

    const service = createTestService(records);

    render(
      <ContactHierarchyModal
        isOpen
        onClose={() => {}}
        orgSlug={ctx.orgSlug}
        account={{ id: account.id, name: "Clean Corp" }}
      />,
      { wrapper: wrapper(service) },
    );

    await waitFor(() => {
      expect(screen.getByText("Clean Corp")).toBeDefined();
    });

    // Check absence of unexpected controls
    expect(screen.queryByRole("columnheader")).toBeNull();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
    expect(screen.queryByText(/current record/i)).toBeNull();
    expect(screen.queryByText(/geçerli kayıt/i)).toBeNull();
    // Only Close Modal button exists as visible interactive button
    const closeBtn = screen.getByRole("button", { name: "Close Modal" });
    expect(closeBtn).toBeDefined();
    expect(
      screen.queryByRole("button", { name: /save|submit|cancel|apply|edit|delete|action/i }),
    ).toBeNull();
  });

  it("handles empty state: renders only root account row, no empty-state text (Rule 4)", async () => {
    const records = createFixtureRecordService(ctx);
    const account = await records.create("Accounts", { Account_Name: "Empty Account Inc" });
    const service = createTestService(records);

    render(
      <ContactHierarchyModal
        isOpen
        onClose={() => {}}
        orgSlug={ctx.orgSlug}
        account={{ id: account.id, name: "Empty Account Inc" }}
      />,
      { wrapper: wrapper(service) },
    );

    await waitFor(() => {
      expect(screen.getByText("Empty Account Inc")).toBeDefined();
    });

    // Root account is visible
    expect(screen.getByText("Empty Account Inc")).toBeDefined();
    // No "No records found" or other empty message
    expect(screen.queryByText(/no records found/i)).toBeNull();
    // No contact links
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders Contacts entry without account: manager -> contact -> direct reports (Rule 5)", async () => {
    const records = createFixtureRecordService(ctx);
    const manager = await records.create("Contacts", { Last_Name: "Boss Manager" });
    const current = await records.create("Contacts", {
      Last_Name: "Team Lead",
      Reporting_To: { module: "Contacts", id: manager.id },
    });
    await records.create("Contacts", {
      Last_Name: "Direct Report Alpha",
      Reporting_To: { module: "Contacts", id: current.id },
    });
    await records.create("Contacts", {
      Last_Name: "Direct Report Beta",
      Reporting_To: { module: "Contacts", id: current.id },
    });

    const service = createTestService(records);

    render(
      <ContactHierarchyModal
        isOpen
        onClose={() => {}}
        orgSlug={ctx.orgSlug}
        contact={{ id: current.id, name: "Team Lead", record: current }}
      />,
      { wrapper: wrapper(service) },
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Boss Manager" })).toBeDefined();
    });

    // No account root row
    expect(screen.queryByLabelText("data-part='account-root'")).toBeNull();

    // All contacts are links
    expect(screen.getByRole("link", { name: "Boss Manager" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Team Lead" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Direct Report Alpha" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Direct Report Beta" })).toBeDefined();
  });
});
