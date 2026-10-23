import { describe, expect, it, vi } from "vitest";
import { decodeError, SchemaRevisionMismatchError } from "@/lib/api/wire/errors";
import { shouldRetryQuery } from "./fetch";
import { createHttpRecordService, ModuleMetadataLoadError } from "./http-record-service";

function response(path: string, revision: string) {
  if (path.includes("/modules/"))
    return {
      revision,
      modules: [
        {
          api_name: "Leads",
          singular_label: "Lead",
          plural_label: "Leads",
          business_card_fields: [],
        },
      ],
    };
  if (path.includes("/fields?")) return { revision, fields: [] };
  return { revision, layouts: [{ id: "layout-1", default: true, sections: [] }] };
}

describe("effective schema bundle", () => {
  it("refetches the whole bundle once and only decodes a matching revision", async () => {
    const fetch = vi.fn(async (path: string) =>
      response(
        path,
        fetch.mock.calls.length <= 3 ? (path.includes("fields?") ? "b:2" : "a:1") : "b:2",
      ),
    );
    const service = createHttpRecordService({ orgSlug: "example", fetch });
    await expect(service.getModule("Leads")).resolves.toMatchObject({ apiName: "Leads" });
    expect(fetch).toHaveBeenCalledTimes(6);
    await service.getModule("Leads");
    expect(fetch).toHaveBeenCalledTimes(6);
  });

  it("fails visibly after a second mismatch, and does not cache that failure", async () => {
    const fetch = vi.fn(async (path: string) =>
      response(path, path.includes("fields?") ? "b:2" : "a:1"),
    );
    const service = createHttpRecordService({ orgSlug: "example", fetch });
    await expect(service.getModule("Leads")).rejects.toThrow(
      "Module metadata changed while loading. Refresh to try again.",
    );
    expect(shouldRetryQuery(0, new ModuleMetadataLoadError())).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(6);
    fetch.mockImplementation(async (path) => response(path, "c:3"));
    await expect(service.getModule("Leads")).resolves.toMatchObject({ apiName: "Leads" });
    expect(fetch).toHaveBeenCalledTimes(9);
  });

  it("shares inflight loads, invalidates one module, and discards an invalidated completion", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetch = vi.fn(async (path: string) => {
      await gate;
      return response(path, "a:1");
    });
    const service = createHttpRecordService({ orgSlug: "example", fetch });
    const first = service.getModule("Leads");
    const shared = service.getModule("Leads");
    expect(fetch).toHaveBeenCalledTimes(3);
    service.invalidate("Leads");
    const fresh = service.getModule("Leads");
    expect(fetch).toHaveBeenCalledTimes(6);
    release?.();
    await Promise.all([first, shared, fresh]);
    await service.getModule("Leads");
    expect(fetch).toHaveBeenCalledTimes(6);
    await service.getModule("Contacts");
    service.invalidate("Leads");
    await service.getModule("Contacts");
    expect(fetch).toHaveBeenCalledTimes(9);
    await service.getModule("Leads");
    expect(fetch).toHaveBeenCalledTimes(12);
  });

  it("decodes a reserved 409 and invalidates metadata without replaying the write", async () => {
    const stale = decodeError(409, {
      code: "SCHEMA_REVISION_MISMATCH",
      status: "error",
      message: "stale",
      details: { revision: "b:2" },
    });
    expect(stale).toBeInstanceOf(SchemaRevisionMismatchError);
    const fetch = vi.fn(async (path: string, options?: { method?: string }) => {
      if (options?.method === "POST") throw stale;
      return response(path, "a:1");
    });
    const service = createHttpRecordService({ orgSlug: "example", fetch });
    await service.getModule("Leads");
    await service.getModule("Contacts");
    await expect(service.create("Leads", {})).rejects.toBe(stale);
    await service.getModule("Contacts");
    expect(fetch).toHaveBeenCalledTimes(7);
    await service.getModule("Leads");
    expect(fetch).toHaveBeenCalledTimes(10);
    expect(fetch.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(1);
  });
});

it("reserves the stale-schema handler for a valid revision and HTTP 409", () => {
  const body = {
    code: "SCHEMA_REVISION_MISMATCH",
    status: "error",
    message: "stale",
    details: { revision: "next:2" },
  };
  expect(decodeError(400, body)).not.toBeInstanceOf(SchemaRevisionMismatchError);
  expect(decodeError(409, { ...body, details: {} })).not.toBeInstanceOf(
    SchemaRevisionMismatchError,
  );
  expect(
    decodeError(409, { ...body, details: { revision: "invalid revision" } }),
  ).not.toBeInstanceOf(SchemaRevisionMismatchError);
});
