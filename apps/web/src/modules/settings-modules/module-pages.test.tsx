// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/components/shell/page-title", () => ({
  PageTitle: () => null,
}));

vi.mock("@/lib/session", () => ({
  requireOrgContext: vi.fn().mockResolvedValue({
    orgId: "org-test",
    userId: "user-test",
    membership: { role: "admin" },
  }),
}));

import ModuleFieldsPage from "@/app/crm/[orgSlug]/settings/modules/[module]/fields/page";
import ModuleLayoutsPage from "@/app/crm/[orgSlug]/settings/modules/[module]/layouts/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ModuleFieldsPage and ModuleLayoutsPage", () => {
  it("renders Fields page for Leads, Contacts, Accounts, and Deals from fixture metadata", async () => {
    const expectedFieldByModule: Record<string, string> = {
      Leads: "Lead Status",
      Contacts: "Department",
      Accounts: "Account Name",
      Deals: "Amount",
    };
    for (const mod of ["Leads", "Contacts", "Accounts", "Deals"]) {
      const pageEl = await ModuleFieldsPage({
        params: Promise.resolve({ orgSlug: "test-org", module: mod }),
      });
      const { unmount } = render(pageEl);
      expect(screen.getByRole("heading", { name: mod })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Fields" })).toBeDefined();
      expect(screen.getByRole("cell", { name: expectedFieldByModule[mod] })).toBeDefined();
      unmount();
    }
  });

  it("throws notFound for unsupported modules on Fields page", async () => {
    for (const mod of ["Tasks", "Meetings", "Unknown", "custom_module"]) {
      await expect(
        ModuleFieldsPage({
          params: Promise.resolve({ orgSlug: "test-org", module: mod }),
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(notFoundMock).toHaveBeenCalled();
    }
  });

  it("renders Layouts page for Leads, Contacts, Accounts, and Deals", async () => {
    for (const mod of ["Leads", "Contacts", "Accounts", "Deals"]) {
      const pageEl = await ModuleLayoutsPage({
        params: Promise.resolve({ orgSlug: "test-org", module: mod }),
      });
      const { unmount } = render(pageEl);
      expect(screen.getByRole("heading", { name: mod })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Layouts" })).toBeDefined();
      unmount();
    }
  });

  it("throws notFound for unsupported modules on Layouts page", async () => {
    for (const mod of ["Tasks", "Meetings", "Unknown", "invalid"]) {
      await expect(
        ModuleLayoutsPage({
          params: Promise.resolve({ orgSlug: "test-org", module: mod }),
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(notFoundMock).toHaveBeenCalled();
    }
  });
});
