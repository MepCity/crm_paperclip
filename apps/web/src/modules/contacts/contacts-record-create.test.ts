import { beforeEach, describe, expect, it, vi } from "vitest";
import { openContactCreateWithReportingTo } from "./contacts-record-create";

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
