import type { OrgContext, TransferService } from "@crm/core";
import { AppError, ValidationError } from "@crm/core/errors";
import { describe, expect, it, type Mock, vi } from "vitest";
import {
  csvDownload,
  TRANSFER_FILE_BYTES,
  TRANSFER_MODULES,
  type TransferInput,
  transferOperations,
  transferPath,
} from "./transfer";

const ctx = {} as OrgContext;
const rawText = async (res: Response) =>
  new TextDecoder("utf-8", { ignoreBOM: true }).decode(await res.arrayBuffer());

function input(over: Partial<TransferInput> & { body?: string } = {}): TransferInput {
  const { body, ...rest } = over;
  return {
    ctx,
    request: new Request("http://localhost/x", {
      method: "POST",
      ...(body === undefined ? {} : { body }),
    }),
    params: { module: "Leads" },
    query: {},
    ...rest,
  };
}

function service(over: Record<string, unknown> = {}) {
  return {
    previewImport: vi.fn(async () => "preview"),
    runImport: vi.fn(async () => "ran"),
    runExport: vi.fn(async () => "exported"),
    sampleCsv: vi.fn(async () => ({ fileName: "s.csv", body: "a,b" })),
    listImports: vi.fn(async () => ["i"]),
    getImport: vi.fn(async () => "imp"),
    undoImport: vi.fn(async () => "undone"),
    listExports: vi.fn(async () => ["e"]),
    downloadExport: vi.fn(async () => ({ fileName: "e.csv", body: "x" })),
    ...over,
  } as unknown as { [K in keyof TransferService]: Mock } & TransferService;
}

async function rejection(promise: Promise<unknown> | (() => unknown)) {
  try {
    await (typeof promise === "function" ? promise() : promise);
  } catch (error) {
    return error;
  }
  throw new Error("expected rejection");
}

async function fieldErrors(promise: Promise<unknown> | (() => unknown)) {
  const error = await rejection(promise);
  expect(error).toBeInstanceOf(ValidationError);
  return (error as ValidationError).fieldErrors;
}

const goodSettings = {
  mode: "add",
  ignoreEmptyOnUpdate: false,
  mapping: [{ column: 0, field: "Email" }],
  defaults: [],
};

function runImportWith(body: unknown, svc = service()) {
  return transferOperations.runImport.run(svc, input({ body: JSON.stringify(body) }));
}

describe("constants and paths", () => {
  it("exposes the modules and the file budget", () => {
    expect(TRANSFER_MODULES).toEqual(["Leads", "Contacts", "Accounts", "Deals"]);
    expect(TRANSFER_FILE_BYTES).toBe(25_000_000);
  });

  it("fills and encodes path params, empty when missing", () => {
    expect(transferPath("/a/{module}/b/{id}", { module: "Leads", id: "a/b c" })).toBe(
      "/a/Leads/b/a%2Fb%20c",
    );
    expect(transferPath("/a/{module}")).toBe("/a/");
  });

  it("declares method and path for every operation", () => {
    for (const op of Object.values(transferOperations)) {
      expect(["GET", "POST"]).toContain(op.method);
      expect(op.path.startsWith("/crm/")).toBe(true);
    }
  });
});

describe("csvDownload", () => {
  it("adds a BOM and safe headers", async () => {
    const res = csvDownload({ fileName: "a.csv", body: "x,y" });
    expect(res.status).toBe(200);
    expect(await rawText(res)).toBe("﻿x,y");
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Content-Disposition")).toBe(
      "attachment; filename=\"a.csv\"; filename*=UTF-8''a.csv",
    );
  });

  it("does not double an existing BOM", async () => {
    const res = csvDownload({ fileName: "a.csv", body: "﻿x" });
    expect(await rawText(res)).toBe("﻿x");
  });

  it("sanitises file names and falls back when empty", () => {
    const bad = csvDownload({ fileName: 'a"b/c\\d;e\u0001f.csv', body: "" });
    expect(bad.headers.get("Content-Disposition")).toContain('filename="a_b_c_d_e_f.csv"');
    const empty = csvDownload({ fileName: "   ", body: "" });
    expect(empty.headers.get("Content-Disposition")).toContain('filename="export.csv"');
    const long = csvDownload({ fileName: "a".repeat(300), body: "" });
    expect(long.headers.get("Content-Disposition")).toContain(`filename="${"a".repeat(200)}"`);
  });

  it("uses an ascii fallback plus an RFC 5987 name for non-ascii", () => {
    const res = csvDownload({ fileName: "ç'(x).csv", body: "" });
    const disposition = res.headers.get("Content-Disposition") ?? "";
    expect(disposition).toContain('filename="_\'(x).csv"');
    expect(disposition).toContain("filename*=UTF-8''%C3%A7%27%28x%29.csv");
  });
});

describe("module and id params", () => {
  it("rejects an unknown or missing module", async () => {
    for (const params of [{ module: "Nope" }, {}]) {
      expect(
        await fieldErrors(transferOperations.runExport.run(service(), input({ params }))),
      ).toEqual({ module: ["Choose a module."] });
    }
  });

  it("rejects a missing id and passes a present one", async () => {
    const svc = service();
    expect(
      await fieldErrors(() => transferOperations.getImport.run(svc, input({ params: {} }))),
    ).toEqual({ importId: ["Invalid value."] });
    expect(
      await fieldErrors(() => transferOperations.undoImport.run(svc, input({ params: {} }))),
    ).toEqual({ importId: ["Invalid value."] });
    expect(
      await fieldErrors(() => transferOperations.downloadExport.run(svc, input({ params: {} }))),
    ).toEqual({ exportId: ["Invalid value."] });
    await transferOperations.getImport.run(svc, input({ params: { importId: "7" } }));
    expect(svc.getImport).toHaveBeenCalledWith(ctx, "7");
    await transferOperations.undoImport.run(svc, input({ params: { importId: "7" } }));
    expect(svc.undoImport).toHaveBeenCalledWith(ctx, "7");
  });
});

describe("simple operations", () => {
  it("delegates list calls", async () => {
    const svc = service();
    expect(await transferOperations.listImports.run(svc, input())).toEqual(["i"]);
    expect(await transferOperations.listExports.run(svc, input())).toEqual(["e"]);
  });

  it("wraps sample and download results as CSV responses", async () => {
    const svc = service();
    const sample = (await transferOperations.sampleCsv.run(svc, input())) as Response;
    expect(await rawText(sample)).toBe("﻿a,b");
    expect(svc.sampleCsv).toHaveBeenCalledWith(ctx, "Leads");
    const dl = (await transferOperations.downloadExport.run(
      svc,
      input({ params: { exportId: "9" } }),
    )) as Response;
    expect(await rawText(dl)).toBe("﻿x");
    expect(svc.downloadExport).toHaveBeenCalledWith(ctx, "9");
  });
});

describe("runImport decoding", () => {
  it("round-trips settings, dropping unknown fields", async () => {
    const svc = service();
    await runImportWith(
      {
        uploadId: "u1",
        extra: 1,
        settings: {
          mode: "both",
          matchField: "Email",
          ignoreEmptyOnUpdate: true,
          junk: true,
          mapping: [
            { column: 0, field: "Email", replaceEmptyWith: "n/a", junk: 1 },
            { column: 9_007_199_254_740_991, field: null },
          ],
          defaults: [{ field: "Lead_Source", value: "Web", junk: 1 }],
        },
      },
      svc,
    );
    expect(svc.runImport).toHaveBeenCalledWith(ctx, "Leads", "u1", {
      mode: "both",
      matchField: "Email",
      ignoreEmptyOnUpdate: true,
      mapping: [
        { column: 0, field: "Email", replaceEmptyWith: "n/a" },
        { column: 9_007_199_254_740_991, field: null },
      ],
      defaults: [{ field: "Lead_Source", value: "Web" }],
    });
  });

  it("omits optional keys when absent and accepts empty lists", async () => {
    const svc = service();
    await runImportWith(
      { uploadId: "u", settings: { ...goodSettings, mapping: [], defaults: [] } },
      svc,
    );
    expect(svc.runImport).toHaveBeenCalledWith(ctx, "Leads", "u", {
      mode: "add",
      ignoreEmptyOnUpdate: false,
      mapping: [],
      defaults: [],
    });
  });

  it("rejects missing, empty and non-JSON bodies", async () => {
    expect(
      await fieldErrors(transferOperations.runImport.run(service(), input({ body: "" }))),
    ).toEqual({ data: ["Send a JSON body."] });
    expect(
      await fieldErrors(transferOperations.runImport.run(service(), input({ body: "{nope" }))),
    ).toEqual({ data: ["Send valid JSON."] });
    for (const body of ["[]", "null", "1", '"s"']) {
      expect(
        await fieldErrors(transferOperations.runImport.run(service(), input({ body }))),
      ).toEqual({ data: ["Invalid value."] });
    }
  });

  it("rejects a missing or wrongly typed uploadId", async () => {
    for (const uploadId of [undefined, "", 5, null]) {
      expect(await fieldErrors(runImportWith({ uploadId, settings: goodSettings }))).toEqual({
        uploadId: ["Invalid value."],
      });
    }
  });

  it("rejects bad settings", async () => {
    const bad: [unknown, string][] = [
      [undefined, "settings"],
      [null, "settings"],
      [[], "settings"],
      [{ ...goodSettings, mode: "merge" }, "mode"],
      [{ ...goodSettings, mode: undefined }, "mode"],
      [{ ...goodSettings, matchField: 3 }, "matchField"],
      [{ ...goodSettings, matchField: null }, "matchField"],
      [{ ...goodSettings, ignoreEmptyOnUpdate: "yes" }, "ignoreEmptyOnUpdate"],
      [{ ...goodSettings, ignoreEmptyOnUpdate: undefined }, "ignoreEmptyOnUpdate"],
      [{ ...goodSettings, mapping: {} }, "mapping"],
      [{ ...goodSettings, mapping: undefined }, "mapping"],
      [{ ...goodSettings, defaults: "x" }, "defaults"],
      [{ ...goodSettings, mapping: [1] }, "mapping"],
      [{ ...goodSettings, mapping: [{ column: -1, field: null }] }, "mapping"],
      [{ ...goodSettings, mapping: [{ column: 1.5, field: null }] }, "mapping"],
      [{ ...goodSettings, mapping: [{ column: 2 ** 53, field: null }] }, "mapping"],
      [{ ...goodSettings, mapping: [{ column: "1", field: null }] }, "mapping"],
      [{ ...goodSettings, mapping: [{ column: 1 }] }, "mapping"],
      [{ ...goodSettings, mapping: [{ column: 1, field: 4 }] }, "mapping"],
      [
        { ...goodSettings, mapping: [{ column: 1, field: null, replaceEmptyWith: null }] },
        "mapping",
      ],
      [{ ...goodSettings, defaults: [{ field: "a" }] }, "defaults"],
      [{ ...goodSettings, defaults: [{ field: 1, value: "a" }] }, "defaults"],
      [{ ...goodSettings, defaults: [null] }, "defaults"],
    ];
    for (const [settings, key] of bad) {
      const errors = await fieldErrors(runImportWith({ uploadId: "u", settings }));
      expect(Object.keys(errors)).toEqual([key]);
    }
  });

  it("rejects an unknown module before reading the body", async () => {
    expect(
      await fieldErrors(
        transferOperations.runImport.run(service(), input({ params: {}, body: "{" })),
      ),
    ).toEqual({ module: ["Choose a module."] });
  });
});

describe("runExport decoding", () => {
  const run = (body: unknown, svc = service()) =>
    transferOperations.runExport.run(svc, input({ body: JSON.stringify(body) }));

  it("accepts fields all, include and exclude", async () => {
    const svc = service();
    await run({ fields: "all" }, svc);
    await run({ fields: { include: ["A"] }, viewId: "v", ids: [], extra: 1 }, svc);
    await run({ fields: { exclude: [] }, ids: ["1", "2"] }, svc);
    expect(svc.runExport.mock.calls.map((c) => c[1])).toEqual([
      { module: "Leads", fields: "all" },
      { module: "Leads", viewId: "v", ids: [], fields: { include: ["A"] } },
      { module: "Leads", ids: ["1", "2"], fields: { exclude: [] } },
    ]);
  });

  it("rejects bad fields specs", async () => {
    for (const fields of [undefined, null, "some", [], {}, { include: ["a"], exclude: ["b"] }]) {
      expect(Object.keys(await fieldErrors(run({ fields })))).toEqual(["fields"]);
    }
    for (const fields of [{ include: "a" }, { include: [1] }, { exclude: {} }]) {
      expect(Object.keys(await fieldErrors(run({ fields })))).toEqual(["fields"]);
    }
  });

  it("rejects bad viewId and ids", async () => {
    expect(Object.keys(await fieldErrors(run({ fields: "all", viewId: 3 })))).toEqual(["viewId"]);
    expect(Object.keys(await fieldErrors(run({ fields: "all", viewId: null })))).toEqual([
      "viewId",
    ]);
    expect(Object.keys(await fieldErrors(run({ fields: "all", ids: "1" })))).toEqual(["ids"]);
    expect(Object.keys(await fieldErrors(run({ fields: "all", ids: [1] })))).toEqual(["ids"]);
    expect(Object.keys(await fieldErrors(run({ fields: "all", ids: null })))).toEqual(["ids"]);
  });
});

describe("previewImport upload", () => {
  const upload = (form: FormData, headers: Record<string, string> = {}) => {
    const request = new Request("http://localhost/x", { method: "POST", body: form, headers });
    return input({ request });
  };
  const file = (name = "a.csv", content = "a,b\n1,2") =>
    new File([content], name, { type: "text/csv" });

  it("reads the file and defaults the charset", async () => {
    const svc = service();
    const form = new FormData();
    form.set("file", file());
    await transferOperations.previewImport.run(svc, upload(form));
    const call = svc.previewImport.mock.calls[0] as unknown as [
      unknown,
      string,
      { name: string; bytes: Uint8Array; charset: string },
    ];
    expect(call[1]).toBe("Leads");
    expect(call[2].name).toBe("a.csv");
    expect(new TextDecoder().decode(call[2].bytes)).toBe("a,b\n1,2");
    expect(call[2].charset).toBe("UTF-8");
  });

  it("accepts a supported charset and an empty file", async () => {
    const svc = service();
    const form = new FormData();
    form.set("file", file("e.csv", ""));
    form.set("charset", "ISO-8859-1");
    await transferOperations.previewImport.run(svc, upload(form));
    const arg = (svc.previewImport.mock.calls[0] as unknown as unknown[])[2] as {
      bytes: Uint8Array;
      charset: string;
    };
    expect(arg.bytes.byteLength).toBe(0);
    expect(arg.charset).toBe("ISO-8859-1");
  });

  it("rejects a non-multipart request", async () => {
    const request = new Request("http://localhost/x", {
      method: "POST",
      body: "a",
      headers: { "Content-Type": "text/plain" },
    });
    expect(
      await fieldErrors(transferOperations.previewImport.run(service(), input({ request }))),
    ).toEqual({ file: ["Send a file."] });
  });

  it("rejects an unparsable multipart body", async () => {
    const request = new Request("http://localhost/x", {
      method: "POST",
      body: "garbage",
      headers: { "Content-Type": "multipart/form-data; boundary=zz" },
    });
    expect(
      await fieldErrors(transferOperations.previewImport.run(service(), input({ request }))),
    ).toEqual({ file: ["Send a valid upload."] });
  });

  it("rejects no file, two files, a wrongly named file and stray fields", async () => {
    const none = new FormData();
    none.set("charset", "UTF-8");
    expect(
      await fieldErrors(transferOperations.previewImport.run(service(), upload(none))),
    ).toEqual({ file: ["Send exactly one file."] });

    const two = new FormData();
    two.append("file", file());
    two.append("file", file("b.csv"));
    expect(await fieldErrors(transferOperations.previewImport.run(service(), upload(two)))).toEqual(
      { file: ["Send exactly one file."] },
    );

    const named = new FormData();
    named.set("upload", file());
    expect(
      await fieldErrors(transferOperations.previewImport.run(service(), upload(named))),
    ).toEqual({ file: ["Send exactly one file."] });

    const stray = new FormData();
    stray.set("file", file());
    stray.set("note", "x");
    expect(
      await fieldErrors(transferOperations.previewImport.run(service(), upload(stray))),
    ).toEqual({ note: ["Unexpected field."] });
  });

  it("rejects an unsupported charset", async () => {
    const form = new FormData();
    form.set("file", file());
    form.set("charset", "UTF-16");
    expect(
      await fieldErrors(transferOperations.previewImport.run(service(), upload(form))),
    ).toEqual({ charset: ["Choose a supported charset."] });
  });

  it("cancels the stream over budget with file_too_large", async () => {
    const big = new Uint8Array(TRANSFER_FILE_BYTES + 64 * 1024 + 1);
    const request = new Request("http://localhost/x", {
      method: "POST",
      body: big,
      headers: { "Content-Type": "multipart/form-data; boundary=zz" },
    });
    const error = await rejection(
      transferOperations.previewImport.run(service(), input({ request })),
    );
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("file_too_large");
  });
});
