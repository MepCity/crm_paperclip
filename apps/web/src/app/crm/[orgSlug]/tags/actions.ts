"use server";

import type { Tag } from "@crm/core/records";
import { revalidatePath } from "next/cache";
import { toActionState } from "@/lib/action";
import { getTagService } from "@/lib/records";
import { requireOrgContext } from "@/lib/session";

export type RecordTagResult =
  | { status: "success"; tags: readonly Tag[]; catalogue: readonly Tag[] }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

const nameKey = (name: string) => name.trim().normalize("NFC").toLowerCase();

export async function readRecordTagsAction(
  orgSlug: string,
  module: string,
  recordId: string,
): Promise<RecordTagResult> {
  const ctx = await requireOrgContext(orgSlug);
  try {
    const service = getTagService(ctx);
    const tags = await service.listRecordTags(module, recordId);
    return { status: "success", tags, catalogue: await service.listTags(module) };
  } catch (error) {
    const state = toActionState(error);
    if (state.status !== "error") throw error;
    return state;
  }
}

export async function saveRecordTagsAction(
  orgSlug: string,
  module: string,
  recordId: string,
  names: readonly string[],
): Promise<RecordTagResult> {
  const ctx = await requireOrgContext(orgSlug);
  try {
    const service = getTagService(ctx);
    // Check record visibility, write permission and lock before creating catalogue entries.
    await service.addTags(module, recordId, []);
    const catalogue = [...(await service.listTags(module))];
    const ids: string[] = [];
    for (const name of names) {
      let tag = catalogue.find((candidate) => nameKey(candidate.name) === nameKey(name));
      if (!tag) {
        tag = await service.createTag(module, { name });
        catalogue.push(tag);
      }
      ids.push(tag.id);
    }
    await service.addTags(module, recordId, ids);
    revalidatePath(`/crm/${orgSlug}/tab/${module}/${recordId}`);
    return { status: "success", tags: await service.listRecordTags(module, recordId), catalogue };
  } catch (error) {
    const state = toActionState(error);
    if (state.status !== "error") throw error;
    return state;
  }
}

export async function removeRecordTagAction(
  orgSlug: string,
  module: string,
  recordId: string,
  tagId: string,
): Promise<RecordTagResult> {
  const ctx = await requireOrgContext(orgSlug);
  try {
    const service = getTagService(ctx);
    await service.removeTags(module, recordId, [tagId]);
    revalidatePath(`/crm/${orgSlug}/tab/${module}/${recordId}`);
    return {
      status: "success",
      tags: await service.listRecordTags(module, recordId),
      catalogue: await service.listTags(module),
    };
  } catch (error) {
    const state = toActionState(error);
    if (state.status !== "error") throw error;
    return state;
  }
}

export type TagCatalogueResult =
  | { status: "success"; tags: readonly Tag[]; capacity: number; canManage: boolean }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export async function readTagCatalogueAction(
  orgSlug: string,
  module: string,
): Promise<TagCatalogueResult> {
  const ctx = await requireOrgContext(orgSlug);
  try {
    const tags = await getTagService(ctx).listTags(module);
    // ADR 0007 T2/T7: all four supported modules are writable for authenticated
    // members in the current adapter; no administrator-only grant is inferred.
    return {
      status: "success",
      tags,
      capacity: 100,
      canManage: ["Leads", "Contacts", "Accounts", "Deals"].includes(module),
    };
  } catch (error) {
    const state = toActionState(error);
    if (state.status !== "error") throw error;
    return state;
  }
}

export async function mutateTagCatalogueAction(
  orgSlug: string,
  module: string,
  mutation:
    | { kind: "create"; name: string }
    | { kind: "rename"; id: string; name: string }
    | { kind: "delete"; id: string },
): Promise<TagCatalogueResult> {
  const ctx = await requireOrgContext(orgSlug);
  try {
    const service = getTagService(ctx);
    if (mutation.kind === "create") await service.createTag(module, { name: mutation.name });
    else if (mutation.kind === "rename")
      await service.renameTag(module, mutation.id, mutation.name);
    else await service.deleteTag(module, mutation.id);
    revalidatePath(`/crm/${orgSlug}/tab/${module}`, "layout");
    return await readTagCatalogueAction(orgSlug, module);
  } catch (error) {
    const state = toActionState(error);
    if (state.status !== "error") throw error;
    return state;
  }
}
