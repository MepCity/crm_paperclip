import { NotFoundError, ValidationError } from "@crm/core/errors";
import { createTestOrganization } from "@crm/core/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { decodeError } from "../../../../../../lib/api/wire/errors";
import { getRecordService } from "../../../../../../lib/records";
import { POST } from "./route";

type Organization = Awaited<ReturnType<typeof createTestOrganization>>;

const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;

function cookieOf(org: Organization) {
  const cookie = org.admin.headers.get("cookie");
  if (!cookie) throw new Error("Test session did not set a cookie");
  return cookie;
}

function countRequest(
  org: Organization,
  options: { module?: string; query?: string; body?: string } = {},
) {
  const moduleName = options.module ?? "Leads";
  const headers = new Headers({
    cookie: cookieOf(org),
    origin,
    "X-CRM-ORG": org.org.slug,
  });
  const url = `${origin}/crm/v2.2/${moduleName}/actions/count${options.query ?? "?cvid=all-leads"}`;
  return POST(new Request(url, { method: "POST", headers, body: options.body }), {
    params: Promise.resolve({ module: moduleName }),
  });
}

describe("POST /crm/v2.2/{module}/actions/count", () => {
  let orgA: Organization;
  let orgB: Organization;

  beforeAll(async () => {
    orgA = await createTestOrganization();
    orgB = await createTestOrganization();
  });

  it("returns the view count and ignores the body and unknown query keys", async () => {
    const expected = await getRecordService(orgA.ctx).count("Leads", { viewId: "all-leads" });
    const response = await countRequest(orgA, {
      query: "?cvid=all-leads&approved=true&fields=Full_Name",
      body: JSON.stringify({ count: 0, cvid: "missing-view" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(await response.json()).toEqual({ count: expected });
  });

  it("uses the first value when cvid is repeated", async () => {
    const response = await countRequest(orgA, { query: "?cvid=missing-view&cvid=all-leads" });
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("requires cvid", async () => {
    for (const query of ["", "?cvid="]) {
      const response = await countRequest(orgA, { query });
      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const body = await response.json();
      expect(body).toMatchObject({ code: "validation", status: 400 });
      const decoded = decodeError(response.status, body);
      expect(decoded).toBeInstanceOf(ValidationError);
      if (decoded instanceof ValidationError) {
        expect(decoded.fieldErrors.cvid?.length).toBeGreaterThan(0);
      }
    }
  });

  it("returns 404 for an unknown view and an unknown module", async () => {
    const view = await countRequest(orgA, { query: "?cvid=missing-view" });
    const moduleResponse = await countRequest(orgA, { module: "Deals", query: "?cvid=all-leads" });
    for (const response of [view, moduleResponse]) {
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const body = await response.json();
      expect(body.code).toBe("not_found");
      expect(decodeError(response.status, body)).toBeInstanceOf(NotFoundError);
    }
  });

  it("does not include another organization's records", async () => {
    const beforeA = await getRecordService(orgA.ctx).count("Leads", { viewId: "all-leads" });
    const beforeB = await getRecordService(orgB.ctx).count("Leads", { viewId: "all-leads" });
    await getRecordService(orgA.ctx).create("Leads", {
      Last_Name: "Only A",
      Company: "Example",
    });
    const countA = await countRequest(orgA);
    const countB = await countRequest(orgB);
    expect(countA.status).toBe(200);
    expect(countB.status).toBe(200);
    expect(await countA.json()).toEqual({ count: beforeA + 1 });
    expect(await countB.json()).toEqual({ count: beforeB });
  });
});
