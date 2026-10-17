import { randomUUID } from "node:crypto";
import { ForbiddenError, NotFoundError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type { RecordData } from "../contract";
import type { RecycleBinEntry, RecycleBinService } from "../recycle-bin";
import { attachmentParent } from "./attachments/hooks";
import type { FixtureHistoryOperation } from "./history-write";
import type { FixtureModuleStore } from "./hooks";
import type { FixtureModuleBundle } from "./registry";
import { assertUniqueFieldValues } from "./unique";

export interface DeletionManifest {
  entry: RecycleBinEntry;
  operationId: string;
  graph: readonly { module: string; id: string }[];
}
interface Dependencies {
  context: OrgContext;
  now: () => Date;
  modules: () => Map<string, FixtureModuleStore>;
  manifests: () => Map<string, DeletionManifest>;
  moduleStore: (module: string) => FixtureModuleStore;
  bundle: (module: string) => FixtureModuleBundle;
  atomic: <T>(operation: FixtureHistoryOperation, write: () => T) => T;
  validate: (module: string, record: RecordData) => void;
  validateOwners: (records: readonly RecordData[]) => Promise<void>;
}

/** Move canonical rows into the deleted partition; the manifest contains references only. */
export function retainDeletion(
  deps: Pick<Dependencies, "modules" | "manifests" | "moduleStore" | "bundle" | "context" | "now">,
  module: string,
  record: RecordData,
  operationId: string,
  remove: () => void,
): void {
  const before = new Map(
    [...deps.modules()].map(([name, store]) => [
      name,
      {
        records: new Map(store.records),
        tagLinks: store.tagLinks,
        cleanup: store.attachmentCleanupIntents,
      },
    ]),
  );
  remove();
  const graph: DeletionManifest["graph"][number][] = [];
  for (const [name, previous] of before) {
    const removed = [...previous.records.values()].filter(
      (row) => !deps.modules().get(name)?.records.has(row.id),
    );
    if (!removed.length) continue;
    const store = deps.moduleStore(name);
    store.deletedRecords = new Map(store.deletedRecords);
    store.deletedTagLinks = new Map(store.deletedTagLinks);
    store.tagLinks = new Map(store.tagLinks);
    for (const row of removed) {
      store.deletedRecords.set(row.id, row);
      const links = previous.tagLinks?.get(row.id);
      if (links?.size) store.deletedTagLinks.set(row.id, new Set(links));
      store.tagLinks.delete(row.id);
      graph.push({ module: name, id: row.id });
    }
    // Recoverable deletion must never schedule retained bytes for blob cleanup.
    store.attachmentCleanupIntents = previous.cleanup;
  }
  const deletedAt = deps.now().toISOString();
  const entry: RecycleBinEntry = {
    id: randomUUID(),
    module,
    recordId: record.id,
    name: String(record.fields[deps.bundle(module).displayNameField] ?? ""),
    deletedBy: deps.context.userId,
    deletedAt,
    expiresAt: new Date(Date.parse(deletedAt) + 60 * 86_400_000).toISOString(),
  };
  deps.manifests().set(entry.id, { entry, operationId, graph });
}

export function fixtureRecycleBinService(deps: Dependencies): RecycleBinService {
  const { context: ctx, now, manifests, moduleStore, bundle, atomic } = deps;
  const visible = (manifest: DeletionManifest) =>
    (ctx.role === "admin" || manifest.entry.deletedBy === ctx.userId) &&
    Date.parse(manifest.entry.expiresAt) > now().getTime();
  const selection = (ids: readonly string[]) =>
    [...new Set(ids)].map((id) => {
      const manifest = manifests().get(id);
      if (!manifest || !visible(manifest)) throw new NotFoundError("Recycle bin entry not found.");
      return manifest;
    });
  const admin = () => {
    if (ctx.role !== "admin") throw new ForbiddenError();
  };
  const purge = (ids: readonly string[]) => {
    admin();
    const selected = selection(ids);
    if (!selected.length) return;
    atomic({ module: selected[0]?.entry.module ?? "", mechanism: "purge" }, () => {
      const files: RecordData[] = [];
      for (const manifest of selected) {
        for (const ref of manifest.graph) {
          const store = moduleStore(ref.module);
          const row = store.deletedRecords?.get(ref.id);
          if (ref.module === "Attachments" && row?.fields.$type === "file") files.push(row);
          store.deletedRecords = new Map(store.deletedRecords);
          store.deletedRecords.delete(ref.id);
          store.deletedTagLinks = new Map(store.deletedTagLinks);
          store.deletedTagLinks.delete(ref.id);
        }
        manifests().delete(manifest.entry.id);
      }
      const attachments = moduleStore("Attachments");
      const referenced = new Set(
        [...attachments.records.values(), ...(attachments.deletedRecords?.values() ?? [])].map(
          (row) => row.fields.$storage_key,
        ),
      );
      attachments.attachmentCleanupIntents = [
        ...(attachments.attachmentCleanupIntents ?? []),
        ...files
          .filter(
            (row) => row.fields.$storage_key == null || !referenced.has(row.fields.$storage_key),
          )
          .map((row) => ({
            attachmentId: row.id,
            storageKey:
              typeof row.fields.$storage_key === "string" ? row.fields.$storage_key : null,
          })),
      ];
    });
  };
  return {
    async list(query = {}) {
      if (query.module !== undefined) bundle(query.module);
      const page = query.page ?? 1;
      const perPage = query.perPage ?? 30;
      if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(perPage) || perPage < 1)
        throw new ValidationError({ page: ["Choose positive integer paging values."] });
      if (
        (query.name !== undefined && typeof query.name !== "string") ||
        (query.deletedBy !== undefined && typeof query.deletedBy !== "string")
      )
        throw new ValidationError({ query: ["Choose valid search values."] });
      const entries = [...manifests().values()]
        .filter(visible)
        .map((item) => item.entry)
        .filter(
          (entry) =>
            (!query.module || entry.module === query.module) &&
            (!query.name || entry.name.toLowerCase().includes(query.name.toLowerCase())) &&
            (!query.deletedBy || entry.deletedBy === query.deletedBy),
        )
        .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt) || a.id.localeCompare(b.id));
      return structuredClone({
        entries: entries.slice((page - 1) * perPage, page * perPage),
        total: entries.length,
      });
    },
    async restore(ids) {
      const selected = selection(ids);
      if (!selected.length) return;
      await deps.validateOwners(
        selected.flatMap((manifest) =>
          manifest.graph.map((ref) => {
            const record = deps.modules().get(ref.module)?.deletedRecords?.get(ref.id);
            if (!record) throw new NotFoundError("Recycle bin entry not found.");
            return record;
          }),
        ),
      );
      // Membership resolution can yield. Re-resolve visibility, expiry and graph at commit.
      const current = selection(ids);
      atomic({ module: current[0]?.entry.module ?? "", mechanism: "restore" }, () => {
        const restored: { module: string; record: RecordData }[] = [];
        for (const manifest of current) {
          for (const ref of manifest.graph) {
            const store = moduleStore(ref.module);
            const record = store.deletedRecords?.get(ref.id);
            if (!record || store.records.has(ref.id))
              throw new ValidationError({ id: ["The record cannot be restored."] });
            store.records.set(ref.id, record);
            restored.push({ module: ref.module, record });
          }
        }
        // Stage every selected root first so dependent selected parents are available.
        for (const { module, record } of restored) {
          deps.validate(module, record);
          for (const [field, value] of Object.entries(record.fields)) {
            const parent = attachmentParent(value);
            if (
              parent &&
              deps.modules().get(parent.module)?.deletedRecords?.has(parent.id) &&
              !deps.modules().get(parent.module)?.records.has(parent.id)
            )
              throw new ValidationError({ [field]: ["Restore the parent record first."] });
          }
        }
        for (const module of new Set(restored.map((row) => row.module))) {
          const store = moduleStore(module);
          for (const field of bundle(module).metadata.fields.filter((field) => field.unique)) {
            try {
              assertUniqueFieldValues([field], store.records.values());
            } catch {
              throw new ValidationError({ [field.apiName]: ["This value is already in use."] });
            }
          }
          // Relationship pairs have an additional invariant beyond metadata uniqueness.
          if (module === "Contact_Roles" || module === "Campaign_Members") {
            const keys = new Set<string>();
            const fields =
              module === "Contact_Roles" ? ["Deal", "Contact"] : ["Campaign", "Lead", "Contact"];
            for (const record of store.records.values()) {
              const key = JSON.stringify(
                fields.map((field) => attachmentParent(record.fields[field])?.id ?? null),
              );
              if (keys.has(key))
                throw new ValidationError({
                  [fields[0] ?? "id"]: ["This relationship already exists."],
                });
              keys.add(key);
            }
          }
        }
        for (const { module, record } of restored) {
          const store = moduleStore(module);
          store.deletedRecords = new Map(store.deletedRecords);
          store.deletedRecords.delete(record.id);
          const tags = store.deletedTagLinks?.get(record.id);
          if (tags?.size) store.tagLinks = new Map(store.tagLinks).set(record.id, new Set(tags));
          store.deletedTagLinks = new Map(store.deletedTagLinks);
          store.deletedTagLinks.delete(record.id);
        }
        for (const manifest of current) manifests().delete(manifest.entry.id);
      });
    },
    async purge(ids) {
      purge(ids);
    },
    async empty() {
      admin();
      purge([...manifests().values()].filter(visible).map((item) => item.entry.id));
    },
  };
}
