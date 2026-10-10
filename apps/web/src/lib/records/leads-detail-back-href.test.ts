import { describe, expect, it } from "vitest";
import {
  buildListHrefWithSearchState,
  listHrefSearchParamKeys,
  resolveLeadsDetailBackHref,
} from "./leads-detail-back-href";
import type { RecordListContext } from "./record-list-context";

describe("leads detail back href", () => {
  it("preserves list search param order (page before per_page)", () => {
    const state = { page: 2, perPage: 10 as const, sortBy: null, sortOrder: null };
    expect(listHrefSearchParamKeys(state)).toEqual(["page", "per_page"]);
    expect(buildListHrefWithSearchState("/crm/acme/tab/Leads/list", state)).toBe(
      "/crm/acme/tab/Leads/list?page=2&per_page=10",
    );
  });

  it("orders sort keys after pagination params", () => {
    const state = {
      page: 1,
      perPage: 20 as const,
      sortBy: "Full_Name",
      sortOrder: "asc" as const,
    };
    expect(listHrefSearchParamKeys(state)).toEqual(["per_page", "sort_by", "sort_order"]);
    const href = buildListHrefWithSearchState("/crm/acme/tab/Leads/list", state);
    expect(href).toBe("/crm/acme/tab/Leads/list?per_page=20&sort_by=Full_Name&sort_order=asc");
  });

  it("prefers list context href for Back", () => {
    const context: RecordListContext = {
      module: "Leads",
      viewId: "all-leads",
      listHref: "/crm/acme/tab/Leads/list?page=2&per_page=10",
      page: 2,
      perPage: 10,
      recordIds: ["a"],
    };
    expect(resolveLeadsDetailBackHref(context, "/crm/acme/tab/Leads/list")).toBe(context.listHref);
    expect(resolveLeadsDetailBackHref(null, "/crm/acme/tab/Leads/list")).toBe(
      "/crm/acme/tab/Leads/list",
    );
  });
});
