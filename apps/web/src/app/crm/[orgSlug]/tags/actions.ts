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
