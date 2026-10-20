import { cleanup } from "@testing-library/react";
import { isValidElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import { render } from "@/test/render";
import { openCaseCreateWithAccountName } from "./accounts/accounts-record-create";
import { createAccountsRelatedLists } from "./accounts/accounts-related-lists";
import { openCaseCreateWithContact } from "./contacts/contacts-record-create";
import { createContactsRelatedLists } from "./contacts/contacts-related-lists";
import { openCaseCreateWithDeal } from "./deals/deals-record-create";
import { createDealsRelatedLists } from "./deals/deals-related-lists";

const listCalls = vi.hoisted(() => ({ calls: [] as { module: string; query: unknown }[] }));

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => ({ data: { fields: [] }, isLoading: false, isError: false }),
  useViews: () => ({
    data: [{ id: "v", name: "All Cases", isDefault: true }],
    isLoading: false,
    isError: false,
  }),
  useView: () => ({ data: { id: "v", columns: [] }, isLoading: false, isError: false }),
  useUsers: () => ({ data: [], isLoading: false, isError: false }),
  useRecordList: (module: string, query: unknown) => {
    listCalls.calls.push({ module, query });
    return { data: { records: [] }, isLoading: false, isError: false };
  },
}));

beforeEach(() => {
  listCalls.calls = [];
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const record = { id: "r-1", fields: {} };

describe("Cases card filter per module", () => {
  it.each([
    ["Accounts", () => createAccountsRelatedLists(), "Account_Name"],
    ["Contacts", () => createContactsRelatedLists(), "Related_To"],
    ["Deals", () => createDealsRelatedLists(), "Deal_Name"],
  ] as const)("%s renders the card filtered on %s", (_name, build, field) => {
    const card = build().find((c) => c.id === "cases");
    const body = card?.renderBody?.({
      record,
      recordPath: (m: string, id: string) => `/o/${m}/${id}`,
    } as never);
    expect(isValidElement(body)).toBe(true);
    render(body as never);
    expect(listCalls.calls[0]?.module).toBe("Cases");
    expect(listCalls.calls[0]?.query).toMatchObject({
      filters: { field, comparator: "equal", value: "r-1" },
    });
  });
});

describe("New Case prefill", () => {
  it("Accounts fills Account Name and opens the Cases form", () => {
    const navigate = vi.fn();
    openCaseCreateWithAccountName(
      "acme",
      { id: "a-1", fields: { Account_Name: "Acme" } },
      navigate,
    );
    expect(navigate).toHaveBeenCalledWith("/crm/acme/tab/Cases/create");
    expect(readRecordCreatePrefill("acme", "Cases")?.fields.Account_Name).toEqual({
      module: "Accounts",
      id: "a-1",
      name: "Acme",
    });
  });

  it("Contacts fills Related To, plus Account Name when present", () => {
    const navigate = vi.fn();
    openCaseCreateWithContact(
      "acme",
      {
        id: "c-1",
        fields: { Last_Name: "Doe", Account_Name: { module: "Accounts", id: "a-1", name: "Acme" } },
      },
      navigate,
    );
    expect(navigate).toHaveBeenCalledWith("/crm/acme/tab/Cases/create");
    const fields = readRecordCreatePrefill("acme", "Cases")?.fields;
    expect(fields?.Related_To).toMatchObject({ module: "Contacts", id: "c-1" });
    expect(fields?.Account_Name).toMatchObject({ id: "a-1" });
  });

  it("Contacts omits Account Name when the contact has none", () => {
    openCaseCreateWithContact("acme", { id: "c-2", fields: { Last_Name: "Doe" } }, vi.fn());
    expect(readRecordCreatePrefill("acme", "Cases")?.fields.Account_Name).toBeUndefined();
  });

  it("Deals fills Deal Name, plus Account Name when present", () => {
    const navigate = vi.fn();
    openCaseCreateWithDeal(
      "acme",
      {
        id: "d-1",
        fields: { Deal_Name: "Big", Account_Name: { module: "Accounts", id: "a-1", name: "Acme" } },
      },
      navigate,
    );
    expect(navigate).toHaveBeenCalledWith("/crm/acme/tab/Cases/create");
    const fields = readRecordCreatePrefill("acme", "Cases")?.fields;
    expect(fields?.Deal_Name).toEqual({ module: "Deals", id: "d-1", name: "Big" });
    expect(fields?.Account_Name).toMatchObject({ id: "a-1" });
  });

  it("Deals omits Account Name when the deal has none", () => {
    openCaseCreateWithDeal("acme", { id: "d-2", fields: { Deal_Name: "Big" } }, vi.fn());
    expect(readRecordCreatePrefill("acme", "Cases")?.fields.Account_Name).toBeUndefined();
  });
});

describe("Contacts rail plus", () => {
  it("calls the same handler as New", () => {
    const onCasesNew = vi.fn();
    const card = createContactsRelatedLists({ onCasesNew }).find((c) => c.id === "cases");
    expect(card?.railAction?.onAction).toBe(onCasesNew);
    expect(card?.upperControls?.find((c) => c.id === "new-case")?.onAction).toBe(onCasesNew);
  });
});
