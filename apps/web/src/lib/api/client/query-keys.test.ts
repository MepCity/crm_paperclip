import type { ListQuery, SummaryQuery } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  apiKeys,
  countQueriesPrefix,
  duplicateGroupsPrefix,
  listQueriesPrefix,
  summarizeQueriesPrefix,
} from "./query-keys";

function isPrefix(prefix: readonly unknown[], target: readonly unknown[]): boolean {
  if (prefix.length > target.length) {
    return false;
  }
  return prefix.every((val, idx) => val === target[idx]);
}

describe("query-keys", () => {
  const orgSlug = "test-org";
  const moduleName = "leads";

  const sampleListQuery: ListQuery = {
    viewId: "view-all",
    page: 1,
    perPage: 20,
    fields: ["id", "Last_Name", "Company"],
    sort: { field: "Last_Name", order: "asc" },
  };

  const sampleCountQuery: Pick<ListQuery, "viewId" | "filters" | "search" | "activityFilter"> = {
    viewId: "view-all",
    search: "Acme",
  };

  const sampleSummaryQuery: SummaryQuery = {
    viewId: "view-all",
    groupBy: "Lead_Source",
    sum: "Annual_Revenue",
  };

  describe("criterion 1: key shapes and exact tuples", () => {
    it("starts every apiKeys.* key with ['crm', orgSlug]", () => {
      const allKeys = [
        apiKeys.root(orgSlug),
        apiKeys.homeCurrency(orgSlug),
        apiKeys.users(orgSlug),
        apiKeys.module(orgSlug, moduleName),
        apiKeys.views(orgSlug, moduleName),
        apiKeys.view(orgSlug, moduleName, "view-1"),
        apiKeys.kanbanViews(orgSlug, moduleName),
        apiKeys.kanbanView(orgSlug, moduleName, "view-1"),
        apiKeys.list(orgSlug, moduleName, sampleListQuery),
        apiKeys.count(orgSlug, moduleName, sampleCountQuery),
        apiKeys.summarize(orgSlug, moduleName, sampleSummaryQuery),
        apiKeys.record(orgSlug, moduleName, "rec-1"),
        apiKeys.duplicateGroups(orgSlug, moduleName, ["email", "phone"]),
      ];

      for (const key of allKeys) {
        expect(key[0]).toBe("crm");
        expect(key[1]).toBe(orgSlug);
      }
    });

    it("starts every module-level key with apiKeys.module(orgSlug, module)", () => {
      const expectedModulePrefix = apiKeys.module(orgSlug, moduleName);
      expect(expectedModulePrefix).toEqual(["crm", orgSlug, "module", moduleName]);

      const moduleKeys = [
        apiKeys.views(orgSlug, moduleName),
        apiKeys.view(orgSlug, moduleName, "view-1"),
        apiKeys.kanbanViews(orgSlug, moduleName),
        apiKeys.kanbanView(orgSlug, moduleName, "view-1"),
        apiKeys.list(orgSlug, moduleName, sampleListQuery),
        apiKeys.count(orgSlug, moduleName, sampleCountQuery),
        apiKeys.summarize(orgSlug, moduleName, sampleSummaryQuery),
        apiKeys.record(orgSlug, moduleName, "rec-1"),
        apiKeys.duplicateGroups(orgSlug, moduleName, ["email", "phone"]),
      ];

      for (const key of moduleKeys) {
        expect(isPrefix(expectedModulePrefix, key)).toBe(true);
      }
    });

    it("asserts exact tuples for homeCurrency and users", () => {
      expect(apiKeys.homeCurrency(orgSlug)).toEqual(["crm", orgSlug, "homeCurrency"]);
      expect(apiKeys.users(orgSlug)).toEqual(["crm", orgSlug, "users"]);
    });

    it("asserts exact tuples for views, view, kanbanViews and kanbanView", () => {
      expect(apiKeys.views(orgSlug, moduleName)).toEqual([
        "crm",
        orgSlug,
        "module",
        moduleName,
        "views",
      ]);
      expect(apiKeys.view(orgSlug, moduleName, "view-42")).toEqual([
        "crm",
        orgSlug,
        "module",
        moduleName,
        "view",
        "view-42",
      ]);
      expect(apiKeys.kanbanViews(orgSlug, moduleName)).toEqual([
        "crm",
        orgSlug,
        "module",
        moduleName,
        "kanbanViews",
      ]);
      expect(apiKeys.kanbanView(orgSlug, moduleName, "pipeline-1")).toEqual([
        "crm",
        orgSlug,
        "module",
        moduleName,
        "kanbanView",
        "pipeline-1",
      ]);
    });

    it("asserts exact tuple for record", () => {
      expect(apiKeys.record(orgSlug, moduleName, "record-99")).toEqual([
        "crm",
        orgSlug,
        "module",
        moduleName,
        "record",
        "record-99",
      ]);
    });

    it("asserts exact tuple for duplicateGroups with fields joined by comma", () => {
      expect(apiKeys.duplicateGroups(orgSlug, moduleName, ["Email", "Phone"])).toEqual([
        "crm",
        orgSlug,
        "module",
        moduleName,
        "duplicateGroups",
        "Email,Phone",
      ]);
      expect(apiKeys.duplicateGroups(orgSlug, moduleName, ["Email"])).toEqual([
        "crm",
        orgSlug,
        "module",
        moduleName,
        "duplicateGroups",
        "Email",
      ]);
      expect(apiKeys.duplicateGroups(orgSlug, moduleName, [])).toEqual([
        "crm",
        orgSlug,
        "module",
        moduleName,
        "duplicateGroups",
        "",
      ]);
    });
  });

  describe("criterion 2: list, count and summarize query serialization and comparison", () => {
    describe("list query key", () => {
      it("produces equal keys for the same query object or identical clone", () => {
        const query1: ListQuery = { viewId: "view-1", page: 1, perPage: 50 };
        const query2: ListQuery = { viewId: "view-1", page: 1, perPage: 50 };

        const key1 = apiKeys.list(orgSlug, moduleName, query1);
        const key2 = apiKeys.list(orgSlug, moduleName, query1);
        const key3 = apiKeys.list(orgSlug, moduleName, query2);

        expect(key1).toEqual(key2);
        expect(key1).toEqual(key3);
      });

      it("produces different keys when any query property changes", () => {
        const baseQuery: ListQuery = {
          viewId: "view-1",
          page: 1,
          perPage: 20,
        };

        const pageChanged: ListQuery = { ...baseQuery, page: 2 };
        const perPageChanged: ListQuery = { ...baseQuery, perPage: 50 };
        const viewChanged: ListQuery = { ...baseQuery, viewId: "view-2" };
        const searchChanged: ListQuery = { ...baseQuery, search: "Acme" };
        const filterChanged: ListQuery = {
          ...baseQuery,
          filters: { field: "Lead_Status", comparator: "equal", value: "Contacted" },
        };
        const sortChanged: ListQuery = {
          ...baseQuery,
          sort: { field: "Created_Time", order: "desc" },
        };
        const activityChanged: ListQuery = {
          ...baseQuery,
          activityFilter: { choice: "overdue" },
        };

        const baseKey = apiKeys.list(orgSlug, moduleName, baseQuery);

        expect(apiKeys.list(orgSlug, moduleName, pageChanged)).not.toEqual(baseKey);
        expect(apiKeys.list(orgSlug, moduleName, perPageChanged)).not.toEqual(baseKey);
        expect(apiKeys.list(orgSlug, moduleName, viewChanged)).not.toEqual(baseKey);
        expect(apiKeys.list(orgSlug, moduleName, searchChanged)).not.toEqual(baseKey);
        expect(apiKeys.list(orgSlug, moduleName, filterChanged)).not.toEqual(baseKey);
        expect(apiKeys.list(orgSlug, moduleName, sortChanged)).not.toEqual(baseKey);
        expect(apiKeys.list(orgSlug, moduleName, activityChanged)).not.toEqual(baseKey);
      });

      it("has the JSON string of the query as its last element", () => {
        const query: ListQuery = {
          viewId: "v-custom",
          page: 3,
          perPage: 10,
          search: "search-term",
        };
        const key = apiKeys.list(orgSlug, moduleName, query);
        expect(key.at(-1)).toBe(JSON.stringify(query));
      });
    });

    describe("count query key", () => {
      it("produces equal keys for the same query object or identical clone", () => {
        const query1 = { viewId: "v1", search: "test" };
        const query2 = { viewId: "v1", search: "test" };

        const key1 = apiKeys.count(orgSlug, moduleName, query1);
        const key2 = apiKeys.count(orgSlug, moduleName, query1);
        const key3 = apiKeys.count(orgSlug, moduleName, query2);

        expect(key1).toEqual(key2);
        expect(key1).toEqual(key3);
      });

      it("produces different keys when count query parameters change", () => {
        const base = { viewId: "v1" };
        const withSearch = { viewId: "v1", search: "Alice" };
        const withFilters = {
          viewId: "v1",
          filters: { field: "Email", comparator: "is_not_empty" as const, value: null },
        };
        const withActivity = {
          viewId: "v1",
          activityFilter: { choice: "without_open_activity" as const },
        };

        const baseKey = apiKeys.count(orgSlug, moduleName, base);

        expect(apiKeys.count(orgSlug, moduleName, withSearch)).not.toEqual(baseKey);
        expect(apiKeys.count(orgSlug, moduleName, withFilters)).not.toEqual(baseKey);
        expect(apiKeys.count(orgSlug, moduleName, withActivity)).not.toEqual(baseKey);
      });

      it("has the JSON string of the query as its last element", () => {
        const query = { viewId: "v1", search: "query" };
        const key = apiKeys.count(orgSlug, moduleName, query);
        expect(key.at(-1)).toBe(JSON.stringify(query));
      });
    });

    describe("summarize query key", () => {
      it("produces equal keys for the same query object or identical clone", () => {
        const query1: SummaryQuery = { viewId: "v1", groupBy: "Stage" };
        const query2: SummaryQuery = { viewId: "v1", groupBy: "Stage" };

        const key1 = apiKeys.summarize(orgSlug, moduleName, query1);
        const key2 = apiKeys.summarize(orgSlug, moduleName, query1);
        const key3 = apiKeys.summarize(orgSlug, moduleName, query2);

        expect(key1).toEqual(key2);
        expect(key1).toEqual(key3);
      });

      it("produces different keys when summary query parameters change", () => {
        const base: SummaryQuery = { viewId: "v1", groupBy: "Stage" };
        const groupByChanged: SummaryQuery = { viewId: "v1", groupBy: "Lead_Source" };
        const sumAdded: SummaryQuery = { viewId: "v1", groupBy: "Stage", sum: "Amount" };
        const searchAdded: SummaryQuery = { viewId: "v1", groupBy: "Stage", search: "Corp" };

        const baseKey = apiKeys.summarize(orgSlug, moduleName, base);

        expect(apiKeys.summarize(orgSlug, moduleName, groupByChanged)).not.toEqual(baseKey);
        expect(apiKeys.summarize(orgSlug, moduleName, sumAdded)).not.toEqual(baseKey);
        expect(apiKeys.summarize(orgSlug, moduleName, searchAdded)).not.toEqual(baseKey);
      });

      it("has the JSON string of the query as its last element", () => {
        const query: SummaryQuery = { viewId: "v1", groupBy: "Stage", sum: "Amount" };
        const key = apiKeys.summarize(orgSlug, moduleName, query);
        expect(key.at(-1)).toBe(JSON.stringify(query));
      });
    });
  });

  describe("criterion 3: prefix matching and non-overlap", () => {
    it("matches exact prefix of corresponding keys", () => {
      const listPrefix = listQueriesPrefix(orgSlug, moduleName);
      const countPrefix = countQueriesPrefix(orgSlug, moduleName);
      const summarizePrefix = summarizeQueriesPrefix(orgSlug, moduleName);
      const duplicatePrefix = duplicateGroupsPrefix(orgSlug, moduleName);

      expect(listPrefix).toEqual(["crm", orgSlug, "module", moduleName, "list"]);
      expect(countPrefix).toEqual(["crm", orgSlug, "module", moduleName, "count"]);
      expect(summarizePrefix).toEqual(["crm", orgSlug, "module", moduleName, "summarize"]);
      expect(duplicatePrefix).toEqual(["crm", orgSlug, "module", moduleName, "duplicateGroups"]);

      const listKey = apiKeys.list(orgSlug, moduleName, sampleListQuery);
      const countKey = apiKeys.count(orgSlug, moduleName, sampleCountQuery);
      const summarizeKey = apiKeys.summarize(orgSlug, moduleName, sampleSummaryQuery);
      const duplicateKey = apiKeys.duplicateGroups(orgSlug, moduleName, ["email"]);

      expect(isPrefix(listPrefix, listKey)).toBe(true);
      expect(isPrefix(countPrefix, countKey)).toBe(true);
      expect(isPrefix(summarizePrefix, summarizeKey)).toBe(true);
      expect(isPrefix(duplicatePrefix, duplicateKey)).toBe(true);
    });

    it("are not prefixes of each other's keys or prefixes", () => {
      const prefixes = [
        { name: "list", prefix: listQueriesPrefix(orgSlug, moduleName) },
        { name: "count", prefix: countQueriesPrefix(orgSlug, moduleName) },
        { name: "summarize", prefix: summarizeQueriesPrefix(orgSlug, moduleName) },
        { name: "duplicateGroups", prefix: duplicateGroupsPrefix(orgSlug, moduleName) },
      ];

      const keys = [
        { name: "list", key: apiKeys.list(orgSlug, moduleName, sampleListQuery) },
        { name: "count", key: apiKeys.count(orgSlug, moduleName, sampleCountQuery) },
        { name: "summarize", key: apiKeys.summarize(orgSlug, moduleName, sampleSummaryQuery) },
        { name: "duplicateGroups", key: apiKeys.duplicateGroups(orgSlug, moduleName, ["email"]) },
      ];

      for (const p of prefixes) {
        for (const k of keys) {
          if (p.name !== k.name) {
            expect(isPrefix(p.prefix, k.key)).toBe(false);
          }
        }
      }
    });

    it("are not prefixes of views, view, kanbanViews, kanbanView or record keys", () => {
      const prefixes = [
        listQueriesPrefix(orgSlug, moduleName),
        countQueriesPrefix(orgSlug, moduleName),
        summarizeQueriesPrefix(orgSlug, moduleName),
        duplicateGroupsPrefix(orgSlug, moduleName),
      ];

      const otherKeys = [
        apiKeys.views(orgSlug, moduleName),
        apiKeys.view(orgSlug, moduleName, "view-1"),
        apiKeys.kanbanViews(orgSlug, moduleName),
        apiKeys.kanbanView(orgSlug, moduleName, "kb-1"),
        apiKeys.record(orgSlug, moduleName, "rec-1"),
      ];

      for (const prefix of prefixes) {
        for (const key of otherKeys) {
          expect(isPrefix(prefix, key)).toBe(false);
        }
      }
    });
  });

  describe("criterion 4: isolation between orgs and modules", () => {
    it("never shares module prefix between two different organizations", () => {
      const orgA = "org-alpha";
      const orgB = "org-beta";
      const moduleA = "leads";

      const prefixA = apiKeys.module(orgA, moduleA);
      const prefixB = apiKeys.module(orgB, moduleA);

      expect(prefixA).not.toEqual(prefixB);

      const keysOfOrgB = [
        apiKeys.module(orgB, moduleA),
        apiKeys.views(orgB, moduleA),
        apiKeys.view(orgB, moduleA, "view-1"),
        apiKeys.kanbanViews(orgB, moduleA),
        apiKeys.kanbanView(orgB, moduleA, "kb-1"),
        apiKeys.list(orgB, moduleA, sampleListQuery),
        apiKeys.count(orgB, moduleA, sampleCountQuery),
        apiKeys.summarize(orgB, moduleA, sampleSummaryQuery),
        apiKeys.record(orgB, moduleA, "rec-1"),
        apiKeys.duplicateGroups(orgB, moduleA, ["email"]),
        listQueriesPrefix(orgB, moduleA),
        countQueriesPrefix(orgB, moduleA),
        summarizeQueriesPrefix(orgB, moduleA),
        duplicateGroupsPrefix(orgB, moduleA),
      ];

      for (const key of keysOfOrgB) {
        expect(isPrefix(prefixA, key)).toBe(false);
      }
    });

    it("never shares module prefix between two different modules in the same organization", () => {
      const org = "org-alpha";
      const moduleA = "leads";
      const moduleB = "deals";

      const prefixA = apiKeys.module(org, moduleA);
      const prefixB = apiKeys.module(org, moduleB);

      expect(prefixA).not.toEqual(prefixB);

      const keysOfModuleB = [
        apiKeys.module(org, moduleB),
        apiKeys.views(org, moduleB),
        apiKeys.view(org, moduleB, "view-1"),
        apiKeys.kanbanViews(org, moduleB),
        apiKeys.kanbanView(org, moduleB, "kb-1"),
        apiKeys.list(org, moduleB, sampleListQuery),
        apiKeys.count(org, moduleB, sampleCountQuery),
        apiKeys.summarize(org, moduleB, sampleSummaryQuery),
        apiKeys.record(org, moduleB, "rec-1"),
        apiKeys.duplicateGroups(org, moduleB, ["email"]),
        listQueriesPrefix(org, moduleB),
        countQueriesPrefix(org, moduleB),
        summarizeQueriesPrefix(org, moduleB),
        duplicateGroupsPrefix(org, moduleB),
      ];

      for (const key of keysOfModuleB) {
        expect(isPrefix(prefixA, key)).toBe(false);
      }
    });
  });
});

it("includes campaign restrictions in list, count and summary cache keys", () => {
  const base = { viewId: "all-leads", page: 1, perPage: 10, groupBy: "Lead_Status" };
  const first = { ...base, campaignFilter: { campaignIds: ["one"] } };
  const second = { ...base, campaignFilter: { campaignIds: ["two"], memberStatuses: ["Sent"] } };
  for (const key of [apiKeys.list, apiKeys.count, apiKeys.summarize]) {
    expect(key("synthetic", "Leads", first)).not.toEqual(key("synthetic", "Leads", second));
    expect(key("synthetic", "Leads", first)).not.toEqual(key("synthetic", "Leads", base));
  }
});
