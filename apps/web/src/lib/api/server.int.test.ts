import { ForbiddenError, isAppError, UnauthenticatedError } from "@crm/core/errors";
import { createTestOrganization } from "@crm/core/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { apiRoute } from "./server";
import { decodeError, UnexpectedApiError } from "./wire/errors";

type Organization = Awaited<ReturnType<typeof createTestOrganization>>;

const appOrigin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;

function call(
  handler: ReturnType<typeof apiRoute<{ module: string }>>,
  options: {
    method?: string;
    org?: string | null;
    cookie?: string | null;
    origin?: string | null;
    module?: string;
    query?: string;
  },
) {
  const headers = new Headers();
  if (options.cookie) headers.set("cookie", options.cookie);
  if (options.org) headers.set("X-CRM-ORG", options.org);
  if (options.origin) headers.set("origin", options.origin);
  const moduleName = options.module ?? "Leads";
  const url = `${appOrigin}/crm/v2.2/${moduleName}/actions/count${options.query ?? ""}`;
  return handler(new Request(url, { method: options.method ?? "POST", headers }), {
    params: Promise.resolve({ module: moduleName }),
  });
}

async function expectError(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("access-control-allow-origin")).toBeNull();
  const body = await response.json();
  expect(Object.keys(body).sort()).toEqual(["code", "details", "message", "status"]);
  expect(body.status).toBe(status);
  return body;
}

describe("apiRoute", () => {
  let orgA: Organization;
  let orgB: Organization;
  const handler = apiRoute<{ module: string }>(async ({ ctx }) => ({ orgId: ctx.orgId }));

  beforeAll(async () => {
    orgA = await createTestOrganization();
    orgB = await createTestOrganization();
  });

  function cookieOf(org: Organization) {
    const cookie = org.admin.headers.get("cookie");
    if (!cookie) throw new Error("Test session did not set a cookie");
    return cookie;
  }

  it("rejects a cross-site POST before it looks at the session", async () => {
    const response = await call(handler, { origin: "http://evil.example" });
    const body = await expectError(response, 403);
    expect(body.code).toBe("forbidden");
    expect(body.details).toEqual({});
    expect(JSON.stringify(body)).not.toContain("evil.example");
    expect(decodeError(response.status, body)).toBeInstanceOf(ForbiddenError);
  });

  it("rejects a missing, blank, or unequal origin on POST", async () => {
    const cookie = cookieOf(orgA);
    const org = orgA.org.slug;
    for (const origin of [
      null,
      "http://127.0.0.1:3001",
      "HTTP://127.0.0.1:3000",
      `${appOrigin}/`,
    ]) {
      const response = await call(handler, { cookie, org, origin });
      const body = await expectError(response, 403);
      expect(body.code).toBe("forbidden");
    }
  });

  it("allows GET without an origin and still rejects other methods", async () => {
    const cookie = cookieOf(orgA);
    const org = orgA.org.slug;
    const allowed = await call(handler, { method: "GET", cookie, org, origin: null });
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("cache-control")).toBe("no-store");

    const rejected = await call(handler, {
      method: "PUT",
      cookie,
      org,
      origin: "https://evil.example",
    });
    expect(rejected.status).toBe(403);
  });

  it("answers 401 with the four-key body when the session is missing", async () => {
    const response = await call(handler, { origin: appOrigin, org: orgA.org.slug });
    const body = await expectError(response, 401);
    expect(body.code).toBe("unauthenticated");
    expect(body.details).toEqual({});
    const decoded = decodeError(response.status, body);
    expect(decoded).toBeInstanceOf(UnauthenticatedError);
    expect(isAppError(decoded)).toBe(true);
    expect(decoded.message).toBe(body.message);
  });

  it("answers 400 when the organization header is missing or blank", async () => {
    const cookie = cookieOf(orgA);
    for (const org of [null, "   "]) {
      const response = await call(handler, { origin: appOrigin, cookie, org });
      const body = await expectError(response, 400);
      expect(body.code).toBe("validation");
      expect(body.details.fields.organization.length).toBeGreaterThan(0);
    }
  });

  it("answers 404 for an organization the user does not belong to", async () => {
    const response = await call(handler, {
      origin: appOrigin,
      cookie: cookieOf(orgA),
      org: orgB.org.slug,
    });
    const body = await expectError(response, 404);
    expect(body.code).toBe("not_found");
    expect(JSON.stringify(body)).not.toContain(orgB.org.slug);
  });

  it("keeps each request's organization context", async () => {
    const [first, second] = await Promise.all([
      call(handler, { origin: appOrigin, cookie: cookieOf(orgA), org: orgA.org.slug }),
      call(handler, { origin: appOrigin, cookie: cookieOf(orgB), org: orgB.org.slug }),
    ]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await first.json()).toEqual({ orgId: orgA.ctx.orgId });
    expect(await second.json()).toEqual({ orgId: orgB.ctx.orgId });
  });

  it("returns 204 with an empty body when the handler returns null", async () => {
    const empty = apiRoute(async () => null);
    const response = await call(empty, {
      origin: appOrigin,
      cookie: cookieOf(orgA),
      org: orgA.org.slug,
    });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("hides an unexpected handler error behind a fixed 500", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = apiRoute(async () => {
      throw new Error("postgres password=secret-internal");
    });
    try {
      const response = await call(failing, {
        origin: appOrigin,
        cookie: cookieOf(orgA),
        org: orgA.org.slug,
      });
      const body = await expectError(response, 500);
      expect(body.code).toBe("internal_error");
      expect(body.details).toEqual({});
      expect(JSON.stringify(body)).not.toContain("secret-internal");
      expect(decodeError(response.status, body)).toBeInstanceOf(UnexpectedApiError);
      expect(errorSpy.mock.calls.flat().join(" ")).toContain("secret-internal");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("does not log an expected not-found error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await call(handler, {
        origin: appOrigin,
        cookie: cookieOf(orgA),
        org: "missing-org-slug",
      });
      expect(response.status).toBe(404);
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
