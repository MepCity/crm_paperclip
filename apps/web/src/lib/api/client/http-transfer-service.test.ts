import type { ImportSettings } from "@crm/core";
import { NotFoundError } from "@crm/core/errors";
import { describe, expect, it, vi } from "vitest";
import { encodeError } from "@/lib/api/wire/errors";
import { createHttpTransferClient } from "./http-transfer-service";

function setup(response?: Response) {
  const calls: { path: string; options: Record<string, unknown> | undefined }[] = [];
  const fetchFn = vi.fn(async (path: string, options?: Record<string, unknown>) => {
    calls.push({ path, options });
    return { ok: true };
  });
  const raw = vi.fn(async () => response ?? new Response("a,b\n", { headers: csvHeaders }));
  const client = createHttpTransferClient("acme", {
    fetch: fetchFn as never,
    fetchRaw: raw as never,
  });
  return { client, calls, raw };
}
const csvHeaders = {
  "Content-Type": "text/csv; charset=utf-8",
  "Content-Disposition": `attachment; filename="export.csv"; filename*=UTF-8''caf%C3%A9.csv`,
};

describe("http transfer client", () => {
  it("posts multipart previews with charset and the single file", async () => {
    const { client, calls } = setup();
    await client.previewImport("Leads", {
      file: new File(["x"], "leads.csv"),
      charset: "ISO-8859-1",
    });
    const [call] = calls;
    expect(call?.path).toBe("/crm/v2.2/Leads/actions/import_preview");
    expect(call?.options?.method).toBe("POST");
    const form = call?.options?.form as FormData;
    expect(form.get("charset")).toBe("ISO-8859-1");
    expect((form.get("file") as File).name).toBe("leads.csv");
  });

  it("sends JSON bodies and routes history, undo and export", async () => {
    const { client, calls } = setup();
    const settings = {
      mode: "add",
      ignoreEmptyOnUpdate: false,
      mapping: [],
      defaults: [],
    } satisfies ImportSettings;
    await client.runImport("Contacts", "u1", settings);
    await client.listImports();
    await client.getImport("i 1");
    await client.undoImport("i1");
    await client.runExport({ module: "Deals", fields: "all", ids: ["1"] });
    await client.listExports();
    expect(calls.map((c) => [c.options?.method ?? "GET", c.path])).toEqual([
      ["POST", "/crm/v2.2/Contacts/actions/import"],
      ["GET", "/crm/v9/settings/imports"],
      ["GET", "/crm/v9/settings/imports/i%201"],
      ["POST", "/crm/v9/settings/imports/i1/actions/undo"],
      ["POST", "/crm/v2.2/Deals/actions/export"],
      ["GET", "/crm/v9/settings/exports"],
    ]);
    expect(calls[0]?.options?.body).toEqual({ uploadId: "u1", settings });
    expect(calls[4]?.options?.body).toEqual({ fields: "all", ids: ["1"] });
  });

  it.each(["Tasks", "Events", "Calls"] as const)("%s uses activity API paths", async (module) => {
    const { client, calls } = setup();
    await client.previewImport(module, { file: new Blob(["Subject\nExample"]), charset: "UTF-8" });
    await client.runImport(module, "upload", {
      mode: "add",
      ignoreEmptyOnUpdate: false,
      mapping: [],
      defaults: [],
    });
    await client.runExport({ module, fields: "all" });
    expect(calls.map((call) => call.path)).toEqual([
      `/crm/v2.2/${module}/actions/import_preview`,
      `/crm/v2.2/${module}/actions/import`,
      `/crm/v2.2/${module}/actions/export`,
    ]);
    expect(client.sampleCsvUrl(module)).toBe(`/crm/v2.2/${module}/actions/import_sample?org=acme`);
  });

  it.each(["Solutions", "Cases"] as const)("%s posts the shared export payload", async (module) => {
    const { client, calls } = setup();
    await client.runExport({ module, fields: { include: ["id"] }, viewId: "example-view" });
    expect(calls).toEqual([
      {
        path: `/crm/v2.2/${module}/actions/export`,
        options: expect.objectContaining({
          method: "POST",
          body: {
            fields: { include: ["id"] },
            viewId: "example-view",
          },
        }),
      },
    ]);
  });

  it("builds download URLs and reads the decoded file name", async () => {
    const { client, raw } = setup();
    expect(client.exportDownloadUrl("e1")).toBe("/crm/v9/settings/exports/e1/download?org=acme");
    expect(client.sampleCsvUrl("Leads")).toBe("/crm/v2.2/Leads/actions/import_sample?org=acme");
    const file = await client.downloadExport("e1");
    expect(file.fileName).toBe("café.csv");
    expect(await file.blob.text()).toBe("a,b\n");
    expect(raw).toHaveBeenCalledWith(
      "/crm/v9/settings/exports/e1/download",
      expect.objectContaining({ headers: { "X-CRM-ORG": "acme" } }),
    );
  });

  it("decodes error bodies from a failed download", async () => {
    const { client } = setup(Response.json(encodeError(new NotFoundError()).body, { status: 404 }));
    await expect(client.sampleCsv("Leads")).rejects.toMatchObject({ code: "not_found" });
  });
});
