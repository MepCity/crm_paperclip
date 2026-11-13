import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalLanding } from "./portal-landing";
import { PortalSetupScreen } from "./portal-setup-screen";
import type { Portal, PortalIdentity, PortalUserType } from "./types";

const mockPortal: Portal = {
  id: "portal-1",
  name: "MepCity Portal",
  slug: "mepcity-portal",
  status: "active",
  defaultLanguage: "tr",
  createdAt: "2026-11-12T10:00:00Z",
  updatedAt: "2026-11-12T10:00:00Z",
};

const mockUserTypes: PortalUserType[] = [
  {
    id: "ut-1",
    portalId: "portal-1",
    name: "VIP Customer",
    primaryModule: "Contacts",
    identityCount: 1,
    modules: {
      Contacts: {
        enabled: true,
        scope: "contact",
        actions: { view: true, edit: true, create: false },
        fields: [
          { apiName: "Email", mode: "read" },
          { apiName: "Phone", mode: "edit" },
        ],
      },
      Cases: {
        enabled: true,
        scope: "contact",
        actions: { view: true, edit: false, create: true },
        fields: [{ apiName: "Subject", mode: "edit" }],
      },
    },
    settings: { caseOwner: null },
    createdAt: "2026-11-12T10:00:00Z",
    updatedAt: "2026-11-12T10:00:00Z",
  },
];

const mockUsers: PortalIdentity[] = [
  {
    id: "pi-1",
    portalId: "portal-1",
    userTypeId: "ut-1",
    email: "customer@example.com",
    displayName: "Jane Customer",
    recordModule: "Contacts",
    recordId: "cnt-1",
    status: "active",
    lockedUntil: null,
    lastLoginAt: "2026-11-12T10:30:00Z",
    createdAt: "2026-11-12T10:00:00Z",
  },
];

const mockFetchPortal = vi.fn();
const mockFetchUserTypes = vi.fn();
const mockFetchPortalUsers = vi.fn();
const mockFetchAuthEvents = vi.fn();
const mockFetchContacts = vi.fn();
const mockFetchMembers = vi.fn();
const mockCreatePortal = vi.fn();
const mockUpdatePortal = vi.fn();
const mockDeletePortal = vi.fn();
const mockCreateUserType = vi.fn();
const mockUpdateUserType = vi.fn();
const mockDeleteUserType = vi.fn();
const mockInvitePortalUser = vi.fn();
const mockReinvitePortalUser = vi.fn();
const mockDisablePortalUser = vi.fn();
const mockEnablePortalUser = vi.fn();
const mockSendResetToUser = vi.fn();
const mockChangeUserType = vi.fn();

vi.mock("./api", () => ({
  fetchPortal: (...args: unknown[]) => mockFetchPortal(...args),
  fetchUserTypes: (...args: unknown[]) => mockFetchUserTypes(...args),
  fetchPortalUsers: (...args: unknown[]) => mockFetchPortalUsers(...args),
  fetchAuthEvents: (...args: unknown[]) => mockFetchAuthEvents(...args),
  fetchContacts: (...args: unknown[]) => mockFetchContacts(...args),
  fetchMembers: (...args: unknown[]) => mockFetchMembers(...args),
  createPortal: (...args: unknown[]) => mockCreatePortal(...args),
  updatePortal: (...args: unknown[]) => mockUpdatePortal(...args),
  deletePortal: (...args: unknown[]) => mockDeletePortal(...args),
  createUserType: (...args: unknown[]) => mockCreateUserType(...args),
  updateUserType: (...args: unknown[]) => mockUpdateUserType(...args),
  deleteUserType: (...args: unknown[]) => mockDeleteUserType(...args),
  invitePortalUser: (...args: unknown[]) => mockInvitePortalUser(...args),
  reinvitePortalUser: (...args: unknown[]) => mockReinvitePortalUser(...args),
  disablePortalUser: (...args: unknown[]) => mockDisablePortalUser(...args),
  enablePortalUser: (...args: unknown[]) => mockEnablePortalUser(...args),
  sendResetToUser: (...args: unknown[]) => mockSendResetToUser(...args),
  changeUserType: (...args: unknown[]) => mockChangeUserType(...args),
}));

describe("Portal Member Setup UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPortal.mockResolvedValue(mockPortal);
    mockFetchUserTypes.mockResolvedValue(mockUserTypes);
    mockFetchPortalUsers.mockResolvedValue(mockUsers);
    mockFetchAuthEvents.mockResolvedValue([]);
    mockFetchContacts.mockResolvedValue([]);
    mockFetchMembers.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  describe("PortalLanding (P1 parity)", () => {
    it("renders unconfigured landing matching P1 reference capture", () => {
      const onGetStarted = vi.fn();
      render(<PortalLanding onGetStarted={onGetStarted} />);

      // P1 title
      const title = document.querySelector('[data-zcqa="CustomerPortalTitle"]');
      expect(title).toBeDefined();
      expect(title?.textContent).toBe("Portals");

      // P1 getting started button
      const button = document.getElementById("client_portal_getStarted");
      expect(button).toBeDefined();
      expect(button?.getAttribute("data-zcqa")).toBe("CustomerPortalGettingStartedButton");
      expect(button?.textContent).toContain("Get Started");

      // P1 help link
      const helpLink = screen.getByTestId("portal-help-link");
      expect(helpLink).toBeDefined();
      expect(helpLink.getAttribute("href")).toBe("#help");

      // Click CTA triggers onGetStarted
      if (button) fireEvent.click(button);
      expect(onGetStarted).toHaveBeenCalledTimes(1);
    });
  });

  describe("PortalSetupScreen", () => {
    it("renders landing when portal is not yet configured", async () => {
      mockFetchPortal.mockResolvedValue(null);

      render(<PortalSetupScreen orgSlug="mep" />);

      await waitFor(() => {
        expect(screen.getByTestId("portal-landing")).toBeDefined();
      });

      expect(document.querySelector('[data-zcqa="CustomerPortalTitle"]')).toBeDefined();
      expect(document.getElementById("client_portal_getStarted")).toBeDefined();
    });

    it("renders configured portal dashboard with tabs when portal exists", async () => {
      render(<PortalSetupScreen orgSlug="mep" />);

      await waitFor(() => {
        expect(screen.getByTestId("portal-setup-screen")).toBeDefined();
      });

      // Shows portal metadata
      expect(screen.getByText("MepCity Portal")).toBeDefined();
      expect(screen.getByText(/mepcity-portal/)).toBeDefined();

      // Tabs exist
      expect(screen.getByTestId("tab-user-types")).toBeDefined();
      expect(screen.getByTestId("tab-users")).toBeDefined();
      expect(screen.getByTestId("tab-auth-events")).toBeDefined();

      // User types table renders
      await waitFor(() => {
        expect(screen.getByText("VIP Customer")).toBeDefined();
      });

      // Switch to Users tab
      fireEvent.click(screen.getByTestId("tab-users"));
      await waitFor(() => {
        expect(screen.getByText("customer@example.com")).toBeDefined();
        expect(screen.getByText("Jane Customer")).toBeDefined();
      });

      // Switch to Audit Events tab
      fireEvent.click(screen.getByTestId("tab-auth-events"));
      await waitFor(() => {
        expect(mockFetchAuthEvents).toHaveBeenCalledWith("mep");
      });
    });
  });
});
