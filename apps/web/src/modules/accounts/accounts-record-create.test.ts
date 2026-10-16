import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("accountNameLookupFromRecord", () => {
  it("returns module, id, and name from string Account_Name", () => {
    const result = accountNameLookupFromRecord("acc-1", { Account_Name: "Acme Corp" });
    expect(result).toEqual({ module: "Accounts", id: "acc-1", name: "Acme Corp" });
  });

  it("returns empty string name when Account_Name is missing", () => {
    const result = accountNameLookupFromRecord("acc-2", {});
    expect(result).toEqual({ module: "Accounts", id: "acc-2", name: "" });
  });

  it("returns empty string name when Account_Name is a number", () => {
    const result = accountNameLookupFromRecord("acc-3", { Account_Name: 42 });
    expect(result).toEqual({ module: "Accounts", id: "acc-3", name: "" });
  });

  it("returns empty string name when Account_Name is null", () => {
    const result = accountNameLookupFromRecord("acc-4", { Account_Name: null });
    expect(result).toEqual({ module: "Accounts", id: "acc-4", name: "" });
  });

  it("returns empty string name when Account_Name is a lookup object without a string name", () => {
    const result = accountNameLookupFromRecord("acc-5", {
      Account_Name: { module: "Accounts", id: "acc-5" },
    });
    expect(result).toEqual({ module: "Accounts", id: "acc-5", name: "" });
  });

  it("returns name when Account_Name is a lookup object with a string name", () => {
    const result = accountNameLookupFromRecord("acc-6", {
      Account_Name: { module: "Accounts", id: "acc-6", name: "Acme Corp" },
    });
    expect(result).toEqual({ module: "Accounts", id: "acc-6", name: "Acme Corp" });
  });
});

describe("openContactCreateWithAccountName", () => {
  it("writes Contacts prefill with Account_Name and navigates once with moduleCreatePath", () => {
    const navigate = vi.fn();
    const org = "acme";
    const account = { id: "acc-1", fields: { Account_Name: "Acme Corp" } };

    openContactCreateWithAccountName(org, account, navigate);

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(moduleCreatePath(org, "Contacts"));
    const prefill = readRecordCreatePrefill(org, "Contacts");
    expect(prefill?.module).toBe("Contacts");
    expect(prefill?.fields.Account_Name).toEqual({
      module: "Accounts",
      id: "acc-1",
      name: "Acme Corp",
    });
  });

  it("writes empty name when Account_Name is missing", () => {
    const navigate = vi.fn();
    openContactCreateWithAccountName("acme", { id: "acc-2", fields: {} }, navigate);
    const prefill = readRecordCreatePrefill("acme", "Contacts");
    expect(prefill?.fields.Account_Name).toMatchObject({
      module: "Accounts",
      id: "acc-2",
      name: "",
    });
  });
});

describe("openAccountCreateWithParentAccount", () => {
  it("writes Accounts prefill with Parent_Account and navigates once with moduleCreatePath", () => {
    const navigate = vi.fn();
    const org = "acme";
    const parent = { id: "parent-1", fields: { Account_Name: "Parent Corp" } };

    openAccountCreateWithParentAccount(org, parent, navigate);

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(moduleCreatePath(org, "Accounts"));
    const prefill = readRecordCreatePrefill(org, "Accounts");
    expect(prefill?.module).toBe("Accounts");
    expect(prefill?.fields.Parent_Account).toEqual({
      module: "Accounts",
      id: "parent-1",
      name: "Parent Corp",
    });
  });

  it("writes empty name when parent Account_Name is not a string", () => {
    const navigate = vi.fn();
    openAccountCreateWithParentAccount(
      "acme",
      { id: "parent-2", fields: { Account_Name: null } },
      navigate,
    );
    const prefill = readRecordCreatePrefill("acme", "Accounts");
    expect(prefill?.fields.Parent_Account).toMatchObject({
      module: "Accounts",
      id: "parent-2",
      name: "",
    });
  });
});

describe("openDealCreateWithAccountName", () => {
  it("writes Deals prefill with Account_Name and navigates once with moduleCreatePath", () => {
    const navigate = vi.fn();
    const org = "acme";
    const account = { id: "acc-1", fields: { Account_Name: "Acme Corp" } };

    openDealCreateWithAccountName(org, account, navigate);

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(moduleCreatePath(org, "Deals"));
    const prefill = readRecordCreatePrefill(org, "Deals");
    expect(prefill?.module).toBe("Deals");
    expect(prefill?.fields.Account_Name).toEqual({
      module: "Accounts",
      id: "acc-1",
      name: "Acme Corp",
    });
  });

  it("writes empty name when Account_Name is not a string", () => {
    const navigate = vi.fn();
    openDealCreateWithAccountName("acme", { id: "acc-5", fields: {} }, navigate);
    const prefill = readRecordCreatePrefill("acme", "Deals");
    expect(prefill?.fields.Account_Name).toMatchObject({
      module: "Accounts",
      id: "acc-5",
      name: "",
    });
  });
});

describe("Org scoping", () => {
  it("prefills are scoped by org — writing for org a is not readable for org b", () => {
    const navigate = vi.fn();
    const orgA = "org-a";
    const orgB = "org-b";
    const account = { id: "acc-99", fields: { Account_Name: "Shared Name" } };

    openContactCreateWithAccountName(orgA, account, navigate);

    expect(readRecordCreatePrefill(orgA, "Contacts")).not.toBeNull();
    expect(readRecordCreatePrefill(orgB, "Contacts")).toBeNull();
  });

  it("prefills are scoped by org — writing for org b is not readable for org a", () => {
    const navigate = vi.fn();
    const orgA = "org-a";
    const orgB = "org-b";
    const account = { id: "acc-100", fields: { Account_Name: "Another Name" } };

    openDealCreateWithAccountName(orgB, account, navigate);

    expect(readRecordCreatePrefill(orgB, "Deals")).not.toBeNull();
    expect(readRecordCreatePrefill(orgA, "Deals")).toBeNull();
  });
});
