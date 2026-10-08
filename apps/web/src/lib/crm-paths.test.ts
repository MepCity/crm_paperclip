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
    expect(CRM_ORG_PATH_PREFIX).toBe("/crm");
    expect(orgBasePath("acme")).toBe("/crm/acme");
    expect(moduleTabPath("acme", "Leads", "list")).toBe("/crm/acme/tab/Leads/list");
    expect(moduleListDefaultPath("acme", "Leads")).toBe("/crm/acme/tab/Leads/list");
    expect(moduleListCustomPath("acme", "Leads", "converted-leads")).toBe(
      "/crm/acme/tab/Leads/custom-view/converted-leads/list",
    );
    expect(moduleRecordPath("acme", "Leads", "lead-1")).toBe("/crm/acme/tab/Leads/lead-1");
    expect(moduleCreatePath("acme", "Leads")).toBe("/crm/acme/tab/Leads/create");
  });

  it("appends search parameters when present", () => {
    const params = new URLSearchParams({ page: "2", per_page: "10" });
    expect(withSearchParams("/crm/acme/tab/Leads/list", params)).toBe(
      "/crm/acme/tab/Leads/list?page=2&per_page=10",
    );
    expect(withSearchParams("/crm/acme/tab/Leads/list", new URLSearchParams())).toBe(
      "/crm/acme/tab/Leads/list",
    );
  });
});
