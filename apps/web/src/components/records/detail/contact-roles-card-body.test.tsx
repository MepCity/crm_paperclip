import type { RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ContactRolesCardBody } from "./contact-roles-card-body";

const state = vi.hoisted(() => ({
  roles: [] as RecordData[],
  contacts: [] as RecordData[],
  error: false,
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useViews: () => ({ data: [{ id: "all", isDefault: true }], isLoading: false, isError: false }),
  useRecordList: (module: string) => ({
    data: { records: module === "Contact_Roles" ? state.roles : state.contacts },
    isLoading: false,
    isError: state.error,
  }),
}));

beforeEach(() => {
  state.error = false;
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
  expect(screen.queryByText("Ada Lovelace")).toBeNull();
});
