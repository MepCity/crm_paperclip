"use server";

import { ValidationError } from "@crm/core/errors";
import { revalidatePath } from "next/cache";
import type {
  BinMutationResult,
  BinReadResult,
  BinSearch,
} from "@/components/records/recycle-bin/contracts";
import { toActionState } from "@/lib/action";
import { getRecycleBinService } from "@/lib/recycle-bin";
import { requireOrgContext } from "@/lib/session";

export async function listRecycleBinAction(
  orgSlug: string,
  search: BinSearch,
  page: number,
  perPage: number,
): Promise<BinReadResult> {
  const context = await requireOrgContext(orgSlug);
  try {
    if (
      search.nameOperator !== "contains" ||
      !["contains", "is"].includes(search.deletedByOperator)
    )
      throw new ValidationError({ search: ["Choose a supported search operator."] });
    if (search.date || search.time !== "01:00")
      throw new ValidationError({ date: ["Deleted Time search is not supported yet."] });
    if (search.deletedBy && search.deletedByOperator !== "is")
      throw new ValidationError({
        deletedBy: ["Deleted By currently supports only is (exact user ID)."],
      });
    const result = await getRecycleBinService(context).list({
      name: search.name || undefined,
      module: search.module || undefined,
      deletedBy: search.deletedBy || undefined,
      page,
      perPage,
    });
    return { status: "success", ...result };
  } catch (error) {
    const state = toActionState(error);
    if (state.status !== "error") throw error;
    return state;
  }
}

export async function mutateRecycleBinAction(
  orgSlug: string,
  action: "restore" | "delete" | "empty",
  ids: readonly string[],
): Promise<BinMutationResult> {
  const context = await requireOrgContext(orgSlug);
  try {
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !id))
      throw new ValidationError({ selection: ["Choose valid records."] });
    const service = getRecycleBinService(context);
    if (action !== "empty" && ids.length === 0)
      throw new ValidationError({ selection: ["Select at least one record."] });
    if (action === "restore") await service.restore(ids);
    else if (action === "delete") await service.purge(ids);
    else if (action === "empty") await service.empty();
    else throw new ValidationError({ action: ["Choose a supported action."] });
    revalidatePath(`/crm/${orgSlug}`, "layout");
    return { status: "success" };
  } catch (error) {
    const state = toActionState(error);
    if (state.status !== "error") throw error;
    return state;
  }
}
