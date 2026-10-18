import { randomUUID } from "node:crypto";
import { NotFoundError } from "@crm/core/errors";
import type { OrgContext } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as addTags } from "@/app/crm/v2.2/[module]/[recordId]/actions/add_tags/route";
import { POST as removeTags } from "@/app/crm/v2.2/[module]/[recordId]/actions/remove_tags/route";
import { GET as getRecord } from "@/app/crm/v2.2/[module]/[recordId]/route";
import { POST as empty } from "@/app/crm/v2.2/settings/recycle_bin/actions/empty/route";
import { POST as purge } from "@/app/crm/v2.2/settings/recycle_bin/actions/permanent_delete/route";
import { POST as restore } from "@/app/crm/v2.2/settings/recycle_bin/actions/restore/route";
import { GET as bin } from "@/app/crm/v2.2/settings/recycle_bin/route";
import { DELETE as deleteTag, PUT as updateTag } from "@/app/crm/v2.2/settings/tags/[tagId]/route";
import { POST as createTag, GET as listTags } from "@/app/crm/v2.2/settings/tags/route";

const auth = vi.hoisted(() => ({ contexts: new Map<string, OrgContext>() }));
vi.mock("@crm/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@crm/core")>();
  return {
    ...actual,
    getSession: vi.fn(async (headers: Headers) =>
      headers.get("cookie") ? { user: { id: "admin" } } : null,
    ),
    requireOrgContext: vi.fn(async (_headers: Headers, slug: string) => {
      const ctx = auth.contexts.get(slug);
      if (!ctx) throw new NotFoundError();
      return ctx;
    }),
    listMembers: vi.fn(async () => [{ userId: "admin" }]),
    parseEnv: vi.fn(() => ({ APP_URL: "http://app.test" })),
  };
});

type Handler = typeof listTags;
let ctx: OrgContext;
let foreign: OrgContext;
let records: ReturnType<typeof createFixtureRecordService>;
let tagId: string;
let recordId: string;
let entryId: string;

async function call(
  handler: Handler,
  method: string,
  options: {
    body?: unknown;
    raw?: string;
    query?: string;
    params?: Record<string, string>;
    org?: string | null;
    session?: boolean;
    origin?: string | null;
    module?: string | null;
  } = {},
) {
  const headers = new Headers();
  if (options.session !== false) headers.set("cookie", "test-session");
  if (options.org !== null) headers.set("X-CRM-ORG", options.org ?? ctx.orgSlug);
  if (options.origin !== null) headers.set("Origin", options.origin ?? "http://app.test");
  return handler(
    new Request(
      `http://app.test/crm/v2.2/resource?${options.module === null ? "" : `module=${options.module ?? "Leads"}`}${options.query ?? ""}`,
      {
        method,
        headers,
        body:
          options.raw ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      },
    ),
    {
      params: Promise.resolve({
        tagId,
        recordId,
        ...([addTags, removeTags, getRecord].includes(handler) ? { module: "Leads" } : {}),
        ...options.params,
      }),
    },
  );
}

async function error(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
  const body = await response.json();
  expect(Object.keys(body).sort()).toEqual(["code", "details", "message", "status"]);
  expect(body.status).toBe("error");
  return body;
}

beforeEach(async () => {
  const context = (): OrgContext => ({
    orgId: randomUUID(),
    orgSlug: randomUUID(),
    orgName: "Test",
    userId: "admin",
    role: "admin",
  });
  ctx = context();
  foreign = context();
  auth.contexts.clear();
  for (const item of [ctx, foreign]) auth.contexts.set(item.orgSlug, item);
  records = createFixtureRecordService(ctx);
  tagId = (await records.tags.createTag("Leads", { name: "Priority" })).id;
  recordId = (await records.create("Leads", { Last_Name: "Example", Company: "Fixture" })).id;
  const deleted = await records.create("Leads", { Last_Name: "Recovery", Company: "Fixture" });
  await records.delete("Leads", [deleted.id]);
  entryId = (await records.recycleBin.list()).entries[0]?.id ?? "";
});

const routes = [
  { name: "catalogue list", handler: listTags, method: "GET", body: undefined },
  { name: "create", handler: createTag, method: "POST", body: { name: "New" } },
  { name: "update", handler: updateTag, method: "PUT", body: { name: "Renamed" } },
  { name: "delete", handler: deleteTag, method: "DELETE", body: undefined },
  { name: "add", handler: addTags, method: "POST", body: undefined },
  { name: "remove", handler: removeTags, method: "POST", body: undefined },
  { name: "bin list", handler: bin, method: "GET", body: undefined },
  { name: "restore", handler: restore, method: "POST", body: undefined },
  { name: "purge", handler: purge, method: "POST", body: undefined },
  { name: "empty", handler: empty, method: "POST", body: { scope: "organization", confirm: true } },
];

for (const route of routes)
  describe(route.name, () => {
    const body = () =>
      route.body ??
      ([addTags, removeTags].includes(route.handler) ? { ids: [tagId] } : { ids: [entryId] });
    it("serves success with no-store", async () => {
      const response = await call(route.handler, route.method, {
        body: ["GET", "DELETE"].includes(route.method) ? undefined : body(),
        module: route.handler === empty ? null : "Leads",
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
    });
    it("rejects missing session and organization without a redirect", async () => {
      await error(
        await call(route.handler, route.method, {
          session: false,
          body: route.method === "GET" ? undefined : body(),
        }),
        401,
      );
      await error(
        await call(route.handler, route.method, {
          org: null,
          body: route.method === "GET" ? undefined : body(),
        }),
        400,
      );
      await error(
        await call(route.handler, route.method, {
          org: "not-a-member",
          body: route.method === "GET" ? undefined : body(),
        }),
        404,
      );
    });
    if (route.method !== "GET")
      it("rejects absent or foreign Origin before mutation", async () => {
        for (const origin of [null, "http://elsewhere.test"])
          await error(await call(route.handler, route.method, { origin, body: body() }), 403);
        expect(await records.tags.listTags("Leads")).toHaveLength(1);
        expect((await records.recycleBin.list()).entries).toHaveLength(1);
      });
    it("isolates tenant state", async () => {
      const response = await call(route.handler, route.method, {
        org: foreign.orgSlug,
        body: ["GET", "DELETE"].includes(route.method) ? undefined : body(),
        module: route.handler === empty ? null : "Leads",
      });
      if (route.handler === createTag || route.handler === empty) expect(response.status).toBe(200);
      else if (route.method === "GET") expect(response.status).toBe(204);
      else await error(response, 404);
      expect(await records.tags.listTags("Leads")).toHaveLength(1);
      expect((await records.recycleBin.list()).entries).toHaveLength(1);
    });
    it("returns a four-key error for malformed input", async () => {
      const response = await call(route.handler, route.method, {
        query: route.method === "GET" ? "&page=0" : undefined,
        module: route.method === "DELETE" ? null : "Leads",
        raw: ["GET", "DELETE"].includes(route.method) ? undefined : "{",
      });
      await error(response, 400);
    });
  });

it("pages and searches the tag catalogue; ignores extension query hints", async () => {
  await records.tags.createTag("Leads", { name: "Second" });
  const response = await call(listTags, "GET", { query: "&per_page=1&future_hint=yes" });
  expect(await response.json()).toMatchObject({
    tags: [{ id: tagId }],
    info: { page: 1, per_page: 1, count: 1, more_records: true },
  });
  expect((await call(listTags, "GET", { query: "&page=3&per_page=1" })).status).toBe(204);
  expect((await call(listTags, "GET", { query: "&name=missing" })).status).toBe(204);
  expect(await (await call(listTags, "GET", { query: "&name=PRIOR" })).json()).toMatchObject({
    tags: [{ id: tagId }],
  });
  for (const query of [
    "&per_page=-1",
    "&page=1.5",
    "&page=9007199254740992",
    "&page=9007199254740991&per_page=2",
  ])
    await error(await call(listTags, "GET", { query }), 400);
});

it("keeps links stable through rename/recolor, idempotent assignment and removal", async () => {
  for (let i = 0; i < 2; i++) await call(addTags, "POST", { body: { ids: [tagId] } });
  expect(await records.tags.listRecordTags("Leads", recordId)).toHaveLength(1);
  await call(updateTag, "PUT", { body: { name: "Updated" } });
  await call(updateTag, "PUT", { body: { color: "#112233" } });
  expect(await records.tags.listRecordTags("Leads", recordId)).toMatchObject([
    { id: tagId, name: "Updated", color: "#112233" },
  ]);
  await call(removeTags, "POST", { body: { ids: [tagId] } });
  expect(await records.tags.listRecordTags("Leads", recordId)).toEqual([]);
  await call(addTags, "POST", { body: { ids: [tagId] } });
  await call(deleteTag, "DELETE");
  expect(await records.tags.listRecordTags("Leads", recordId)).toEqual([]);
});

it("rejects invalid or combined tag edits without partial mutation", async () => {
  for (const body of [
    { name: "" },
    { name: 50 },
    { color: [] },
    { color: "red" },
    { name: "New", color: "red" },
    {},
    { extra: 1 },
  ])
    await error(await call(updateTag, "PUT", { body }), 400);
  expect(await records.tags.listTags("Leads")).toMatchObject([{ name: "Priority", color: null }]);
  await error(await call(createTag, "POST", { body: { name: " priority " } }), 400);
  await error(await call(createTag, "POST", { body: { name: "x".repeat(51) } }), 400);
});

it("rejects foreign/module tag targets atomically", async () => {
  const foreignTag = await createFixtureRecordService(foreign).tags.createTag("Leads", {
    name: "Foreign",
  });
  const otherModule = await records.tags.createTag("Contacts", { name: "Other" });
  for (const id of [foreignTag.id, otherModule.id]) {
    await error(await call(addTags, "POST", { body: { ids: [tagId, id] } }), 404);
    await error(await call(removeTags, "POST", { body: { ids: [id] } }), 404);
    await error(
      await call(updateTag, "PUT", { params: { tagId: id }, body: { name: "Attempt" } }),
      404,
    );
    await error(await call(deleteTag, "DELETE", { params: { tagId: id } }), 404);
  }
  expect(await records.tags.listRecordTags("Leads", recordId)).toEqual([]);
});

it("restores ordinary reads and prevents resurrection after purge or empty", async () => {
  const entry = (await records.recycleBin.list()).entries[0];
  if (!entry) throw new Error("Missing entry");
  await expect(records.get("Leads", entry.recordId)).rejects.toBeInstanceOf(NotFoundError);
  await error(await call(getRecord, "GET", { params: { recordId: entry.recordId } }), 404);
  await call(restore, "POST", { body: { ids: [entryId] } });
  expect((await records.get("Leads", entry.recordId)).id).toBe(entry.recordId);
  expect(
    await (await call(getRecord, "GET", { params: { recordId: entry.recordId } })).json(),
  ).toMatchObject({ data: [{ id: entry.recordId }] });
  for (const handler of [purge, empty]) {
    await records.delete("Leads", [entry.recordId]);
    const id = (await records.recycleBin.list()).entries[0]?.id;
    await call(handler, "POST", {
      body: handler === empty ? { scope: "organization", confirm: true } : { ids: [id] },
      module: handler === empty ? null : "Leads",
      query: handler === empty ? undefined : "&name=ignored-extension",
    });
    await expect(records.get("Leads", entry.recordId)).rejects.toBeInstanceOf(NotFoundError);
    await error(await call(restore, "POST", { body: { ids: [id] } }), 404);
    await error(await call(getRecord, "GET", { params: { recordId: entry.recordId } }), 404);
    if (handler === purge)
      await records.create("Leads", { Last_Name: "Other", Company: "Fixture" }).then((row) => {
        entry.recordId = row.id;
      });
  }
});

it("requires explicit destructive selection/confirmation; malformed filters never broaden scope", async () => {
  for (const handler of [restore, purge, addTags, removeTags])
    for (const body of [
      {},
      { ids: [] },
      { ids: [null] },
      { ids: [""] },
      { ids: "all" },
      { ids: Array(501).fill("x") },
      { ids: [entryId], filters: {} },
    ])
      await error(await call(handler, "POST", { body }), 400);
  for (const body of [
    {},
    { confirm: true },
    { scope: "organization", confirm: false },
    { scope: "filtered", confirm: true },
    { scope: "organization", confirm: true, ids: [] },
  ])
    await error(await call(empty, "POST", { body }), 400);
  await error(
    await call(empty, "POST", {
      body: { scope: "organization", confirm: true },
      query: "&name=Recovery",
    }),
    400,
  );
  expect((await records.recycleBin.list()).entries).toHaveLength(1);
  await error(await call(purge, "POST", { body: { ids: [entryId, "missing"] } }), 404);
  expect((await records.recycleBin.list()).entries).toHaveLength(1);
});

it("searches the authorized bin before paging and validates supported criteria", async () => {
  const another = await records.create("Leads", { Last_Name: "Other", Company: "Fixture" });
  await records.delete("Leads", [another.id]);
  const date = (await records.recycleBin.list()).entries[0]?.deletedAt.slice(0, 10);
  const response = await call(bin, "GET", {
    query: `&per_page=1&name=Reco&deleted_by=admin&deleted_by_contains=ADM&deleted_date=${date}`,
  });
  expect(await response.json()).toMatchObject({
    data: [{ id: entryId, Name: "Recovery", Type: "Leads" }],
    info: { count: 1, more_records: false },
  });
  expect(await (await call(bin, "GET", { query: "&per_page=1" })).json()).toMatchObject({
    info: { count: 1, more_records: true },
  });
  for (const query of [
    "&page=3&per_page=1",
    "&name=absent",
    "&deleted_by=other",
    "&deleted_by_contains=other",
    "&deleted_date=2000-01-01",
  ])
    expect((await call(bin, "GET", { query })).status).toBe(204);
  expect((await call(bin, "GET", { module: "Contacts" })).status).toBe(204);
  for (const query of [
    "&deleted_time=01:00",
    "&deleted_date=2026-02-30",
    "&deleted_date=bad",
    "&deleted_date=2026-10-17&deleted_time=25:00",
    "&criteria=bad",
    "&filters={}",
    "&name=",
  ])
    await error(await call(bin, "GET", { query }), 400);
});

it("enforces the service's member visibility and admin-only purge/empty rules", async () => {
  auth.contexts.set(ctx.orgSlug, { ...ctx, userId: "member", role: "member" });
  expect((await call(bin, "GET")).status).toBe(204);
  await error(await call(restore, "POST", { body: { ids: [entryId] } }), 404);
  await error(await call(purge, "POST", { body: { ids: [entryId] } }), 403);
  await error(
    await call(empty, "POST", { body: { scope: "organization", confirm: true }, module: null }),
    403,
  );
  expect((await records.recycleBin.list()).entries).toHaveLength(1);
});
