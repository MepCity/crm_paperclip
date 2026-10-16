import { beforeEach, describe, expect, it, vi } from "vitest";
import { readRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import {
  accountNameLookupFromRecord,
  openAccountCreateWithParentAccount,
  openContactCreateWithAccountName,
  openDealCreateWithAccountName,
} from "./accounts-record-create";

function makeSessionStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe("accountNameLookupFromRecord", () => {
  it("returns the Account_Name string when present", () => {
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
});

describe("openContactCreateWithAccountName", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", makeSessionStorage());
  });

  it("writes Contacts prefill with Account_Name and navigates once", () => {
    const navigate = vi.fn();
    openContactCreateWithAccountName(
      "acme",
      { id: "acc-1", fields: { Account_Name: "Acme Corp" } },
      navigate,
    );
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/crm/acme/tab/Contacts/create");
    const prefill = readRecordCreatePrefill("acme", "Contacts");
    expect(prefill?.module).toBe("Contacts");
    expect(prefill?.fields.Account_Name).toMatchObject({
      module: "Accounts",
      id: "acc-1",
      name: "Acme Corp",
    });
    sessionStorage.clear();
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
    sessionStorage.clear();
  });
});

describe("openAccountCreateWithParentAccount", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", makeSessionStorage());
  });

  it("writes Accounts prefill with Parent_Account and navigates once", () => {
    const navigate = vi.fn();
    openAccountCreateWithParentAccount(
      "acme",
      { id: "parent-1", fields: { Account_Name: "Parent Corp" } },
      navigate,
    );
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/crm/acme/tab/Accounts/create");
    const prefill = readRecordCreatePrefill("acme", "Accounts");
    expect(prefill?.module).toBe("Accounts");
    expect(prefill?.fields.Parent_Account).toMatchObject({
      module: "Accounts",
      id: "parent-1",
      name: "Parent Corp",
    });
    sessionStorage.clear();
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
    sessionStorage.clear();
  });
});

describe("openDealCreateWithAccountName", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", makeSessionStorage());
  });

  it("writes Deals prefill with Account_Name and navigates once", () => {
    const navigate = vi.fn();
    openDealCreateWithAccountName(
      "acme",
      { id: "acc-1", fields: { Account_Name: "Acme Corp" } },
      navigate,
    );
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/crm/acme/tab/Deals/create");
    const prefill = readRecordCreatePrefill("acme", "Deals");
    expect(prefill?.module).toBe("Deals");
    expect(prefill?.fields.Account_Name).toMatchObject({
      module: "Accounts",
      id: "acc-1",
      name: "Acme Corp",
    });
    sessionStorage.clear();
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
    sessionStorage.clear();
  });
});
