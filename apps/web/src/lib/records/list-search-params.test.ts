import { describe, expect, it } from "vitest";
import {
  appliedSortFromState,
  listQueryFromSearchState,
  parseListSearchParams,
  searchParamsFromListState,
} from "./list-search-params";

const eligible = new Set(["Company", "Email"]);

describe("list search params", () => {
  it("applies defaults and rejects invalid values", () => {
    expect(parseListSearchParams(new URLSearchParams())).toEqual({
      page: 1,
      perPage: 30,
      sortBy: null,
      sortOrder: null,
    });
    expect(
      parseListSearchParams(
        new URLSearchParams("page=0&per_page=99&sort_by=Company&sort_order=up"),
      ),
    ).toEqual({
      page: 1,
      perPage: 30,
      sortBy: "Company",
      sortOrder: "asc",
    });
    expect(
      parseListSearchParams(new URLSearchParams("page=2&per_page=10&sort_order=desc")),
    ).toEqual({
      page: 2,
      perPage: 10,
      sortBy: null,
      sortOrder: null,
    });
  });

  it("applies the stored preference only when the address has no per_page", () => {
    expect(parseListSearchParams(new URLSearchParams(), 10).perPage).toBe(10);
    expect(parseListSearchParams(new URLSearchParams("per_page=50"), 10).perPage).toBe(50);
    // An address value outside the six page sizes keeps the address rule, not the preference.
    expect(parseListSearchParams(new URLSearchParams("per_page=99"), 10).perPage).toBe(30);
    // A stored value outside the six page sizes falls back to the default.
    expect(parseListSearchParams(new URLSearchParams(), 99).perPage).toBe(30);
  });

  it("round-trips non-default paging and sort", () => {
    const state = parseListSearchParams(
      new URLSearchParams("page=3&per_page=50&sort_by=Email&sort_order=desc"),
    );
    const params = searchParamsFromListState(state);
    expect(params.get("page")).toBe("3");
    expect(params.get("per_page")).toBe("50");
    expect(params.get("sort_by")).toBe("Email");
    expect(params.get("sort_order")).toBe("desc");
  });

  it("builds list queries with view columns and eligible sort only", () => {
    const state = parseListSearchParams(new URLSearchParams("page=2&sort_by=Tag&sort_order=desc"));
    expect(
      listQueryFromSearchState("all-leads", ["Full_Name", "Company"], state, eligible),
    ).toEqual({
      viewId: "all-leads",
      page: 2,
      perPage: 30,
      fields: ["Full_Name", "Company"],
    });
    const sorted = parseListSearchParams(new URLSearchParams("sort_by=Company&sort_order=asc"));
    expect(listQueryFromSearchState("all-leads", ["Full_Name"], sorted, eligible).sort).toEqual({
      field: "Company",
      order: "asc",
    });
    expect(appliedSortFromState(sorted, eligible)).toEqual({
      field: "Company",
      order: "asc",
    });
  });
});
