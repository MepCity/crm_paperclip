import { ValidationError } from "@crm/core/errors";
import type { FieldDefinition } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { MassUpdateDialog } from "./mass-update-dialog";
import { massUpdateFieldsInLayoutOrder } from "./mass-update-fields";

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Org",
  userId: "user-1",
  role: "admin" as const,
};

let fields: FieldDefinition[];
let leadSource: FieldDefinition;

beforeAll(async () => {
  const metadata = await createFixtureRecordService(ctx).getModule("Leads");
  fields = massUpdateFieldsInLayoutOrder(metadata);
  const found = fields.find((field) => field.apiName === "Lead_Source");
  if (!found) throw new Error("Expected Lead_Source in mass update fields.");
  leadSource = found;
});

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

describe("MassUpdateDialog", () => {
  it("lists only mass-update fields and keeps Update disabled until a field is chosen", async () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    render(
      <MassUpdateDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={["a", "b"]}
        fields={fields}
        onSuccess={() => {}}
      />,
      { wrapper: wrapper(service) },
    );
    expect(screen.getByRole("heading", { name: "Mass Update" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Update" }).getAttribute("data-disabled")).toBe(
      "true",
    );
    expect(document.querySelector("[data-part=value-placeholder]")).toBeTruthy();
  });

  it("shows field input after selection and calls massUpdate on success", async () => {
    const records = createFixtureRecordService(ctx);
    const massSpy = vi.spyOn(records, "massUpdate");
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
      <MassUpdateDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={ids}
        fields={fields}
        onSuccess={onSuccess}
      />,
      { wrapper: wrapper(service) },
    );
    await user.click(screen.getByRole("button", { name: "Field" }));
    await user.click(screen.getByRole("option", { name: leadSource.label }));
    expect(screen.getByRole("button", { name: "Update" }).getAttribute("data-disabled")).toBeNull();
    await user.click(screen.getByRole("button", { name: leadSource.label }));
    await user.click(screen.getByRole("option", { name: "Advertisement" }));
    await user.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => {
      expect(massSpy).toHaveBeenCalledWith("Leads", ids, { Lead_Source: "Advertisement" });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows required message for empty required field", async () => {
    const requiredField = fields.find((field) => field.required);
    if (!requiredField) return;
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(
      <MassUpdateDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={["x"]}
        fields={fields}
        onSuccess={() => {}}
      />,
      { wrapper: wrapper(service) },
    );
    await user.click(screen.getByRole("button", { name: "Field" }));
    await user.click(screen.getByRole("option", { name: requiredField.label }));
    await user.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => {
      expect(screen.getByText(`${requiredField.label} cannot be empty.`)).toBeTruthy();
    });
  });

  it("shows validation error from the server on the field input", async () => {
    const records = createFixtureRecordService(ctx);
    vi.spyOn(records, "massUpdate").mockRejectedValue(
      new ValidationError({ Lead_Source: ["Invalid lead source."] }),
    );
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(
      <MassUpdateDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={["a"]}
        fields={fields}
        onSuccess={() => {}}
      />,
      { wrapper: wrapper(service) },
    );
    await user.click(screen.getByRole("button", { name: "Field" }));
    await user.click(screen.getByRole("option", { name: leadSource.label }));
    await user.click(screen.getByRole("button", { name: leadSource.label }));
    await user.click(screen.getByRole("option", { name: "Advertisement" }));
    await user.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => {
      expect(screen.getByText("Invalid lead source.")).toBeTruthy();
    });
  });

  it("shows a long general error above the actions without clipping action buttons", async () => {
    const longMessage =
      "The selected records could not be updated because one or more values conflict with validation rules enforced by the organization.";
    const records = createFixtureRecordService(ctx);
    vi.spyOn(records, "massUpdate").mockRejectedValue(new Error(longMessage));
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(
      <MassUpdateDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={["a"]}
        fields={fields}
        onSuccess={() => {}}
      />,
      { wrapper: wrapper(service) },
    );
    await user.click(screen.getByRole("button", { name: "Field" }));
    await user.click(screen.getByRole("option", { name: leadSource.label }));
    await user.click(screen.getByRole("button", { name: leadSource.label }));
    await user.click(screen.getByRole("option", { name: "Advertisement" }));
    await user.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(longMessage);
    });
    const panel = document.querySelector(".mass-update-modal-panel");
    const update = screen.getByRole("button", { name: "Update" });
    expect(panel).toBeTruthy();
    const panelBottom = panel?.getBoundingClientRect().bottom ?? 0;
    const updateBottom = update.getBoundingClientRect().bottom;
    expect(updateBottom).toBeLessThanOrEqual(panelBottom);
  });

  it("shows a general error above the actions when mutation fails", async () => {
    const records = createFixtureRecordService(ctx);
    vi.spyOn(records, "massUpdate").mockRejectedValue(new Error("Network failed."));
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(
      <MassUpdateDialog
        isOpen
        onOpenChange={() => {}}
        module="Leads"
        recordIds={["a"]}
        fields={fields}
        onSuccess={() => {}}
      />,
      { wrapper: wrapper(service) },
    );
    await user.click(screen.getByRole("button", { name: "Field" }));
    await user.click(screen.getByRole("option", { name: leadSource.label }));
    await user.click(screen.getByRole("button", { name: leadSource.label }));
    await user.click(screen.getByRole("option", { name: "Advertisement" }));
    await user.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Network failed.");
    });
  });
});
