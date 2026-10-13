import { NotFoundError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import * as hooks from "@/lib/api/client/hooks";
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

const minimalListField = {
  apiName: "Full_Name",
  label: "Full Name",
  dataType: "text" as const,
  required: false,
  readOnly: false,
  massUpdate: false,
  unique: false,
  views: { view: true, create: true, edit: true, quickCreate: false },
};

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));

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
  it("throws when module metadata fails to load", () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    vi.spyOn(hooks, "useModule").mockReturnValue({
      isError: true,
      error: new NotFoundError(),
      isLoading: false,
      data: undefined,
    } as unknown as ReturnType<typeof hooks.useModule>);
    vi.spyOn(hooks, "useUsers").mockReturnValue({
      isError: false,
      isLoading: false,
      data: [],
    } as unknown as ReturnType<typeof hooks.useUsers>);
    expect(() =>
      render(<LeadsListClient orgSlug={ctx.orgSlug} />, { wrapper: wrapper(service) }),
    ).toThrow(NotFoundError);
  });

  it("throws when users fail to load", () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    vi.spyOn(hooks, "useModule").mockReturnValue({
      isError: false,
      isLoading: false,
      data: { fields: [minimalListField] },
    } as unknown as ReturnType<typeof hooks.useModule>);
    vi.spyOn(hooks, "useUsers").mockReturnValue({
      isError: true,
      error: new NotFoundError(),
      isLoading: false,
      data: undefined,
    } as unknown as ReturnType<typeof hooks.useUsers>);
    expect(() =>
      render(<LeadsListClient orgSlug={ctx.orgSlug} />, { wrapper: wrapper(service) }),
    ).toThrow(NotFoundError);
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
