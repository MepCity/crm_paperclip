import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortalAcceptPage from "@/app/portal/[slug]/accept/page";
import PortalLoginPage from "@/app/portal/[slug]/login/page";
import PortalResetPage from "@/app/portal/[slug]/reset/page";
import { PortalContext } from "@/modules/external-portal/portal-context";
import { PortalNotFound } from "./portal-not-found";
import { PortalShell } from "./portal-shell";
import type { PortalSessionInfo } from "./types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({
    slug: "customer-portal",
    module: "Cases",
    id: "case-123",
  }),
  usePathname: () => "/portal/customer-portal",
}));

const mockLoginPortal = vi.fn();
const mockAcceptPortalInvite = vi.fn();
const mockRequestPortalReset = vi.fn();
const mockCompletePortalReset = vi.fn();
const mockLogoutPortal = vi.fn();
const mockFetchPortalRecords = vi.fn();
const mockFetchPortalRecord = vi.fn();
const mockCreatePortalRecord = vi.fn();
const mockUpdatePortalRecord = vi.fn();

vi.mock("./portal-client", () => ({
  getPortalMe: vi.fn(),
  loginPortal: (...args: unknown[]) => mockLoginPortal(...args),
  acceptPortalInvite: (...args: unknown[]) => mockAcceptPortalInvite(...args),
  requestPortalReset: (...args: unknown[]) => mockRequestPortalReset(...args),
  completePortalReset: (...args: unknown[]) => mockCompletePortalReset(...args),
  logoutPortal: (...args: unknown[]) => mockLogoutPortal(...args),
  fetchPortalRecords: (...args: unknown[]) => mockFetchPortalRecords(...args),
  fetchPortalRecord: (...args: unknown[]) => mockFetchPortalRecord(...args),
  createPortalRecord: (...args: unknown[]) => mockCreatePortalRecord(...args),
  updatePortalRecord: (...args: unknown[]) => mockUpdatePortalRecord(...args),
  PortalApiError: class extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));

const sampleSession: PortalSessionInfo = {
  user: {
    email: "portal.user@example.com",
    name: "Alex Customer",
    userTypeId: "ut-1",
    recordId: "cnt-1",
  },
  portal: {
    id: "p-1",
    name: "Acme Customer Portal",
    slug: "customer-portal",
  },
  userType: {
    id: "ut-1",
    name: "Standard Client",
    modules: {
      Contacts: {
        enabled: true,
        scope: "contact",
        actions: { view: true, edit: true, create: false },
        fields: [{ apiName: "Email", mode: "read" }],
      },
      Cases: {
        enabled: true,
        scope: "contact",
        actions: { view: true, edit: false, create: true },
        fields: [{ apiName: "Subject", mode: "edit" }],
      },
      Deals: {
        enabled: false,
        scope: "contact",
        actions: { view: false, edit: false, create: false },
        fields: [],
      },
    },
  },
};

function renderWithPortalContext(
  ui: React.ReactNode,
  session: PortalSessionInfo | null = sampleSession,
) {
  const logout = vi.fn().mockImplementation(async () => {
    await mockLogoutPortal("customer-portal");
    mockPush("/portal/customer-portal/login");
  });

  return render(
    <PortalContext.Provider
      value={{
        slug: "customer-portal",
        session,
        loading: false,
        refresh: vi.fn(),
        logout,
      }}
    >
      {ui}
    </PortalContext.Provider>,
  );
}

describe("External Portal Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "";
  });

  afterEach(() => {
    cleanup();
  });

  describe("PortalShell", () => {
    it("renders portal brand, enabled nav modules, user name and sign out", () => {
      renderWithPortalContext(
        <PortalShell>
          <div data-testid="portal-content">Child Content</div>
        </PortalShell>,
      );

      // Brand
      expect(screen.getByTestId("portal-brand-link").textContent).toContain("Acme Customer Portal");

      // Enabled nav links (Contacts, Cases)
      expect(screen.getByTestId("portal-nav-Contacts")).toBeDefined();
      expect(screen.getByTestId("portal-nav-Cases")).toBeDefined();

      // Disabled module (Deals) must NOT appear in nav
      expect(screen.queryByTestId("portal-nav-Deals")).toBeNull();

      // User info and sign out button
      expect(screen.getByTestId("portal-user-name").textContent).toBe("Alex Customer");
      const logoutBtn = screen.getByTestId("portal-logout-button");
      expect(logoutBtn).toBeDefined();

      // Content
      expect(screen.getByTestId("portal-content")).toBeDefined();
    });

    it("clicking logout calls logoutPortal and redirects to login", async () => {
      renderWithPortalContext(
        <PortalShell>
          <div>Child</div>
        </PortalShell>,
      );

      fireEvent.click(screen.getByTestId("portal-logout-button"));
      await waitFor(() => {
        expect(mockLogoutPortal).toHaveBeenCalledWith("customer-portal");
      });
    });
  });

  describe("PortalNotFound", () => {
    it("renders 404 message and home link", () => {
      render(<PortalNotFound slug="customer-portal" />);

      expect(screen.getByTestId("portal-not-found")).toBeDefined();
      expect(screen.getByText("404")).toBeDefined();
      expect(screen.getByText("Return to Portal Home").getAttribute("href")).toBe(
        "/portal/customer-portal",
      );
    });
  });

  describe("PortalLoginPage", () => {
    it("handles login submission and error display", async () => {
      mockLoginPortal.mockRejectedValueOnce(new Error("Invalid email or password."));

      renderWithPortalContext(<PortalLoginPage />, null);

      const emailInput = screen.getByTestId("portal-login-email");
      const passwordInput = screen.getByTestId("portal-login-password");
      const submitBtn = screen.getByTestId("portal-login-submit");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockLoginPortal).toHaveBeenCalledWith("customer-portal", {
          email: "test@example.com",
          password: "wrongpassword",
        });
      });

      // Error message
      await waitFor(() => {
        expect(screen.getByTestId("portal-login-error").textContent).toContain(
          "Invalid email or password.",
        );
      });
    });
  });

  describe("PortalAcceptPage", () => {
    it("shows invalid state when hash has no token", () => {
      window.location.hash = "";
      renderWithPortalContext(<PortalAcceptPage />, null);

      expect(screen.getByTestId("portal-accept-invalid")).toBeDefined();
    });

    it("shows password form when valid token is in hash and submits", async () => {
      window.location.hash = "#t=token123456789012345678901234567890";
      mockAcceptPortalInvite.mockResolvedValueOnce({ user: { email: "alex@example.com" } });

      renderWithPortalContext(<PortalAcceptPage />, null);

      await waitFor(() => {
        expect(screen.getByTestId("portal-accept-form")).toBeDefined();
      });

      const pwd = screen.getByTestId("portal-accept-password");
      const confirm = screen.getByTestId("portal-accept-confirm");
      const submit = screen.getByTestId("portal-accept-submit");

      fireEvent.change(pwd, { target: { value: "SecureP@ssw0rd123" } });
      fireEvent.change(confirm, { target: { value: "SecureP@ssw0rd123" } });
      fireEvent.click(submit);

      await waitFor(() => {
        expect(mockAcceptPortalInvite).toHaveBeenCalledWith("customer-portal", {
          token: "token123456789012345678901234567890",
          password: "SecureP@ssw0rd123",
        });
      });
    });
  });

  describe("PortalResetPage", () => {
    it("submits request reset and shows confirmation message", async () => {
      window.location.hash = "";
      mockRequestPortalReset.mockResolvedValueOnce({ message: "ok" });

      renderWithPortalContext(<PortalResetPage />, null);

      const emailInput = screen.getByTestId("portal-reset-email");
      const submit = screen.getByTestId("portal-reset-submit");

      fireEvent.change(emailInput, { target: { value: "reset@example.com" } });
      fireEvent.click(submit);

      await waitFor(() => {
        expect(mockRequestPortalReset).toHaveBeenCalledWith("customer-portal", "reset@example.com");
      });

      await waitFor(() => {
        expect(screen.getByTestId("portal-reset-success").textContent).toContain(
          "If an account exists for this email, we have sent a link to reset the password.",
        );
      });
    });
  });
});
