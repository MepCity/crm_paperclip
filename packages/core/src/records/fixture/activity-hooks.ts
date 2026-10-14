import { activityParentIds, activityRules } from "../activities";
import { removeAttachmentsForParents } from "./attachments/hooks";
import type { FixtureModuleHooks } from "./hooks";
import { removeNotesForParents } from "./notes/hooks";

/** Attach to parent bundles; merge intentionally does not dispatch delete hooks. */
export function activityDeleteHook(
  module: string,
  afterDelete?: FixtureModuleHooks["afterDelete"],
): NonNullable<FixtureModuleHooks["afterDelete"]> {
  return (ids, ctx) => {
    const removed = new Set(ids);
    for (const activityModule of ctx.registeredModules) {
      if (!Object.hasOwn(activityRules, activityModule)) continue;
      const activities = ctx.moduleStore(activityModule).records;
      for (const record of activities.values()) {
        if (activityParentIds(module, record).some((id) => removed.has(id))) {
          // All children are removed, including locked and completed activities.
          activities.delete(record.id);
        }
      }
    }
    removeAttachmentsForParents(module, ids, ctx);
    removeNotesForParents(module, ids, ctx);
    afterDelete?.(ids, ctx);
  };
}
