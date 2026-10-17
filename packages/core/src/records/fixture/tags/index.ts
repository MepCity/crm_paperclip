import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../../../errors";
import type { OrgContext } from "../../../tenancy/types";
import type { RecordData } from "../../contract";
import type { Tag, TagService } from "../../tags";
import {
  compareTags,
  TAG_CATALOGUE_CAPACITY,
  tagColor,
  tagMembership,
  tagName,
  tagNameKey,
} from "../../tags/policy";
import type { FixtureModuleStore } from "../hooks";

interface Dependencies {
  ctx: OrgContext;
  now: () => Date;
  moduleStore: (module: string) => FixtureModuleStore;
  assertModule: (module: string, write?: boolean) => void;
  assertRecord: (module: string, id: string, write?: boolean) => void;
  atomic: <T>(module: string, write: () => T) => T;
}

export function recordTags(store: FixtureModuleStore, id: string): Tag[] {
  return [...(store.tagLinks?.get(id) ?? [])]
    .map((tagId) => store.tags?.get(tagId))
    .filter((tag): tag is Tag => tag !== undefined)
    .sort(compareTags);
}
export function projectTags(store: FixtureModuleStore, record: RecordData): RecordData {
  const tags = recordTags(store, record.id).map(({ id, name }) => ({ id, name }));
  return { ...record, fields: { ...record.fields, Tag: tags.length ? tags : null } };
}
export function removeRecordTags(store: FixtureModuleStore, ids: readonly string[]): void {
  const links = new Map(store.tagLinks);
  for (const id of ids) links.delete(id);
  store.tagLinks = links;
}

export function fixtureTagService(deps: Dependencies): TagService {
  const { ctx, now, moduleStore, assertModule, assertRecord, atomic } = deps;
  const getTag = (module: string, id: string): Tag => {
    const tag = moduleStore(module).tags?.get(id);
    if (!tag) throw new NotFoundError("Tag not found.");
    return tag;
  };
  const validateName = (module: string, name: string, id?: string): string => {
    const normalized = tagName(name);
    if (
      [...(moduleStore(module).tags?.values() ?? [])].some(
        (tag) => tag.id !== id && tagNameKey(tag.name) === tagNameKey(normalized),
      )
    )
      throw new ValidationError({ name: ["A tag with this name already exists."] });
    return normalized;
  };
  const edit = (module: string, id: string, values: Partial<Pick<Tag, "name" | "color">>) => {
    const tag = {
      ...getTag(module, id),
      ...values,
      modifiedBy: ctx.userId,
      modifiedAt: now().toISOString(),
    };
    const store = moduleStore(module);
    store.tags = new Map(store.tags).set(id, tag);
    return structuredClone(tag);
  };
  const memberships = (module: string, recordId: string, ids: readonly string[], add: boolean) => {
    assertModule(module, true);
    assertRecord(module, recordId, true);
    for (const id of ids) getTag(module, id);
    atomic(module, () => {
      const store = moduleStore(module);
      const links = tagMembership([...(store.tagLinks?.get(recordId) ?? [])]);
      for (const id of ids) {
        if (add) links.add(id);
        else links.delete(id);
      }
      store.tagLinks = new Map(store.tagLinks);
      if (links.size) store.tagLinks.set(recordId, links);
      else store.tagLinks.delete(recordId);
    });
  };
  return {
    async listTags(module) {
      assertModule(module);
      return structuredClone([...(moduleStore(module).tags?.values() ?? [])].sort(compareTags));
    },
    async createTag(module, input) {
      assertModule(module, true);
      return atomic(module, () => {
        const name = validateName(module, input.name);
        const color = tagColor(input.color);
        const store = moduleStore(module);
        if ((store.tags?.size ?? 0) >= TAG_CATALOGUE_CAPACITY)
          throw new ValidationError(
            { tags: ["The module tag catalogue is full."] },
            undefined,
            "limit",
          );
        const stamp = now().toISOString();
        const tag: Tag = {
          id: randomUUID(),
          module,
          name,
          color,
          createdBy: ctx.userId,
          createdAt: stamp,
          modifiedBy: ctx.userId,
          modifiedAt: stamp,
        };
        store.tags = new Map(store.tags).set(tag.id, tag);
        return structuredClone(tag);
      });
    },
    async renameTag(module, id, name) {
      assertModule(module, true);
      getTag(module, id);
      return atomic(module, () => edit(module, id, { name: validateName(module, name, id) }));
    },
    async recolorTag(module, id, color) {
      assertModule(module, true);
      getTag(module, id);
      return atomic(module, () => edit(module, id, { color: tagColor(color) }));
    },
    async deleteTag(module, id) {
      assertModule(module, true);
      getTag(module, id);
      atomic(module, () => {
        const store = moduleStore(module);
        store.tags = new Map(store.tags);
        store.tags.delete(id);
        store.tagLinks = new Map(
          [...(store.tagLinks ?? [])].flatMap(([record, ids]) => {
            const links = new Set(ids);
            links.delete(id);
            return links.size ? [[record, links] as const] : [];
          }),
        );
      });
    },
    async addTags(module, recordId, ids) {
      memberships(module, recordId, ids, true);
    },
    async removeTags(module, recordId, ids) {
      memberships(module, recordId, ids, false);
    },
    async listRecordTags(module, recordId) {
      assertModule(module);
      assertRecord(module, recordId);
      return structuredClone(recordTags(moduleStore(module), recordId));
    },
  };
}
