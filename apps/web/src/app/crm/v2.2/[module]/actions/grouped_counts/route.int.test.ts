import { createTestOrganization } from "@crm/core/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { createHttpRecordService } from "@/lib/api/client/http-record-service";
import { encodeCriteria } from "@/lib/api/wire/codec";
import { getRecordService } from "@/lib/records";
import { POST as bulk } from "../../bulk/route";
import { POST } from "./route";

const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;
type Organization = Awaited<ReturnType<typeof createTestOrganization>>;
function request(org: Organization, module: string, query: string, body?: unknown) {
  return new Request(`${origin}/crm/v2.2/${module}/actions/grouped_counts?${query}`, {
    method: "POST",
    headers: { cookie: org.admin.headers.get("cookie") ?? "", origin, "X-CRM-ORG": org.org.slug },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
describe("grouped counts endpoint and stage history reads", () => {
  let org: Organization;
  beforeAll(async () => {
    org = await createTestOrganization();
  });
  it("returns all stages, count/sum parity and the HTTP adapter round trip", async () => {
    const filters = { field: "Amount", comparator: "greater_than" as const, value: 1000 };
    const query = { viewId: "all-deals", groupBy: "Stage", sum: "Amount", filters };
    const expected = await getRecordService(org.ctx).summarize("Deals", query);
    const response = await POST(
      request(org, "Deals", "cvid=all-deals&group_by=Stage&sum=Amount", {
        filters: encodeCriteria(filters),
      }),
      { params: Promise.resolve({ module: "Deals" }) },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ groups: expected });
    const client = createHttpRecordService({
      orgSlug: org.org.slug,
      fetch: async (path, options) => {
        const url = new URL(path, origin);
        const result = await POST(
          request(org, "Deals", url.searchParams.toString(), options?.body),
          { params: Promise.resolve({ module: "Deals" }) },
        );
        return result.json();
      },
    });
    expect(await client.summarize("Deals", query)).toEqual(expected);
  });
  it("reads history through the existing bulk endpoint with a deal filter", async () => {
    const records = getRecordService(org.ctx);
    const deal = await records.create("Deals", {
      Deal_Name: "Endpoint example",
      Stage: "Qualification",
      Closing_Date: "2026-12-15",
      Account_Name: { module: "Accounts", id: "500000000000000000" },
    });
    await records.update("Deals", deal.id, { Stage: "Closed Won" });
    const filters = { field: "Potential_Name", comparator: "equal" as const, value: deal.id };
    const response = await bulk(
      request(org, "DealHistory", "cvid=all-deal-history&page=1&per_page=100", {
        filters: encodeCriteria(filters),
      }),
      { params: Promise.resolve({ module: "DealHistory" }) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({ Stage: "Closed Won", Probability: 100 });
    expect(body.data[1]).toMatchObject({ Stage: "Qualification", Moved_To__s: "Closed Won" });
  });
  it("rejects invalid fields and missing grouping arguments", async () => {
    for (const query of [
      "cvid=all-deals",
      "cvid=all-deals&group_by=Amount",
      "cvid=all-deals&group_by=Unknown",
      "cvid=all-deals&group_by=Stage&sum=Deal_Name",
    ]) {
      const response = await POST(request(org, "Deals", query), {
        params: Promise.resolve({ module: "Deals" }),
      });
      expect(response.status).toBe(400);
    }
  });
});
