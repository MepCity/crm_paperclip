import { randomUUID } from "node:crypto";
import type { OrgContext } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ctx: OrgContext = {
  orgId: randomUUID(),
  orgSlug: "timelines-test",
  orgName: "Timelines Test",
  userId: "timelines-user",
  role: "admin",
};
const state = { session: true as boolean };
const records = createFixtureRecordService(ctx);

vi.mock("@crm/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@crm/core")>()),
  getSession: vi.fn(async () => (state.session ? { user: { id: ctx.userId } } : null)),
  requireOrgContext: vi.fn(async () => ctx),
}));
vi.mock("@/lib/records", () => ({ getRecordHistoryService: () => records.history }));

import { GET } from "./route";

function call(
  recordId: string,
  options: { query?: string; org?: string | null; module?: string } = {},
) {
  const module = options.module ?? "Leads";
  const headers = new Headers();
  if (options.org !== null) headers.set("X-CRM-ORG", options.org ?? "timelines-test");
  return GET(
    new Request(`http://localhost/crm/v9/${module}/${recordId}/timelines${options.query ?? ""}`, {
      headers,
    }),
    { params: Promise.resolve({ module, recordId }) },
  );
}

describe("GET /crm/v9/{module}/{recordId}/timelines", () => {
  beforeEach(() => {
    state.session = true;
  });

  it("returns the encoded history with paging info", async () => {
    const record = await records.create("Leads", { Last_Name: "Route", Company: "Route Co" });
    await records.update("Leads", record.id, { Company: "Changed Co" });
    const response = await call(record.id);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.info).toMatchObject({ count: 2, more_records: false, per_page: 25 });
    expect(body.timelines.map((t: { action: string }) => t.action).sort()).toEqual([
      "added",
      "updated",
    ]);
    const updated = body.timelines.find((t: { action: string }) => t.action === "updated");
    expect(updated).toMatchObject({
      record: { module: { api_name: "Leads" }, id: record.id },
      related_record: null,
      source: expect.any(String),
      event_kind: "fields_updated",
      automation: null,
    });
    expect(updated.field_history[0]._value).toEqual({ old: "Route Co", new: "Changed Co" });
  });

  it("returns 204 without a body when the filters match nothing", async () => {
    const record = await records.create("Leads", { Last_Name: "Empty", Company: "Empty Co" });
    const filters = JSON.stringify({
      field: { api_name: "record.module.api_name" },
      comparator: "in",
      value: ["Contacts"],
    });
    const response = await call(record.id, { query: `?filters=${encodeURIComponent(filters)}` });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("returns 400 for an invalid filter, page size or page token", async () => {
    const record = await records.create("Leads", { Last_Name: "Bad", Company: "Bad Co" });
    for (const query of ["?per_page=0", "?filters=%7Bnope", "?page_token=garbage"]) {
      const response = await call(record.id, { query });
      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe("INVALID_DATA");
    }
  });

  it("returns 404 for an unknown record", async () => {
    const response = await call("does-not-exist");
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("not_found");
  });

  it("rejects a missing session and a missing organization header", async () => {
    state.session = false;
    const unauthenticated = await call("any");
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.headers.get("cache-control")).toBe("no-store");
    state.session = true;
    const missingOrg = await call("any", { org: null });
    expect(missingOrg.status).toBe(400);
  });
});
