import { ValidationError } from "@crm/core/errors";
import type { RecordData } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { render } from "@/test/render";
import { leadsFormRules, leadsFormFields as names } from "./leads-form-rules";
import { type RecordFormConfig, RecordFormScreen } from "./record-form-screen";

import { SelectUserDialog } from "./select-user-dialog";

let counter = 0;
function harness(record?: RecordData, options: Partial<RecordFormConfig> = {}) {
  const ctx = {
    orgId: `form-screen-${++counter}`,
    orgSlug: "form-screen",
    orgName: "Form Screen",
    userId: "form-author",
    role: "admin" as const,
  };
  const fixture = createFixtureRecordService(ctx, {
    listMemberIds: async () => [ctx.userId, "other-user"],
  });
  const service = createClientRecordService(fixture, {
    listUsers: async () => [
      { userId: ctx.userId, name: "Form Author", email: "author@example.test" },
      { userId: "other-user", name: "Other User", email: "other@example.test" },
    ],
  });
  const navigate = vi.fn();
  const config: RecordFormConfig = {
    module: "Leads",
    rules: leadsFormRules,
    paths: { detail: (id) => `detail:${id}`, create: "create", cancel: "origin" },
    navigate,
    ...options,
  };
  if (record) vi.spyOn(service, "get").mockResolvedValue(record);
  render(
    <ApiProvider orgSlug={ctx.orgSlug} service={service}>
      <RecordFormScreen config={config} currentUserId={ctx.userId} recordId={record?.id} />
    </ApiProvider>,
  );
  return { service, fixture, navigate };
}
async function ready() {
  await screen.findByRole("heading", { name: /^(Create|Edit) Lead$/ });
}
async function required() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("textbox", { name: "Company" }));
  await user.paste("Synthetic Company");
  await user.click(screen.getByRole("textbox", { name: "Last Name" }));
  await user.paste("Synthetic Lead");
  return user;
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("create starts with session owner/null picklists and saves through the service port", async () => {
  const { service, navigate } = harness();
  const create = vi.spyOn(service, "create");
  await ready();
  expect(screen.getByRole("button", { name: "Lead Owner" }).textContent).toContain("Form Author");
  expect(screen.getByRole("button", { name: "Lead Source" }).textContent).toContain("-None-");
  const user = await required();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith(expect.stringMatching(/^detail:/)));
  expect(create).toHaveBeenCalledTimes(1);
  expect(create.mock.calls[0]?.[1]).toMatchObject({
    Company: "Synthetic Company",
    Last_Name: "Synthetic Lead",
    [names.owner]: "form-author",
    Lead_Source: null,
  });
  expect(create.mock.calls[0]?.[1]).not.toHaveProperty(names.address);
  expect(create.mock.calls[0]?.[1]).not.toHaveProperty(names.connected);
  // Metadata loads and renders the complete form before the write assertion.
}, 30_000);

test("edit initializes saved values and submits only changed fields", async () => {
  const record = {
    id: "saved-record",
    fields: {
      Company: "Before",
      Last_Name: "Saved Lead",
      [names.owner]: "other-user",
      [names.salutation]: "Mr.",
      [names.firstName]: "Saved",
      Lead_Source: null,
    },
  };
  const { service, navigate } = harness(record);
  const update = vi.spyOn(service, "update").mockResolvedValue(record);
  await ready();
  expect((screen.getByRole("textbox", { name: "First Name" }) as HTMLInputElement).value).toBe(
    "Saved",
  );
  expect(screen.getByRole("button", { name: "Salutation" }).textContent).toContain("Mr.");
  expect(screen.getByRole("button", { name: "Lead Owner" }).textContent).toContain("Other User");
  const user = userEvent.setup();
  const company = screen.getByRole("textbox", { name: "Company" });
  await user.clear(company);
  await user.click(company);
  await user.paste("After");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith("Leads", record.id, { Company: "After" }),
  );
  expect(navigate).toHaveBeenCalledWith(`detail:${record.id}`);
});

test("field validation remains on form, shows messages and focuses the first visible error", async () => {
  const { service, navigate } = harness();
  vi.spyOn(service, "create").mockRejectedValue(
    new ValidationError({ Last_Name: ["Last name required"], Company: ["Company required"] }),
  );
  await ready();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Company required");
  expect(screen.getByText("Last name required")).toBeTruthy();
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Company" })),
  );
  expect(navigate).not.toHaveBeenCalled();
  await user.type(screen.getByRole("textbox", { name: "Company" }), "Fixed");
  expect(screen.queryByText("Company required")).toBeNull();
});

test("Save and New writes, clears fields and retains the session owner", async () => {
  const { service, navigate } = harness();
  const create = vi.spyOn(service, "create");
  await ready();
  const user = await required();
  await user.click(screen.getByRole("button", { name: "Save and New" }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith("create"));
  expect((screen.getByRole("textbox", { name: "Company" }) as HTMLInputElement).value).toBe("");
  expect(screen.getByRole("button", { name: "Lead Owner" }).textContent).toContain("Form Author");
  const input = create.mock.calls[0]?.[1];
  expect(input).toMatchObject({ Company: "Synthetic Company", Last_Name: "Synthetic Lead" });
});

test("disables all actions during a write and guards duplicate submit", async () => {
  const { service } = harness();
  let resolve: ((record: RecordData) => void) | undefined;
  const create = vi.spyOn(service, "create").mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  await ready();
  const user = await required();
  await user.click(screen.getByRole("button", { name: "Save" }));
  for (const name of ["Save", "Save and New", "Cancel"])
    expect((screen.getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.submit(screen.getByRole("form", { name: "Create Lead" }));
  expect(create).toHaveBeenCalledTimes(1);
  resolve?.({ id: "new-record", fields: {} });
  await waitFor(() =>
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(
      false,
    ),
  );
});

test("Cancel returns to supplied origin and never writes", async () => {
  const { service, navigate } = harness();
  const create = vi.spyOn(service, "create");
  await ready();
  await userEvent.setup().click(screen.getByRole("button", { name: "Cancel" }));
  expect(navigate).toHaveBeenCalledWith("origin");
  expect(create).not.toHaveBeenCalled();
});

test("owner dropdown selection uses opaque user IDs in the create payload", async () => {
  const { service } = harness();
  const create = vi.spyOn(service, "create");
  await ready();
  const user = await required();
  await user.click(screen.getByRole("button", { name: "Lead Owner" }));
  await user.click(screen.getByRole("option", { name: /Other User/ }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(create.mock.calls[0]?.[1]?.[names.owner]).toBe("other-user"));
});

test("owner picker Done updates the form and Cancel restores focus without changing owner", async () => {
  harness(undefined, {
    renderOwnerPicker: ({ selectedId, onDone, onCancel }) => (
      <div role="dialog" aria-label="Select User">
        <span>{selectedId}</span>
        <button type="button" onClick={() => onDone("other-user")}>
          Done
        </button>
        <button type="button" onClick={onCancel}>
          Close picker
        </button>
      </div>
    ),
  });
  await ready();
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", { name: "Open owner picker" });
  await user.click(trigger);
  expect(screen.getByRole("dialog").textContent).toContain("form-author");
  await user.click(screen.getByRole("button", { name: "Done" }));
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(screen.getByRole("button", { name: "Lead Owner" }).textContent).toContain("Other User");
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Close picker" }));
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(screen.getByRole("button", { name: "Lead Owner" }).textContent).toContain("Other User");
});

test("approved owner dialog selects a member and writes its ID", async () => {
  const { service } = harness(undefined, {
    renderOwnerPicker: (props) => (
      <SelectUserDialog
        {...props}
        title="Select User"
        searchLabel="Search Users"
        searchPlaceholder="Search Users"
        selectedUserLabel="Selected User:"
        selectColumnLabel="Select"
        columnUserName="User Name"
        columnAvatarLabel="Avatar"
        columnRole="Role"
        columnEmail="Email"
        columnProfile="Profile"
        cancelLabel="Cancel"
        doneLabel="Done"
      />
    ),
  });
  const create = vi.spyOn(service, "create");
  await ready();
  const user = await required();
  await user.click(screen.getByRole("button", { name: "Open owner picker" }));
  const dialog = within(screen.getByRole("dialog", { name: "Select User" }));
  await user.click(dialog.getByRole("radio", { name: "Other User" }));
  await user.click(dialog.getByRole("button", { name: "Done" }));
  await user.click(screen.getByRole("button", { name: /^Save$/ }));
  await waitFor(() => expect(create.mock.calls[0]?.[1]?.[names.owner]).toBe("other-user"));
});

test.each([
  [names.salutation, "Salutation rejected", "button", "Salutation"],
  [names.longitude, "Longitude rejected", "textbox", "Longitude"],
])(
  "composite error %s is visible and focuses its own control",
  async (field, message, role, label) => {
    const { service } = harness();
    vi.spyOn(service, "create").mockRejectedValue(new ValidationError({ [field]: [message] }));
    await ready();
    await userEvent.setup().click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText(message);
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole(role, { name: label })),
    );
  },
);

test("country/state show null only without a country, preserve saved inventory values", async () => {
  const record = {
    id: "address-record",
    fields: {
      Company: "Address Company",
      Last_Name: "Address Lead",
      [names.owner]: "form-author",
      [names.country]: "Synthetic Country",
      [names.state]: "Synthetic State",
    },
  };
  harness(record);
  await ready();
  const user = userEvent.setup();
  const country = screen.getByRole("button", { name: "Country / Region" });
  const state = screen.getByRole("button", { name: "State / Province" });
  expect(state.textContent).toContain("Synthetic State");
  await user.click(country);
  expect(screen.getByRole("textbox", { name: "Search" })).toBeTruthy();
  await user.click(screen.getByRole("option", { name: "-None-" }));
  await user.click(state);
  expect(screen.getAllByRole("option")).toHaveLength(1);
  expect(screen.getByRole("option", { name: "-None-" })).toBeTruthy();
});

test("Clear All clears writable address subfields without clearing identity", async () => {
  harness({
    id: "address-clear",
    fields: {
      Company: "Retained company",
      Last_Name: "Retained lead",
      [names.country]: "Synthetic Country",
      [names.state]: "Synthetic State",
      [names.latitude]: 12,
      [names.longitude]: 34,
    },
  });
  await ready();
  await userEvent.setup().click(screen.getByRole("button", { name: "Clear All" }));
  expect(screen.getByRole("button", { name: "Country / Region" }).textContent).toContain("-None-");
  expect((screen.getByRole("textbox", { name: "Latitude" }) as HTMLInputElement).value).toBe("");
  expect((screen.getByRole("textbox", { name: "Company" }) as HTMLInputElement).value).toBe(
    "Retained company",
  );
});

test.each([undefined, { id: "saved-currency", fields: { [names.revenue]: 125 } }])(
  "currency keeps its passive information image without guessing a prefix in create/edit",
  async (record) => {
    harness(record);
    await ready();
    const input = screen.getByRole("textbox", { name: "Annual Revenue" });
    const field = input.closest("[data-form-field]");
    if (!field) throw new Error("Missing currency field");
    const image = within(field as HTMLElement).getByRole("img", { name: "Currency information" });
    expect(image.tagName).toBe("SPAN");
    expect(image.hasAttribute("tabindex")).toBe(false);
    expect(image.hasAttribute("title")).toBe(false);
    expect(within(field as HTMLElement).queryByRole("button")).toBeNull();
    expect(field.querySelector(".record-currency-prefix")).toBeNull();
    expect((input as HTMLInputElement).value).toBe(record ? "125" : "");
  },
);
