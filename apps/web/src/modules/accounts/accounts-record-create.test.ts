import { beforeEach, expect, test, vi } from "vitest";
import { moduleCreatePath } from "@/lib/crm-paths";
import { readRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import {
  accountNameLookupFromRecord,
  openAccountCreateWithParentAccount,
  openContactCreateWithAccountName,
  openDealCreateWithAccountName,
} from "./accounts-record-create";

function makeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
}

beforeEach(() => {
  vi.stubGlobal("sessionStorage", makeStorage());
});

// ---------------------------------------------------------------------------
// accountNameLookupFromRecord
// ---------------------------------------------------------------------------

test("accountNameLookupFromRecord returns module, id, and name from string Account_Name", () => {
  const result = accountNameLookupFromRecord("acc-1", { Account_Name: "Acme Corp" });
  expect(result).toEqual({ module: "Accounts", id: "acc-1", name: "Acme Corp" });
});

test("accountNameLookupFromRecord returns empty string name when Account_Name is missing", () => {
  const result = accountNameLookupFromRecord("acc-2", {});
  expect(result).toEqual({ module: "Accounts", id: "acc-2", name: "" });
});

test("accountNameLookupFromRecord returns empty string name when Account_Name is a number", () => {
  const result = accountNameLookupFromRecord("acc-3", { Account_Name: 42 });
  expect(result).toEqual({ module: "Accounts", id: "acc-3", name: "" });
});

test("accountNameLookupFromRecord returns empty string name when Account_Name is null", () => {
  const result = accountNameLookupFromRecord("acc-4", { Account_Name: null });
  expect(result).toEqual({ module: "Accounts", id: "acc-4", name: "" });
});

test("accountNameLookupFromRecord returns empty string name when Account_Name is a lookup object", () => {
  const result = accountNameLookupFromRecord("acc-5", {
    Account_Name: { module: "Accounts", id: "acc-5", name: "Acme" },
  });
  expect(result).toEqual({ module: "Accounts", id: "acc-5", name: "" });
});

// ---------------------------------------------------------------------------
// openContactCreateWithAccountName
// ---------------------------------------------------------------------------

test("openContactCreateWithAccountName writes Contacts prefill with Account_Name and navigates once", () => {
  const navigate = vi.fn();
  const org = "org-abc";
  const account = { id: "acc-10", fields: { Account_Name: "Beta LLC" } };

  openContactCreateWithAccountName(org, account, navigate);

  const prefill = readRecordCreatePrefill(org, "Contacts");
  expect(prefill).toEqual({
    module: "Contacts",
    fields: {
      Account_Name: { module: "Accounts", id: "acc-10", name: "Beta LLC" },
    },
  });
  expect(navigate).toHaveBeenCalledOnce();
  expect(navigate).toHaveBeenCalledWith(moduleCreatePath(org, "Contacts"));
});

// ---------------------------------------------------------------------------
// openAccountCreateWithParentAccount
// ---------------------------------------------------------------------------

test("openAccountCreateWithParentAccount writes Accounts prefill with Parent_Account and navigates once", () => {
  const navigate = vi.fn();
  const org = "org-abc";
  const parent = { id: "acc-20", fields: { Account_Name: "Parent Co" } };

  openAccountCreateWithParentAccount(org, parent, navigate);

  const prefill = readRecordCreatePrefill(org, "Accounts");
  expect(prefill).toEqual({
    module: "Accounts",
    fields: {
      Parent_Account: { module: "Accounts", id: "acc-20", name: "Parent Co" },
    },
  });
  expect(navigate).toHaveBeenCalledOnce();
  expect(navigate).toHaveBeenCalledWith(moduleCreatePath(org, "Accounts"));
});

// ---------------------------------------------------------------------------
// openDealCreateWithAccountName
// ---------------------------------------------------------------------------

test("openDealCreateWithAccountName writes Deals prefill with Account_Name and navigates once", () => {
  const navigate = vi.fn();
  const org = "org-abc";
  const account = { id: "acc-30", fields: { Account_Name: "Deal Corp" } };

  openDealCreateWithAccountName(org, account, navigate);

  const prefill = readRecordCreatePrefill(org, "Deals");
  expect(prefill).toEqual({
    module: "Deals",
    fields: {
      Account_Name: { module: "Accounts", id: "acc-30", name: "Deal Corp" },
    },
  });
  expect(navigate).toHaveBeenCalledOnce();
  expect(navigate).toHaveBeenCalledWith(moduleCreatePath(org, "Deals"));
});

// ---------------------------------------------------------------------------
// Org scoping: prefill written for org "a" must not be readable for org "b"
// ---------------------------------------------------------------------------

test("prefills are scoped by org — writing for org a is not readable for org b", () => {
  const navigate = vi.fn();
  const orgA = "org-a";
  const orgB = "org-b";
  const account = { id: "acc-99", fields: { Account_Name: "Shared Name" } };

  openContactCreateWithAccountName(orgA, account, navigate);

  expect(readRecordCreatePrefill(orgA, "Contacts")).not.toBeNull();
  expect(readRecordCreatePrefill(orgB, "Contacts")).toBeNull();
});

test("prefills are scoped by org — writing for org b is not readable for org a", () => {
  const navigate = vi.fn();
  const orgA = "org-a";
  const orgB = "org-b";
  const account = { id: "acc-100", fields: { Account_Name: "Another Name" } };

  openDealCreateWithAccountName(orgB, account, navigate);

  expect(readRecordCreatePrefill(orgB, "Deals")).not.toBeNull();
  expect(readRecordCreatePrefill(orgA, "Deals")).toBeNull();
});
