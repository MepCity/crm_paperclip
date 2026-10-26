import { beforeEach, describe, expect, it, vi } from "vitest";
import { readRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import {
  openContactCreateWithReportingTo,
  openDealCreateWithContact,
} from "./contacts-record-create";

describe("openContactCreateWithReportingTo", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
  });

  it("stores Reporting_To prefill and navigates to create", () => {
    const navigate = vi.fn();
    openContactCreateWithReportingTo(
      "acme",
      { id: "mgr-1", fields: { Full_Name: "Manager Person" } },
      navigate,
    );
    expect(navigate).toHaveBeenCalledWith("/crm/acme/tab/Contacts/create");
    const raw = sessionStorage.getItem("mep:record-create-prefill:acme:Contacts");
    expect(raw).toContain("mgr-1");
  });
});

describe("openDealCreateWithContact", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
  });

  it("stores Contact Name prefill and navigates to the Deal create route", () => {
    const navigate = vi.fn();
    openDealCreateWithContact(
      "acme",
      { id: "con-1", fields: { Full_Name: "Sample Person" } },
      navigate,
    );
    expect(navigate).toHaveBeenCalledWith("/crm/acme/tab/Deals/create");
    expect(readRecordCreatePrefill("acme", "Deals")?.fields.Contact_Name).toMatchObject({
      module: "Contacts",
      id: "con-1",
      name: "Sample Person",
    });
  });

  it("carries the person's account when the contact has one", () => {
    const navigate = vi.fn();
    openDealCreateWithContact(
      "acme",
      {
        id: "con-1",
        fields: {
          First_Name: "Sample",
          Last_Name: "Person",
          Account_Name: { module: "Accounts", id: "acc-7", name: "Acme Corp" },
        },
      },
      navigate,
    );
    const prefill = readRecordCreatePrefill("acme", "Deals");
    expect(prefill?.fields.Account_Name).toMatchObject({ module: "Accounts", id: "acc-7" });
    expect(prefill?.fields.Contact_Name).toMatchObject({
      module: "Contacts",
      id: "con-1",
      name: "Sample Person",
    });
  });

  it("omits Account Name when the contact has no account", () => {
    const navigate = vi.fn();
    openDealCreateWithContact("acme", { id: "con-1", fields: { Account_Name: null } }, navigate);
    const prefill = readRecordCreatePrefill("acme", "Deals");
    expect(prefill && "Account_Name" in prefill.fields).toBe(false);
  });
});
