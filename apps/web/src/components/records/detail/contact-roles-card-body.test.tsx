import type { RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ContactRolesCardBody } from "./contact-roles-card-body";

const state = vi.hoisted(() => ({
  roles: [] as RecordData[],
  contacts: [] as RecordData[],
  error: false,
  loading: false,
  calls: [] as { module: string; query: unknown; options: unknown }[],
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useViews: () => ({ data: [{ id: "all", isDefault: true }], isLoading: false, isError: false }),
  useRecordList: (module: string, query: unknown, options: unknown) => {
    state.calls.push({ module, query, options });
    return {
      data: { records: module === "Contact_Roles" ? state.roles : state.contacts },
      isLoading: state.loading,
      isError: state.error,
    };
  },
}));

beforeEach(() => {
  state.error = false;
  state.loading = false;
  state.calls = [];
  state.roles = [
    {
      id: "r1",
      fields: { Contact: { module: "Contacts", id: "c1" }, Contact_Role: "Decision Maker" },
    },
  ];
  state.contacts = [
    {
      id: "c1",
      fields: {
        Full_Name: "Ada Lovelace",
        Phone: "555-0100",
        Email: "ada@example.com",
        Account_Name: { module: "Accounts", id: "a1", name: "Analytical Co" },
      },
    },
  ];
});
afterEach(cleanup);

const props = {
  dealId: "d1",
  contactPath: (id: string) => `/contacts/${id}`,
  accountPath: (id: string) => `/accounts/${id}`,
};

test("renders a row with links to the contact and the account", () => {
  render(<ContactRolesCardBody {...props} />);
  expect(screen.getByRole("link", { name: "Ada Lovelace" }).getAttribute("href")).toBe(
    "/contacts/c1",
  );
  expect(screen.getByRole("link", { name: "Analytical Co" }).getAttribute("href")).toBe(
    "/accounts/a1",
  );
  expect(screen.getByText("555-0100")).toBeTruthy();
  expect(screen.getByText("ada@example.com")).toBeTruthy();
  expect(screen.getByText("Decision Maker")).toBeTruthy();
});

test("shows the empty state without rows", () => {
  state.roles = [];
  render(<ContactRolesCardBody {...props} />);
  expect(screen.getByText("No records found")).toBeTruthy();
});

test("shows the shared error state when a read fails", () => {
  state.error = true;
  render(<ContactRolesCardBody {...props} />);
  expect(screen.getByText("Unable to load records.")).toBeTruthy();
});

test("batches only the linked contact IDs and scopes roles to the deal", () => {
  render(<ContactRolesCardBody {...props} />);
  expect(state.calls).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        module: "Contact_Roles",
        query: expect.objectContaining({
          filters: { field: "Deal", comparator: "equal", value: "d1" },
        }),
      }),
      expect.objectContaining({
        module: "Contacts",
        query: expect.objectContaining({
          filters: {
            groupOperator: "or",
            group: [{ field: "id", comparator: "equal", value: "c1" }],
          },
        }),
        options: { enabled: true },
      }),
    ]),
  );
});

test("does not read contacts for an empty deal", () => {
  state.roles = [];
  render(<ContactRolesCardBody {...props} />);
  expect(state.calls.find((call) => call.module === "Contacts")?.options).toEqual({
    enabled: false,
  });
});

test("shows loading before rendering rows", () => {
  state.loading = true;
  render(<ContactRolesCardBody {...props} />);
  expect(screen.getByText("Loading...")).toBeTruthy();
});

test("keeps a missing role blank and preserves a contact link without enrichment", () => {
  state.roles = [
    { id: "r1", fields: { Contact: { module: "Contacts", id: "c1" }, Contact_Role: null } },
  ];
  state.contacts = [];
  render(<ContactRolesCardBody {...props} />);
  expect(screen.getByRole("link", { name: "c1" }).getAttribute("href")).toBe("/contacts/c1");
  expect(screen.getAllByRole("cell").at(-1)?.textContent).toBe("");
});
