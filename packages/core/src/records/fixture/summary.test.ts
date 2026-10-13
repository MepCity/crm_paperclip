import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { createFixtureRecordService } from "./index";

it("appends only a matching null group, includes zero sums, search and tenant isolation", async () => {
  const make = () =>
    createFixtureRecordService({
      orgId: randomUUID(),
      orgSlug: "summary",
      orgName: "Summary",
      userId: "summary-user",
      role: "admin",
    });
  const service = make();
  const query = {
    viewId: "all-leads",
    groupBy: "Lead_Status",
    sum: "Annual_Revenue",
    search: "Summary unique",
    filters: { field: "Company", comparator: "equal" as const, value: "Summary company" },
  };
  const empty = await service.summarize("Leads", query);
  expect(empty.every((group) => group.count === 0 && group.sum === 0 && group.value !== null)).toBe(
    true,
  );
  await service.create("Leads", {
    Last_Name: "Summary unique",
    Company: "Summary company",
    Lead_Status: null,
    Annual_Revenue: 12.34,
  });
  await service.create("Leads", {
    Last_Name: "Excluded",
    Company: "Summary company",
    Lead_Status: null,
    Annual_Revenue: 100,
  });
  const groups = await service.summarize("Leads", query);
  expect(groups.at(-1)).toEqual({ value: null, count: 1, sum: 12.34 });
  expect(groups.slice(0, -1)).toEqual(empty);
  expect(await service.count("Leads", query)).toBe(1);
  expect((await service.list("Leads", { ...query, page: 1, perPage: 100 })).records).toHaveLength(
    1,
  );
  expect(await make().summarize("Leads", query)).toEqual(empty);
});
