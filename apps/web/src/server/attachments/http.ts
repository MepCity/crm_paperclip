import {
  ATTACHMENT_DOWNLOAD_HEADERS,
  BlobNotFoundError,
  type BlobStore,
  contentDispositionAttachment,
  type createUploadBatchRegistry,
  FilePolicyError,
  resolveAllowedType,
  type SelectionKind,
  selectionBudget,
} from "@crm/core/attachments";
import { NotFoundError, ValidationError } from "@crm/core/errors";
import type { OrgContext, RecordData, RecordService } from "@crm/core/records";
import type { createFixtureAttachmentLifecycle } from "@crm/core/records/fixture";
import { encodeError } from "@/lib/api/wire/errors";

export const ATTACHMENT_PARENT_MODULES = ["Leads", "Contacts", "Accounts", "Deals", "Notes"];
const PER_PAGE_DEFAULT = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { "Cache-Control": "no-store" };

export interface AttachmentDeps {
  ctx: OrgContext;
  records: RecordService;
  lifecycle: ReturnType<typeof createFixtureAttachmentLifecycle>;
  blobs: BlobStore;
  batches: ReturnType<typeof createUploadBatchRegistry>;
  memberNames: () => Promise<ReadonlyMap<string, string>>;
}

export interface AttachmentParams {
  module: string;
  recordId: string;
  attachmentId?: string;
}

function error(
  status: number,
  code: string,
  message: string,
  fields: Record<string, string[]> = {},
) {
  return Response.json(
    { code, details: { fields }, message, status: "error" },
    { status, headers: NO_STORE },
  );
}

const invalid = (field: string, message: string) =>
  error(400, "INVALID_DATA", "Check the highlighted fields.", { [field]: [message] });

function ok(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

function owner(id: unknown, names: ReadonlyMap<string, string>) {
  return typeof id === "string" ? { id, name: names.get(id) ?? "" } : null;
}

function row(record: RecordData, names: ReadonlyMap<string, string>) {
  const f = record.fields;
  return {
    id: record.id,
    File_Name: f.File_Name,
    Size: Number(f.Size),
    $type: f.$type,
    ...(f.$type === "link" ? { $link_url: f.$link_url } : {}),
    Created_Time: f.Created_Time,
    Modified_Time: f.Modified_Time,
    Created_By: owner(f.Created_By, names),
    Owner: owner(f.Owner, names),
  };
}

/** Parent existence/visibility; a missing, foreign or unsupported parent is a 404. */
async function requireParent(deps: AttachmentDeps, params: AttachmentParams): Promise<void> {
  if (!ATTACHMENT_PARENT_MODULES.includes(params.module)) throw new NotFoundError();
  await deps.records.get(params.module, params.recordId);
}

async function requireAttachment(
  deps: AttachmentDeps,
  params: AttachmentParams,
): Promise<RecordData> {
  const record = await deps.records.get("Attachments", params.attachmentId ?? "");
  const parent = record.fields.Parent_Id;
  if (
    !parent ||
    typeof parent !== "object" ||
    !("module" in parent) ||
    parent.module !== params.module ||
    parent.id !== params.recordId
  )
    throw new NotFoundError();
  return record;
}

function positive(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  return /^\d+$/.test(value) && Number(value) >= 1 && Number.isSafeInteger(Number(value))
    ? Number(value)
    : null;
}

async function list(deps: AttachmentDeps, params: AttachmentParams, url: URL): Promise<Response> {
  const page = positive(url.searchParams.get("page"), 1);
  const perPage = positive(url.searchParams.get("per_page"), PER_PAGE_DEFAULT);
  if (page === null) return invalid("page", "Send a positive page number.");
  if (perPage === null) return invalid("per_page", "Send a positive page size.");
  const names = await deps.memberNames();
  const parent = { module: params.module, id: params.recordId };
  const records: RecordData[] = [];
  for (let next = 1; ; next++) {
    const result = await deps.records.list("Attachments", {
      viewId: "all-attachments",
      page: next,
      perPage: 100,
      filters: { field: "Parent_Id", comparator: "equal", value: parent },
    });
    records.push(...result.records);
    if (!result.moreRecords) break;
  }
  const rows = records
    .map((record) => row(record, names))
    .sort((a, b) => String(b.Created_Time).localeCompare(String(a.Created_Time)));
  const start = (page - 1) * perPage;
  const items = rows.slice(start, start + perPage);
  if (!items.length) return new Response(null, { status: 204, headers: NO_STORE });
  return ok(200, {
    data: items,
    info: {
      page,
      per_page: perPage,
      count: items.length,
      more_records: start + perPage < rows.length,
    },
  });
}

function policyResponse(failure: FilePolicyError): Response {
  return failure.code === "too_large"
    ? error(413, "LIMIT_EXCEEDED", "The upload exceeds the allowed size.")
    : error(415, "TYPE_NOT_ALLOWED", "This file type is not allowed.");
}

async function upload(deps: AttachmentDeps, params: AttachmentParams, request: Request) {
  await requireParent(deps, params);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return invalid("file", "Send a multipart form.");
  }
  const file = form.get("file");
  const url = form.get("attachmentUrl");
  const hasFile = file instanceof File;
  const hasUrl = typeof url === "string" && url !== "";
  if (hasFile === hasUrl) return invalid("file", "Send exactly one file or one attachment URL.");
  const parent = { module: params.module, id: params.recordId };

  if (hasUrl) {
    const created = await deps.records.create("Attachments", {
      File_Name: url,
      Size: "0",
      Parent_Id: parent,
      $type: "link",
      $link_url: url,
    });
    return ok(201, {
      data: [
        {
          code: "SUCCESS",
          details: { id: created.id, File_Name: url, Size: 0, $type: "link" },
        },
      ],
    });
  }

  const upload = file as File;
  const kind: SelectionKind = params.module === "Notes" ? "note" : "record";
  const batchHeader = request.headers.get("X-Upload-Batch");
  if (batchHeader !== null && !UUID.test(batchHeader))
    return invalid("X-Upload-Batch", "Send a valid upload batch id.");
  const budget = selectionBudget(kind);
  if (upload.size > budget.maxBytes) return error(413, "LIMIT_EXCEEDED", "The file is too large.");
  const key = batchHeader
    ? { organizationId: deps.ctx.orgId, userId: deps.ctx.userId, batchId: batchHeader, kind }
    : null;
  try {
    if (key) deps.batches.reserve(key, upload.size);
  } catch (failure) {
    if (failure instanceof FilePolicyError) return policyResponse(failure);
    throw failure;
  }
  let pendingId: string | null = null;
  try {
    const pending = await deps.records.create("Attachments", {
      File_Name: upload.name,
      Size: String(upload.size),
      Parent_Id: parent,
      $type: "file",
    });
    pendingId = pending.id;
    const blobKey = { orgId: deps.ctx.orgId, attachmentId: pending.id };
    const result = await deps.blobs.stage(
      blobKey,
      upload.stream() as ReadableStream<Uint8Array>,
      { maxBytes: budget.maxBytes },
      { fileName: upload.name, mediaType: upload.type || undefined },
    );
    await requireParent(deps, params);
    await deps.blobs.publish(blobKey);
    deps.lifecycle.publish(pending.id, {
      storageKey: pending.id,
      checksum: result.sha256,
      mediaType: result.mediaType,
    });
    return ok(201, {
      data: [
        {
          code: "SUCCESS",
          details: { id: pending.id, File_Name: upload.name, Size: result.size, $type: "file" },
        },
      ],
    });
  } catch (failure) {
    if (key) deps.batches.release(key, upload.size);
    if (pendingId) {
      const id = pendingId;
      await deps.blobs.delete({ orgId: deps.ctx.orgId, attachmentId: id }).catch(() => undefined);
      await deps.records.delete("Attachments", [id]).catch(() => undefined);
      deps.lifecycle.acknowledgeCleanup(id);
    }
    if (failure instanceof FilePolicyError) return policyResponse(failure);
    throw failure;
  }
}

async function download(deps: AttachmentDeps, params: AttachmentParams): Promise<Response> {
  await requireParent(deps, params);
  const record = await requireAttachment(deps, params);
  if (record.fields.$type !== "file")
    return error(409, "DUPLICATE_DATA", "Link attachments cannot be downloaded.");
  let body: ReadableStream<Uint8Array>;
  try {
    body = await deps.blobs.read({ orgId: deps.ctx.orgId, attachmentId: record.id });
  } catch (failure) {
    if (failure instanceof BlobNotFoundError) throw new NotFoundError();
    throw failure;
  }
  const fileName = String(record.fields.File_Name ?? "");
  let mediaType = "application/octet-stream";
  try {
    mediaType = resolveAllowedType({ fileName }).mediaType;
  } catch {
    // Unknown extension: keep the generic type; nosniff and attachment still apply.
  }
  return new Response(body, {
    status: 200,
    headers: {
      ...ATTACHMENT_DOWNLOAD_HEADERS,
      "Content-Type": mediaType,
      "Content-Disposition": contentDispositionAttachment(fileName),
      "Content-Length": String(record.fields.Size),
    },
  });
}

async function remove(deps: AttachmentDeps, params: AttachmentParams): Promise<Response> {
  await requireParent(deps, params);
  const record = await requireAttachment(deps, params);
  await deps.records.delete("Attachments", [record.id]);
  if (record.fields.$type === "file") {
    try {
      await deps.blobs.delete({ orgId: deps.ctx.orgId, attachmentId: record.id });
      deps.lifecycle.acknowledgeCleanup(record.id);
    } catch {
      // The cleanup intent stays; a later sweep retries it.
    }
  }
  return ok(200, { data: [{ code: "SUCCESS" }] });
}

/** Dispatches one attachment request; `AppError`s become the shared wire error body. */
export async function handleAttachmentRequest(
  deps: AttachmentDeps,
  params: AttachmentParams,
  request: Request,
): Promise<Response> {
  try {
    const method = request.method.toUpperCase();
    if (params.attachmentId === undefined) {
      if (method === "GET") {
        await requireParent(deps, params);
        return await list(deps, params, new URL(request.url));
      }
      if (method === "POST") return await upload(deps, params, request);
    } else {
      if (method === "GET") return await download(deps, params);
      if (method === "DELETE") return await remove(deps, params);
    }
    return error(405, "INVALID_DATA", "Method not allowed.");
  } catch (failure) {
    if (failure instanceof ValidationError || failure instanceof NotFoundError) {
      const encoded = encodeError(failure);
      return Response.json(encoded.body, { status: encoded.status, headers: NO_STORE });
    }
    throw failure;
  }
}
