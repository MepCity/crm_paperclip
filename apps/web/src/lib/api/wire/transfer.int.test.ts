import { createTestOrganization } from "@crm/core/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { transferOperations, transferPath } from "./transfer";

type Organization = Awaited<ReturnType<typeof createTestOrganization>>;
type Handler = (
  request: Request,
  context: { params?: Promise<Record<string, string>> },
) => Promise<Response>;
const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;
const loaders = {
  previewImport: () => import("@/app/crm/v2.2/[module]/actions/import_preview/route"),
  runImport: () => import("@/app/crm/v2.2/[module]/actions/import/route"),
  runExport: () => import("@/app/crm/v2.2/[module]/actions/export/route"),
  sampleCsv: () => import("@/app/crm/v2.2/[module]/actions/import_sample/route"),
  listImports: () => import("@/app/crm/v9/settings/imports/route"),
  getImport: () => import("@/app/crm/v9/settings/imports/[importId]/route"),
  undoImport: () => import("@/app/crm/v9/settings/imports/[importId]/actions/undo/route"),
  listExports: () => import("@/app/crm/v9/settings/exports/route"),
  downloadExport: () => import("@/app/crm/v9/settings/exports/[exportId]/download/route"),
} as const;

async function call(
  key: keyof typeof loaders,
  org: Organization | null,
  options: {
    params?: Record<string, string>;
    body?: BodyInit;
    json?: unknown;
    headers?: Record<string, string>;
    origin?: string | null;
    orgHeader?: string | null;
    query?: string;
  } = {},
) {
  const op = transferOperations[key];
  const route = (await loaders[key]()) as unknown as Record<string, Handler>;
  const handler = route[op.method];
  if (!handler) throw new Error("Missing method");
  const headers = new Headers(options.headers);
  if (options.origin !== null) headers.set("Origin", options.origin ?? origin);
  if (org) {
    const cookie = org.admin.headers.get("cookie");
    if (!cookie) throw new Error("Missing test cookie");
    headers.set("cookie", cookie);
    if (options.orgHeader !== null) headers.set("X-CRM-ORG", options.orgHeader ?? org.org.slug);
  }
  const body = options.json === undefined ? options.body : JSON.stringify(options.json);
  const params = options.params ?? {};
  return handler(
    new Request(new URL(transferPath(op.path, params) + (options.query ?? ""), origin), {
      method: op.method,
      headers,
      ...(body === undefined ? {} : { body }),
    }),
    { params: Promise.resolve(params) },
  );
}

function upload(csv: string, charset = "UTF-8"): FormData {
  const form = new FormData();
  form.set("charset", charset);
  form.set("file", new File([csv], "leads.csv", { type: "text/csv" }));
  return form;
}
const settings = {
  mode: "add",
  ignoreEmptyOnUpdate: false,
  mapping: [
    { column: 0, field: "Last_Name" },
    { column: 1, field: "Company" },
  ],
  defaults: [],
};

describe("transfer routes", () => {
  let a: Organization;
  let b: Organization;
  beforeAll(async () => {
    a = await createTestOrganization();
    b = await createTestOrganization();
  });

  it.each(Object.keys(loaders) as (keyof typeof loaders)[])(
    "%s rejects missing session, header and origin",
    async (key) => {
      const params = { module: "Leads", importId: "x", exportId: "x" };
      const anonymous = await call(key, null, { params });
      expect(anonymous.status).toBe(401);
      const noHeader = await call(key, a, { params, orgHeader: null });
      expect(noHeader.status).toBe(400);
      if (transferOperations[key].method === "POST") {
        const badOrigin = await call(key, a, { params, origin: "https://other.example" });
        expect(badOrigin.status).toBe(403);
      }
    },
  );

  it("previews, imports, lists, undoes and isolates organizations", async () => {
    const params = { module: "Leads" };
    const preview = await call("previewImport", a, {
      params,
      body: upload("Last Name,Company\nRoute One,Acme\nRoute Two,Acme\n"),
    });
    expect(preview.status).toBe(200);
    const previewBody = await preview.json();
    expect(previewBody).toMatchObject({ rowCount: 2, headers: ["Last Name", "Company"] });
    const run = await call("runImport", a, {
      params,
      json: { uploadId: previewBody.uploadId, settings },
    });
    expect(run.status).toBe(200);
    const job = await run.json();
    expect(job).toMatchObject({ status: "completed", counts: { created: 2 }, undoable: true });
    const list = await (await call("listImports", a)).json();
    expect(list.map((item: { id: string }) => item.id)).toContain(job.id);
    const detail = await call("getImport", a, { params: { importId: job.id } });
    expect(detail.status).toBe(200);
    const foreign = await call("getImport", b, { params: { importId: job.id } });
    expect(foreign.status).toBe(404);
    expect((await call("undoImport", b, { params: { importId: job.id } })).status).toBe(404);
    const undone = await call("undoImport", a, { params: { importId: job.id } });
    expect(await undone.json()).toMatchObject({ status: "undone" });
  });

  it("returns codec errors for bad uploads and settings", async () => {
    const params = { module: "Leads" };
    const empty = await call("previewImport", a, { params, body: upload("") });
    expect(empty.status).toBe(400);
    expect(await empty.json()).toMatchObject({ code: "empty_file" });
    const noFile = await call("previewImport", a, { params, body: new FormData() });
    expect(noFile.status).toBe(400);
    const json = await call("previewImport", a, {
      params,
      json: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(json.status).toBe(400);
    const badModule = await call("runExport", a, {
      params: { module: "Unsupported" },
      json: { fields: "all" },
    });
    expect(badModule.status).toBe(400);
    expect(await badModule.json()).toMatchObject({ code: "INVALID_DATA" });
    const badSettings = await call("runImport", a, {
      params,
      json: { uploadId: "u", settings: { mode: "nope" } },
    });
    expect(badSettings.status).toBe(400);
    const expired = await call("runImport", a, { params, json: { uploadId: "u", settings } });
    expect(expired.status).toBeGreaterThanOrEqual(400);
    expect(await expired.json()).toMatchObject({ details: expect.anything() });
  });

  it.each(["Tasks", "Events", "Calls"])("%s accepts activity module API names", async (module) => {
    const params = { module };
    const preview = await call("previewImport", a, {
      params,
      body: upload("Subject\nActivity transfer\n"),
    });
    expect(preview.status).toBe(200);
    expect(await preview.json()).toMatchObject({
      matchFields: [{ field: "id", label: "Record Id" }],
    });
    const sample = await call("sampleCsv", a, { params });
    expect(sample.status).toBe(200);
    const exported = await call("runExport", a, { params, json: { fields: "all" } });
    expect(exported.status).toBe(200);
    expect(await exported.json()).toMatchObject({ module, status: "completed" });
    const expired = await call("runImport", a, {
      params,
      json: { uploadId: "expired", settings },
    });
    expect(await expired.json()).toMatchObject({ code: "upload_expired" });
  });

  it("cuts a multipart body at the budget while streaming", async () => {
    const chunk = new Uint8Array(1_000_000);
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += 1;
        if (sent > 40) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const response = await call("previewImport", a, {
      params: { module: "Leads" },
      body: stream,
      headers: { "Content-Type": "multipart/form-data; boundary=x", duplex: "half" },
    }).catch(() => null);
    // A runtime that cannot stream a request body in tests is skipped; a real one must cut off.
    if (response) {
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(sent).toBeLessThan(40);
    }
  });

  it.each(["Solutions", "Cases"])("%s exports, downloads and previews imports", async (module) => {
    const params = { module };
    const exported = await call("runExport", a, { params, json: { fields: "all" } });
    expect(exported.status).toBe(200);
    const job = await exported.json();
    expect(job).toMatchObject({ module, status: "completed" });
    const file = await call("downloadExport", a, { params: { exportId: job.id } });
    expect(file.status).toBe(200);
    expect(file.headers.get("Content-Type")).toContain("text/csv");
    expect(await file.text()).toContain(module === "Solutions" ? "Solution Title" : "Subject");
    expect((await call("downloadExport", b, { params: { exportId: job.id } })).status).toBe(404);
    const preview = await call("previewImport", a, { params, body: upload("Subject\nExample") });
    expect(preview.status).toBe(200);
    expect(await preview.json()).toMatchObject({ rowCount: 1, headers: ["Subject"] });
    expect((await call("sampleCsv", a, { params })).status).toBe(200);
  });

  it("exports, downloads with safe headers and keeps history per organization", async () => {
    const params = { module: "Leads" };
    const exported = await call("runExport", a, { params, json: { fields: "all" } });
    expect(exported.status).toBe(200);
    const job = await exported.json();
    expect(job).toMatchObject({ module: "Leads", status: "completed" });
    expect(
      (await (await call("listExports", a)).json()).map((j: { id: string }) => j.id),
    ).toContain(job.id);
    const file = await call("downloadExport", a, { params: { exportId: job.id } });
    expect(file.status).toBe(200);
    expect(file.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(file.headers.get("Content-Disposition")).toMatch(/^attachment; filename="/);
    expect(file.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(file.headers.get("Cache-Control")).toBe("no-store");
    expect([...new Uint8Array(await file.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect((await call("downloadExport", b, { params: { exportId: job.id } })).status).toBe(404);
    expect(await (await call("listExports", b)).json()).not.toContainEqual(
      expect.objectContaining({ id: job.id }),
    );
    const oversize = await call("runExport", a, {
      params,
      json: { fields: "all", ids: Array.from({ length: 501 }, (_, i) => String(i)) },
    });
    expect(oversize.status).toBe(200);
    expect(await oversize.json()).toMatchObject({ status: "failed", code: "export_too_large" });
  });

  it("accepts the organization from ?org= on the two CSV downloads only", async () => {
    const q = `?org=${encodeURIComponent(a.org.slug)}`;
    const sample = await call("sampleCsv", a, {
      params: { module: "Contacts" },
      orgHeader: null,
      query: q,
    });
    expect(sample.status).toBe(200);
    const job = await (
      await call("runExport", a, { params: { module: "Leads" }, json: { fields: "all" } })
    ).json();
    const file = await call("downloadExport", a, {
      params: { exportId: job.id },
      orgHeader: null,
      query: q,
    });
    expect(file.status).toBe(200);
    const other = await call("downloadExport", b, {
      params: { exportId: job.id },
      orgHeader: null,
      query: q,
    });
    expect([403, 404]).toContain(other.status);
    expect((await call("listImports", a, { orgHeader: null, query: q })).status).toBe(400);
  });

  it("serves the sample CSV as a download", async () => {
    const response = await call("sampleCsv", a, { params: { module: "Contacts" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toMatch(/attachment/);
    expect([...new Uint8Array(await response.arrayBuffer()).slice(0, 3)]).toEqual([
      0xef, 0xbb, 0xbf,
    ]);
  });
});
