import { type FieldErrors, ValidationError } from "../../../errors";
import type { FieldValue, ModuleRecordReference } from "../../contract";
import type { FixtureHookContext, FixtureModuleHooks } from "../hooks";
import { notesParentModules } from "./metadata";

function parentReference(value: FieldValue | undefined): ModuleRecordReference | undefined {
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

export const notesHooks: FixtureModuleHooks = {
  applyRules(fields, _input, previous, ctx) {
    const errors: FieldErrors = {};
    const parent = parentReference(fields.Parent_Id);
    if (!parent || !notesParentModules.some((module) => module === parent.module)) {
      errors.Parent_Id = ["Choose a supported parent record."];
    } else if (
      !ctx.registeredModules.includes(parent.module) ||
      !ctx.moduleStore(parent.module).records.has(parent.id)
    ) {
      errors.Parent_Id = ["Referenced record does not exist in this organization."];
    }
    // Interim: reparenting has not been researched; retain the original binding.
    const oldParent = previous && parentReference(previous.Parent_Id);
    if (previous && (parent?.module !== oldParent?.module || parent?.id !== oldParent?.id)) {
      errors.Parent_Id = ["The note parent cannot be changed."];
    }
    for (const [field, limit] of [
      ["Note_Title", 120],
      ["Note_Content", 65_535],
    ] as const) {
      // Count the stored content, including any HTML markup.
      if (typeof fields[field] === "string" && fields[field].length > limit) {
        errors[field] = ["Value is too long."];
      }
    }
    if (Object.keys(errors).length) throw new ValidationError(errors);
  },
};

/** Unwired cascade for successful parent deletion, including locked notes. */
export function removeNotesForParents(
  parentModule: string,
  ids: readonly string[],
  ctx: FixtureHookContext,
): void {
  if (!ctx.registeredModules.includes("Notes") || ids.length === 0) return;
  const targets = new Set(ids);
  const notes = ctx.moduleStore("Notes").records;
  for (const [id, note] of notes) {
    const parent = parentReference(note.fields.Parent_Id);
    if (parent?.module === parentModule && targets.has(parent.id)) notes.delete(id);
  }
}

/** Preserve child identities while moving notes from duplicate parents. */
export function transferNotesToMaster(
  module: string,
  ids: readonly string[],
  masterId: string,
  ctx: FixtureHookContext,
): void {
  const notes = ctx.moduleStore("Notes").records;
  for (const [id, note] of notes) {
    const parent = parentReference(note.fields.Parent_Id);
    if (parent?.module === module && ids.includes(parent.id))
      notes.set(id, { id, fields: { ...note.fields, Parent_Id: { module, id: masterId } } });
  }
}
