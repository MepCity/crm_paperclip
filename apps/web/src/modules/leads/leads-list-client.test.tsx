import { NotFoundError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Component, type ErrorInfo, type ReactNode as RN } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { LeadsListClient } from "./leads-list-client";

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Org",
  userId: "user-1",
  role: "admin" as const,
};

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));

class ThrowCapture extends Component<{ children: RN; onError: (error: Error) => void }> {
  override componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError(error);
  }
  override render() {
    return this.props.children;
  }
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
  navigation.params = new URLSearchParams();
  vi.restoreAllMocks();
});

describe("LeadsListClient", () => {
  it("throws when module metadata fails to load", async () => {
    const records = createFixtureRecordService(ctx);
    const broken = {
      ...records,
      getModule: async () => {
        throw new NotFoundError();
      },
    };
    const service = createClientRecordService(broken, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const errors: Error[] = [];
    render(
      <ThrowCapture onError={(error) => errors.push(error)}>
        <LeadsListClient orgSlug={ctx.orgSlug} />
      </ThrowCapture>,
      { wrapper: wrapper(service) },
    );
    await waitFor(() => {
      expect(errors.length).toBeGreaterThan(0);
    });
    expect(errors[0]).toBeInstanceOf(NotFoundError);
  });

  it("throws when users fail to load", async () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => {
        throw new NotFoundError();
      },
    });
    const errors: Error[] = [];
    render(
      <ThrowCapture onError={(error) => errors.push(error)}>
        <LeadsListClient orgSlug={ctx.orgSlug} />
      </ThrowCapture>,
      { wrapper: wrapper(service) },
    );
    await waitFor(() => {
      expect(errors.length).toBeGreaterThan(0);
    });
    expect(errors[0]).toBeInstanceOf(NotFoundError);
  });

  it("renders the list when metadata and users load", async () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    render(<LeadsListClient orgSlug={ctx.orgSlug} />, { wrapper: wrapper(service) });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
  });
});
