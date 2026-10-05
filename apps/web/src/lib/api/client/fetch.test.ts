import {
  ConflictError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@crm/core/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeError, UnexpectedApiError } from "@/lib/api/wire/errors";
import { apiFetch, CRM_ORG_HEADER, shouldRetryQuery } from "./fetch";

const orgSlug = "test-org";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("sends same-origin credentials, JSON and the organization header", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch(orgSlug, "/crm/v9/users");
    expect(fetchMock).toHaveBeenCalledWith(
      "/crm/v9/users",
      expect.objectContaining({
        credentials: "same-origin",
        headers: expect.any(Headers),
      }),
    );
    const call = fetchMock.mock.calls.at(0);
    expect(call).toBeDefined();
    const init = call?.at(1) as unknown as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get(CRM_ORG_HEADER)).toBe(orgSlug);
    expect(headers.get("Content-Type")).toBeNull();
  });

  it("serializes a JSON body and returns null for 204", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    await expect(apiFetch(orgSlug, "/crm/v2.2/Leads", { method: "DELETE" })).resolves.toBeNull();
    const fetchMock = vi.fn(async (_url, init) => {
      if (!init) throw new Error("Missing fetch init");
      expect(init.body).toBe(JSON.stringify({ filters: { field: "x" } }));
      expect((init.headers as Headers).get("Content-Type")).toBe("application/json");
      return new Response(JSON.stringify({ count: 1 }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch(orgSlug, "/crm/v2.2/Leads/actions/count", {
      method: "POST",
      body: { filters: { field: "x" } },
    });
  });

  it("throws decoded AppError subclasses with field errors", async () => {
    const validation = new ValidationError({ Company: ["Required."] });
    const encoded = encodeError(validation);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(encoded.body), { status: encoded.status })),
    );
    await expect(apiFetch(orgSlug, "/crm/v2.2/Leads")).rejects.toBeInstanceOf(ValidationError);
    await expect(apiFetch(orgSlug, "/crm/v2.2/Leads")).rejects.toMatchObject({
      fieldErrors: { Company: ["Required."] },
    });

    const notFound = new NotFoundError();
    const notFoundBody = encodeError(notFound);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(notFoundBody.body), {
            status: notFoundBody.status,
          }),
      ),
    );
    await expect(apiFetch(orgSlug, "/crm/v2.2/Leads/missing")).rejects.toBeInstanceOf(
      NotFoundError,
    );

    const conflict = new ConflictError("Duplicate.");
    const conflictBody = encodeError(conflict);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(conflictBody.body), {
            status: conflictBody.status,
          }),
      ),
    );
    await expect(apiFetch(orgSlug, "/crm/v2.2/Leads")).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws UnexpectedApiError for non-JSON error bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>error</html>", { status: 500 })),
    );
    await expect(apiFetch(orgSlug, "/crm/v2.2/Leads")).rejects.toBeInstanceOf(UnexpectedApiError);
    await expect(apiFetch(orgSlug, "/crm/v2.2/Leads")).rejects.not.toBeInstanceOf(SyntaxError);
  });

  it("redirects to sign-in on 401 without a JSON body", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/crm/acme/Leads",
        search: "",
        assign,
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );
    await expect(apiFetch(orgSlug, "/crm/v2.2/Leads")).rejects.toBeInstanceOf(UnexpectedApiError);
    expect(assign).toHaveBeenCalledWith("/sign-in?next=%2Fcrm%2Facme%2FLeads");
  });

  it("redirects to sign-in on 401", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/crm/acme/Leads",
        search: "?page=2",
        assign,
      },
    });
    const encoded = encodeError(new UnauthenticatedError());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(encoded.body), { status: encoded.status })),
    );
    await expect(apiFetch(orgSlug, "/crm/v2.2/Leads")).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(assign).toHaveBeenCalledWith("/sign-in?next=%2Fcrm%2Facme%2FLeads%3Fpage%3D2");
  });

  it("propagates fetch abort", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const error = new DOMException("Aborted", "AbortError");
        throw error;
      }),
    );
    const controller = new AbortController();
    controller.abort();
    await expect(
      apiFetch(orgSlug, "/crm/v9/users", { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("shouldRetryQuery", () => {
  it("does not retry AppError failures", () => {
    expect(shouldRetryQuery(0, new ValidationError({ x: ["y"] }))).toBe(false);
    expect(shouldRetryQuery(0, new Error("network"))).toBe(true);
    expect(shouldRetryQuery(3, new Error("network"))).toBe(false);
  });
});
