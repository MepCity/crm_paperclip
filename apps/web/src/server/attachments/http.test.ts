import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createUploadBatchRegistry, LocalDiskBlobStore } from "@crm/core/attachments";
import type { OrgContext } from "@crm/core/records";
import {
  createFixtureAttachmentLifecycle,
  createFixtureRecordService,
} from "@crm/core/records/fixture";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type AttachmentDeps, type AttachmentParams, handleAttachmentRequest } from "./http";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "attachments-http-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function setup(orgId: string = randomUUID(), blobDir = dir) {
  const ctx: OrgContext = {
    orgId,
    orgSlug: "attachments-http",
    orgName: "Fixture Organization",
    userId: "test-user",
    role: "admin",
  };
  const deps: AttachmentDeps = {
    ctx,
    records: createFixtureRecordService(ctx),
    lifecycle: createFixtureAttachmentLifecycle(ctx),
    blobs: new LocalDiskBlobStore(blobDir),
    batches: createUploadBatchRegistry(),
    memberNames: async () => new Map([["test-user", "Test User"]]),
  };
  return deps;
}

const PDF = () => new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\n");
const call = (
  deps: AttachmentDeps,
  params: AttachmentParams,
  init: RequestInit & { query?: string } = {},
) =>
  handleAttachmentRequest(
    deps,
    params,
    new Request(`http://localhost/crm/v2.2/x${init.query ?? ""}`, init),
  );
const form = (entries: Record<string, string | File>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.set(name, value);
  return data;
};
const pdf = (name = "report.pdf") => new File([PDF()], name, { type: "application/pdf" });
async function lead(deps: AttachmentDeps) {
  return (await deps.records.create("Leads", { Last_Name: "Example", Company: "Example Co" })).id;
}
const post = (deps: AttachmentDeps, id: string, body: FormData, batch?: string, module = "Leads") =>
  call(
    deps,
    { module, recordId: id },
    {
      method: "POST",
      body,
      headers: batch ? { "X-Upload-Batch": batch } : {},
    },
  );

describe("Attachments HTTP handlers", () => {
  it("uploads a file, lists it, downloads it and deletes it", async () => {
    const deps = setup();
    const id = await lead(deps);
    const created = await post(deps, id, form({ file: pdf() }));
    expect(created.status).toBe(201);
    const { data } = await created.json();
    expect(data[0]).toMatchObject({
      code: "SUCCESS",
      details: { File_Name: "report.pdf", Size: PDF().length, $type: "file" },
    });
    const attachmentId = data[0].details.id;

    const listed = await call(deps, { module: "Leads", recordId: id });
    expect(listed.status).toBe(200);
    const body = await listed.json();
    expect(body.info).toEqual({ page: 1, per_page: 20, count: 1, more_records: false });
    expect(body.data[0]).toMatchObject({
      id: attachmentId,
      File_Name: "report.pdf",
      $type: "file",
      Created_By: { id: "test-user", name: "Test User" },
    });
    expect(body.data[0]).not.toHaveProperty("$link_url");

    const params = { module: "Leads", recordId: id, attachmentId };
    const downloaded = await call(deps, params);
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers.get("x-content-type-options")).toBe("nosniff");
    expect(downloaded.headers.get("cache-control")).toBe("private, no-store");
    expect(downloaded.headers.get("content-disposition")).toContain("filename*=UTF-8''report.pdf");
    expect(new Uint8Array(await downloaded.arrayBuffer())).toEqual(PDF());

    const removed = await call(deps, params, { method: "DELETE" });
    expect(removed.status).toBe(200);
    expect(await removed.json()).toEqual({ data: [{ code: "SUCCESS" }] });
    expect(deps.lifecycle.cleanupIntents()).toEqual([]);
    expect((await call(deps, { module: "Leads", recordId: id })).status).toBe(204);
    expect((await call(deps, params)).status).toBe(404);
  });

  it("adds a link and refuses to download it", async () => {
    const deps = setup();
    const id = await lead(deps);
    const created = await post(deps, id, form({ attachmentUrl: "https://example.test/doc" }));
    expect(created.status).toBe(201);
    const attachmentId = (await created.json()).data[0].details.id;
    const listed = await (await call(deps, { module: "Leads", recordId: id })).json();
    expect(listed.data[0]).toMatchObject({ $type: "link", $link_url: "https://example.test/doc" });
    const response = await call(deps, { module: "Leads", recordId: id, attachmentId });
    expect(response.status).toBe(409);
    const bad = await post(deps, id, form({ attachmentUrl: "javascript:alert(1)" }));
    expect(bad.status).toBe(400);
  });

  it("rejects both inputs or none with INVALID_DATA", async () => {
    const deps = setup();
    const id = await lead(deps);
    for (const body of [form({}), form({ file: pdf(), attachmentUrl: "https://example.test" })]) {
      const response = await post(deps, id, body);
      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe("INVALID_DATA");
    }
  });

  it("rejects disallowed types and mismatching content with 415", async () => {
    const deps = setup();
    const id = await lead(deps);
    const html = new File(["<html></html>"], "page.html", { type: "text/html" });
    const fake = new File(["not a pdf"], "fake.pdf", { type: "application/pdf" });
    for (const file of [html, fake]) {
      const response = await post(deps, id, form({ file }));
      expect(response.status).toBe(415);
      expect((await response.json()).code).toBe("TYPE_NOT_ALLOWED");
    }
    expect((await call(deps, { module: "Leads", recordId: id })).status).toBe(204);
    expect(deps.lifecycle.cleanupIntents()).toEqual([]);
  });

  it("enforces the batch file count (10 accepted, 11th rejected)", async () => {
    const deps = setup();
    const id = await lead(deps);
    const batch = randomUUID();
    for (let n = 0; n < 10; n++)
      expect((await post(deps, id, form({ file: pdf(`f${n}.pdf`) }), batch)).status).toBe(201);
    const over = await post(deps, id, form({ file: pdf("f10.pdf") }), batch);
    expect(over.status).toBe(413);
    expect((await over.json()).code).toBe("LIMIT_EXCEEDED");
    expect((await post(deps, id, form({ file: pdf("other.pdf") }), randomUUID())).status).toBe(201);
  });

  it("enforces the batch byte budget at the exact limit for note parents", async () => {
    const deps = setup();
    const leadId = await lead(deps);
    const note = await deps.records.create("Notes", {
      Parent_Id: { module: "Leads", id: leadId },
      Note_Content: "Body",
    });
    const text = (bytes: number, name: string) =>
      new File([new Uint8Array(bytes).fill(97)], name, { type: "text/plain" });
    const batch = randomUUID();
    const first = await post(
      deps,
      note.id,
      form({ file: text(10_000_000, "a.txt") }),
      batch,
      "Notes",
    );
    expect(first.status).toBe(201);
    const exact = await post(
      deps,
      note.id,
      form({ file: text(10_000_000, "b.txt") }),
      batch,
      "Notes",
    );
    expect(exact.status).toBe(201);
    const over = await post(deps, note.id, form({ file: text(1, "c.txt") }), batch, "Notes");
    expect(over.status).toBe(413);
    const single = await post(
      deps,
      note.id,
      form({ file: text(20_000_001, "d.txt") }),
      randomUUID(),
      "Notes",
    );
    expect(single.status).toBe(413);
  });

  it("returns 404 for a missing parent, an unsupported module and a foreign organization", async () => {
    const deps = setup();
    const id = await lead(deps);
    expect((await call(deps, { module: "Leads", recordId: "999" })).status).toBe(404);
    expect((await post(deps, "999", form({ file: pdf() }))).status).toBe(404);
    expect((await call(deps, { module: "Tasks", recordId: id })).status).toBe(404);
    const created = await post(deps, id, form({ file: pdf() }));
    const attachmentId = (await created.json()).data[0].details.id;
    const other = setup(randomUUID());
    expect((await call(other, { module: "Leads", recordId: id, attachmentId })).status).toBe(404);
    const otherLead = await lead(deps);
    expect((await call(deps, { module: "Leads", recordId: otherLead, attachmentId })).status).toBe(
      404,
    );
  });

  it("encodes Turkish, quoted and slash-containing names in the download header", async () => {
    const deps = setup();
    const id = await lead(deps);
    const name = 'Çalışma "özet".pdf';
    const created = await post(deps, id, form({ file: pdf(name) }));
    expect(created.status).toBe(201);
    const attachmentId = (await created.json()).data[0].details.id;
    const response = await call(deps, { module: "Leads", recordId: id, attachmentId });
    const header = response.headers.get("content-disposition") ?? "";
    expect(header.startsWith("attachment;")).toBe(true);
    expect(header).toContain("filename*=UTF-8''");
    expect(header).toContain("%C3%87"); // Ç
    expect(header).toContain("%22"); // quote
    expect(header).toMatch(/^attachment; filename="[^"\\]*"; filename\*=/);
    const slashed = await post(deps, id, form({ file: pdf("dir/evil.pdf") }));
    const slashId = (await slashed.json()).data[0].details.id;
    const slashHeader =
      (await call(deps, { module: "Leads", recordId: id, attachmentId: slashId })).headers.get(
        "content-disposition",
      ) ?? "";
    expect(slashHeader).toContain("filename*=UTF-8''evil.pdf");
  });

  it("retains the cleanup intent when blob deletion fails during removal", async () => {
    const deps = setup();
    const id = await lead(deps);
    const created = await post(deps, id, form({ file: pdf() }));
    const attachmentId = (await created.json()).data[0].details.id;

    deps.blobs.delete = async () => {
      throw new Error("Disk write error");
    };

    const removed = await call(
      deps,
      { module: "Leads", recordId: id, attachmentId },
      { method: "DELETE" },
    );
    expect(removed.status).toBe(200);
    const intents = deps.lifecycle.cleanupIntents();
    expect(intents.length).toBe(1);
    expect(intents[0]?.attachmentId).toBe(attachmentId);
  });

  it("validates pagination parameters and handles multi-page listing", async () => {
    const deps = setup();
    const id = await lead(deps);
    const badPage = await call(deps, { module: "Leads", recordId: id }, { query: "?page=0" });
    expect(badPage.status).toBe(400);
    expect((await badPage.json()).code).toBe("INVALID_DATA");

    const badPerPage = await call(
      deps,
      { module: "Leads", recordId: id },
      { query: "?per_page=-5" },
    );
    expect(badPerPage.status).toBe(400);
    expect((await badPerPage.json()).code).toBe("INVALID_DATA");

    await post(deps, id, form({ file: pdf("1.pdf") }));
    await post(deps, id, form({ file: pdf("2.pdf") }));

    const page1 = await call(
      deps,
      { module: "Leads", recordId: id },
      { query: "?page=1&per_page=1" },
    );
    expect(page1.status).toBe(200);
    const body1 = await page1.json();
    expect(body1.info).toEqual({ page: 1, per_page: 1, count: 1, more_records: true });
    expect(body1.data.length).toBe(1);

    const page2 = await call(
      deps,
      { module: "Leads", recordId: id },
      { query: "?page=2&per_page=1" },
    );
    expect(page2.status).toBe(200);
    const body2 = await page2.json();
    expect(body2.info).toEqual({ page: 2, per_page: 1, count: 1, more_records: false });

    const page3 = await call(
      deps,
      { module: "Leads", recordId: id },
      { query: "?page=3&per_page=1" },
    );
    expect(page3.status).toBe(204);
  });

  it("rejects invalid upload batch header and unsupported methods", async () => {
    const deps = setup();
    const id = await lead(deps);
    const badBatch = await post(deps, id, form({ file: pdf() }), "invalid-uuid");
    expect(badBatch.status).toBe(400);
    expect((await badBatch.json()).code).toBe("INVALID_DATA");

    const unsupported = await call(deps, { module: "Leads", recordId: id }, { method: "PUT" });
    expect(unsupported.status).toBe(405);
  });
});
