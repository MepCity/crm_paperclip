import { NotFoundError, ValidationError } from "../../../errors";
import type { FieldValue, ModuleRecordReference, RecordData } from "../../contract";
import type { FixtureHookContext, FixtureModuleHooks } from "../hooks";
import { attachmentParentModules } from "./metadata";

export function attachmentParent(value: FieldValue | undefined): ModuleRecordReference | undefined {
  if (
    value &&
    typeof value === "object" &&
    "module" in value &&
    "id" in value &&
    typeof value.module === "string" &&
    typeof value.id === "string"
  )
    return { module: value.module, id: value.id };
  return undefined;
}

/** Resolves only through the organization-scoped hook stores. */
export function attachmentUltimateParent(
  fields: RecordData["fields"],
  ctx: FixtureHookContext,
): ModuleRecordReference {
  let parent = attachmentParent(fields.Parent_Id);
  if (
    !parent ||
    !attachmentParentModules.some((module) => module === parent?.module) ||
    !ctx.registeredModules.includes(parent.module)
  )
    throw new ValidationError({ Parent_Id: ["Choose a supported parent record."] });
  let record = ctx.moduleStore(parent.module).records.get(parent.id);
  if (parent.module === "Notes" && record) {
    parent = attachmentParent(record.fields.Parent_Id);
    if (
      !parent ||
      parent.module === "Notes" ||
      !attachmentParentModules.some((module) => module === parent?.module) ||
      !ctx.registeredModules.includes(parent.module)
    )
      throw new ValidationError({ Parent_Id: ["Choose a supported ultimate parent record."] });
    record = ctx.moduleStore(parent.module).records.get(parent.id);
  }
  if (!record)
    throw new ValidationError({
      Parent_Id: ["Referenced record does not exist in this organization."],
    });
  return parent;
}

export const attachmentsHooks: FixtureModuleHooks = {
  applyRules(fields, _input, previous, ctx) {
    attachmentUltimateParent(fields, ctx);
    if (previous && fields.$type !== previous.$type)
      throw new ValidationError({ $type: ["The attachment storage type cannot be changed."] });
    fields.$type ??= "file";
    if (fields.$type !== "file" && fields.$type !== "link")
      throw new ValidationError({ $type: ["Choose file or link."] });
    if (typeof fields.Size !== "string" || !/^\d+$/.test(fields.Size))
      throw new ValidationError({ Size: ["Choose a nonnegative byte size."] });
    if (fields.$type === "link") {
      let url: URL;
      try {
        url = new URL(String(fields.$link_url ?? ""));
      } catch {
        throw new ValidationError({ $link_url: ["Enter an HTTP or HTTPS URL."] });
      }
      if (!["http:", "https:"].includes(url.protocol))
        throw new ValidationError({ $link_url: ["Enter an HTTP or HTTPS URL."] });
      fields.File_Name = fields.$link_url ?? null;
      fields.Size = "0";
    } else if (fields.$link_url != null)
      throw new ValidationError({ $link_url: ["Only link attachments have a URL."] });
  },
  afterWrite(record) {
    if (record.fields.$state == null)
      Object.assign(record.fields, {
        $state: record.fields.$type === "link" ? "ready" : "pending",
      });
  },
  readRecord(record) {
    return {
      id: record.id,
      fields: Object.fromEntries(
        Object.entries(record.fields).filter(
          ([name]) =>
            !["$storage_key", "$checksum", "$media_type", "$state"].includes(name) &&
            (name !== "$link_url" || record.fields.$type === "link"),
        ),
      ),
    };
  },
};

export interface AttachmentCleanupIntent {
  attachmentId: string;
  storageKey: string | null;
}

export function removeAttachmentIds(ids: readonly string[], ctx: FixtureHookContext): void {
  if (!ctx.registeredModules.includes("Attachments")) return;
  const store = ctx.moduleStore("Attachments");
  const intents = [...(store.attachmentCleanupIntents ?? [])];
  store.attachmentCleanupIntents = intents;
  for (const id of new Set(ids)) {
    const record = store.records.get(id);
    if (!record) continue;
    if (record.fields.$type === "file")
      intents.push({
        attachmentId: id,
        storageKey:
          typeof record.fields.$storage_key === "string" ? record.fields.$storage_key : null,
      });
    store.records.delete(id);
  }
}

export function removeAttachmentsForParents(
  module: string,
  ids: readonly string[],
  ctx: FixtureHookContext,
): void {
  if (!ctx.registeredModules.includes("Attachments")) return;
  const targets = new Set(ids);
  const children = [...ctx.moduleStore("Attachments").records.values()].filter((record) => {
    const parent = attachmentParent(record.fields.Parent_Id);
    return parent?.module === module && targets.has(parent.id);
  });
  removeAttachmentIds(
    children.map((record) => record.id),
    ctx,
  );
}

/** Server-only fixture lifecycle, with no blob I/O or public wire fields. */
export function fixtureAttachmentLifecycle(ctx: FixtureHookContext) {
  return {
    publish(id: string, data: { storageKey: string; checksum: string; mediaType: string }) {
      const record = ctx.moduleStore("Attachments").records.get(id);
      if (!record) throw new NotFoundError("Attachment not found.");
      attachmentUltimateParent(record.fields, ctx);
      if (record.fields.$type !== "file" || record.fields.$state !== "pending")
        throw new ValidationError({ id: ["Choose a pending file attachment."] });
      if (!/^[A-Za-z0-9_-]+$/.test(data.storageKey))
        throw new ValidationError({
          storageKey: ["Choose a server-generated opaque storage key."],
        });
      Object.assign(record.fields, {
        $storage_key: data.storageKey,
        $checksum: data.checksum,
        $media_type: data.mediaType,
        $state: "ready",
      });
    },
    /** Server-only: link attachments and published files are ready; staged uploads are not. */
    isReady(id: string): boolean {
      return store.records.get(id)?.fields.$state === "ready";
    },
    /** Server-only: the media type recorded at publish time, if any. */
    mediaType(id: string): string | null {
      const value = store.records.get(id)?.fields.$media_type;
      return typeof value === "string" && value ? value : null;
    },
    cleanupIntents(): readonly AttachmentCleanupIntent[] {
      return structuredClone(ctx.moduleStore("Attachments").attachmentCleanupIntents ?? []);
    },
    acknowledgeCleanup(id: string) {
      const store = ctx.moduleStore("Attachments");
      store.attachmentCleanupIntents = (store.attachmentCleanupIntents ?? []).filter(
        (intent) => intent.attachmentId !== id,
      );
    },
  };
}
