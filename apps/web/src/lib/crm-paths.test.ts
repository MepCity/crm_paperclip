import { describe, expect, it } from "vitest";
import {
  CRM_ORG_PATH_PREFIX,
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
  moduleTabPath,
  orgBasePath,
  withSearchParams,
} from "./crm-paths";

describe("crm-paths", () => {
  it("builds org and module tab paths from the shared prefix", () => {
    expect(CRM_ORG_PATH_PREFIX).toBe("/o");
    expect(orgBasePath("acme")).toBe("/o/acme");
    expect(moduleTabPath("acme", "Leads", "list")).toBe("/o/acme/tab/Leads/list");
    expect(moduleListDefaultPath("acme", "Leads")).toBe("/o/acme/tab/Leads/list");
    expect(moduleListCustomPath("acme", "Leads", "converted-leads")).toBe(
      "/o/acme/tab/Leads/custom-view/converted-leads/list",
    );
    expect(moduleRecordPath("acme", "Leads", "lead-1")).toBe("/o/acme/tab/Leads/lead-1");
    expect(moduleCreatePath("acme", "Leads")).toBe("/o/acme/tab/Leads/create");
  });

  it("appends search parameters when present", () => {
    const params = new URLSearchParams({ page: "2", per_page: "10" });
    expect(withSearchParams("/o/acme/tab/Leads/list", params)).toBe(
      "/o/acme/tab/Leads/list?page=2&per_page=10",
    );
    expect(withSearchParams("/o/acme/tab/Leads/list", new URLSearchParams())).toBe(
      "/o/acme/tab/Leads/list",
    );
  });
});
