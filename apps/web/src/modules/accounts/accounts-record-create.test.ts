import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { moduleCreatePath } from "@/lib/crm-paths";
import { readRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import {
  accountNameLookupFromRecord,
  openAccountCreateWithParentAccount,
  openContactCreateWithAccountName,
  openDealCreateWithAccountName,
} from "./accounts-record-create";

describe("accounts-record-create", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("accountNameLookupFromRecord", () => {
    it("returns lookup with name from Account_Name when Account_Name is a valid string", () => {
      const result = accountNameLookupFromRecord("acc-123", {
        Account_Name: "Acme Corporation",
      });
      expect(result).toEqual({
        module: "Accounts",
        id: "acc-123",
        name: "Acme Corporation",
      });
    });

    it("returns empty string name when Account_Name is missing", () => {
      const result = accountNameLookupFromRecord("acc-123", {});
      expect(result).toEqual({
        module: "Accounts",
        id: "acc-123",
        name: "",
      });
    });

    it("returns empty string name when Account_Name is null", () => {
      const result = accountNameLookupFromRecord("acc-123", {
        Account_Name: null,
      });
      expect(result).toEqual({
        module: "Accounts",
        id: "acc-123",
        name: "",
      });
    });

    it("returns empty string name when Account_Name is not a string", () => {
      const result = accountNameLookupFromRecord("acc-123", {
        Account_Name: 12345 as unknown as string,
      });
      expect(result).toEqual({
        module: "Accounts",
        id: "acc-123",
        name: "",
      });
    });
  });

  describe("openContactCreateWithAccountName", () => {
    it("writes Contacts prefill with Account_Name and navigates to Contacts create path", () => {
      const navigate = vi.fn();
      const orgSlug = "test-org";
      const account = {
        id: "acc-1",
        fields: { Account_Name: "Acme Corp" },
      };

      openContactCreateWithAccountName(orgSlug, account, navigate);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(moduleCreatePath(orgSlug, "Contacts"));

      const prefill = readRecordCreatePrefill(orgSlug, "Contacts");
      expect(prefill).toEqual({
        module: "Contacts",
        fields: {
          Account_Name: {
            module: "Accounts",
            id: "acc-1",
            name: "Acme Corp",
          },
        },
      });
    });
  });

  describe("openAccountCreateWithParentAccount", () => {
    it("writes Accounts prefill with Parent_Account and navigates to Accounts create path", () => {
      const navigate = vi.fn();
      const orgSlug = "test-org";
      const parentAccount = {
        id: "parent-acc-1",
        fields: { Account_Name: "Parent Enterprise" },
      };

      openAccountCreateWithParentAccount(orgSlug, parentAccount, navigate);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(moduleCreatePath(orgSlug, "Accounts"));

      const prefill = readRecordCreatePrefill(orgSlug, "Accounts");
      expect(prefill).toEqual({
        module: "Accounts",
        fields: {
          Parent_Account: {
            module: "Accounts",
            id: "parent-acc-1",
            name: "Parent Enterprise",
          },
        },
      });
    });
  });

  describe("openDealCreateWithAccountName", () => {
    it("writes Deals prefill with Account_Name and navigates to Deals create path", () => {
      const navigate = vi.fn();
      const orgSlug = "test-org";
      const account = {
        id: "acc-1",
        fields: { Account_Name: "Acme Corp" },
      };

      openDealCreateWithAccountName(orgSlug, account, navigate);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(moduleCreatePath(orgSlug, "Deals"));

      const prefill = readRecordCreatePrefill(orgSlug, "Deals");
      expect(prefill).toEqual({
        module: "Deals",
        fields: {
          Account_Name: {
            module: "Accounts",
            id: "acc-1",
            name: "Acme Corp",
          },
        },
      });
    });
  });

  describe("prefill writing order and org scoping", () => {
    it("writes prefill before navigate is invoked", () => {
      let prefillAtNavigate: ReturnType<typeof readRecordCreatePrefill> = null;
      const orgSlug = "test-org";
      const navigate = vi.fn().mockImplementation(() => {
        prefillAtNavigate = readRecordCreatePrefill(orgSlug, "Contacts");
      });

      openContactCreateWithAccountName(
        orgSlug,
        { id: "acc-1", fields: { Account_Name: "Acme Corp" } },
        navigate,
      );

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(prefillAtNavigate).toEqual({
        module: "Contacts",
        fields: {
          Account_Name: {
            module: "Accounts",
            id: "acc-1",
            name: "Acme Corp",
          },
        },
      });
    });

    it("isolates prefill so that prefill for one org slug is not readable under another org slug", () => {
      const navigate = vi.fn();
      openContactCreateWithAccountName(
        "org-alpha",
        { id: "acc-1", fields: { Account_Name: "Alpha Corp" } },
        navigate,
      );

      expect(readRecordCreatePrefill("org-alpha", "Contacts")).not.toBeNull();
      expect(readRecordCreatePrefill("org-beta", "Contacts")).toBeNull();
    });
  });
});
