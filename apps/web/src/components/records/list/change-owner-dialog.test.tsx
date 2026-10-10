import { ValidationError } from "@crm/core/errors";
import type { FieldDefinition } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { ChangeOwnerDialog } from "./change-owner-dialog";

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Org",
  userId: "user-1",
  role: "admin" as const,
};

let ownerField: FieldDefinition;

beforeAll(async () => {
  const metadata = await createFixtureRecordService(ctx).getModule("Leads");
  const found = metadata.fields.find((field) => field.apiName === "Owner");
  if (!found) throw new Error("Expected Owner field.");
  ownerField = found;
});

const users = [
  { id: "user-1", name: "User One", email: "one@example.test" },
  { id: "user-2", name: "User Two", email: "two@example.test" },
];

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

describe("ChangeOwnerDialog", () => {
  it("disables Change Owner until a user is selected", () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    render(
      <ChangeOwnerDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={["a"]}
        ownerField={ownerField}
        users={users}
        onSuccess={() => {}}
      />,
      { wrapper: wrapper(service) },
    );
    expect(screen.getByRole("button", { name: "Change Owner" }).getAttribute("data-disabled")).toBe(
      "true",
    );
  });

  it("calls changeOwner with selected user", async () => {
    const records = createFixtureRecordService(ctx);
    const ownerSpy = vi.spyOn(records, "changeOwner");
    const view = await records.getView("Leads", "all-leads");
    const list = await records.list("Leads", {
      viewId: "all-leads",
      page: 1,
      perPage: 10,
      fields: [...view.columns],
    });
    const ids = list.records.slice(0, 2).map((record) => record.id);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <ChangeOwnerDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={ids}
        ownerField={ownerField}
        users={users}
        onSuccess={onSuccess}
      />,
      { wrapper: wrapper(service) },
    );
    await user.click(screen.getByRole("button", { name: "Lead Owner" }));
    await user.click(screen.getByRole("option", { name: /User One/ }));
    await user.click(screen.getByRole("button", { name: "Change Owner" }));
    await waitFor(() => {
      expect(ownerSpy).toHaveBeenCalledWith("Leads", ids, ctx.userId);
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows owner validation error on the field input", async () => {
    const records = createFixtureRecordService(ctx);
    vi.spyOn(records, "changeOwner").mockRejectedValue(
      new ValidationError({ Owner: ["Owner is not allowed."] }),
    );
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(
      <ChangeOwnerDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={["a"]}
        ownerField={ownerField}
        users={users}
        onSuccess={() => {}}
      />,
      { wrapper: wrapper(service) },
    );
    await user.click(screen.getByRole("button", { name: "Lead Owner" }));
    await user.click(screen.getByRole("option", { name: /User One/ }));
    await user.click(screen.getByRole("button", { name: "Change Owner" }));
    await waitFor(() => {
      expect(screen.getByText("Owner is not allowed.")).toBeTruthy();
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a general validation error above the actions for non-owner fields", async () => {
    const records = createFixtureRecordService(ctx);
    vi.spyOn(records, "changeOwner").mockRejectedValue(
      new ValidationError({ data: ["Bulk owner change is not permitted."] }),
    );
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(
      <ChangeOwnerDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={["a"]}
        ownerField={ownerField}
        users={users}
        onSuccess={() => {}}
      />,
      { wrapper: wrapper(service) },
    );
    await user.click(screen.getByRole("button", { name: "Lead Owner" }));
    await user.click(screen.getByRole("option", { name: /User One/ }));
    await user.click(screen.getByRole("button", { name: "Change Owner" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Bulk owner change is not permitted.",
      );
    });
  });

  it("shows a general error when change owner fails", async () => {
    const records = createFixtureRecordService(ctx);
    vi.spyOn(records, "changeOwner").mockRejectedValue(new Error("Server error."));
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(
      <ChangeOwnerDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={["a"]}
        ownerField={ownerField}
        users={users}
        onSuccess={() => {}}
      />,
      { wrapper: wrapper(service) },
    );
    await user.click(screen.getByRole("button", { name: "Lead Owner" }));
    await user.click(screen.getByRole("option", { name: /User One/ }));
    await user.click(screen.getByRole("button", { name: "Change Owner" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Server error.");
    });
  });
});
