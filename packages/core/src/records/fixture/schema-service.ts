import type { InMemorySchemaCoordinator } from "../../customization/coordinator";
import type { OrgContext } from "../../tenancy/types";
import type { RecordService } from "../contract";

/** Every caller (inline editing and imports included) enters the same service boundary. */
export function schemaRecordService<T extends RecordService>(
  ctx: OrgContext,
  service: T,
  schema: InMemorySchemaCoordinator,
): T {
  const run = async <R>(
    modules: readonly string[],
    options: Parameters<typeof schema.run>[2],
    work: () => Promise<R>,
  ) => {
    const controlled = modules.filter((module) => schema.metadata.hasModule(module));
    return controlled.length ? schema.run(ctx, controlled, options, work) : work();
  };
  return {
    ...service,
    list: (module, query) => schema.readConsistently(ctx.orgId, () => service.list(module, query)),
    count: (module, query) =>
      schema.readConsistently(ctx.orgId, () => service.count(module, query)),
    search: (query) => schema.readConsistently(ctx.orgId, () => service.search(query)),
    summarize: (module, query) =>
      schema.readConsistently(ctx.orgId, () => service.summarize(module, query)),
    findDuplicateGroups: (module, fields) =>
      schema.readConsistently(ctx.orgId, () => service.findDuplicateGroups(module, fields)),
    create: (module, input, options) => run([module], options, () => service.create(module, input)),
    update: (module, id, input, options) =>
      run([module], options, () => service.update(module, id, input)),
    massUpdate: (module, ids, input, options) =>
      run([module], options, () => service.massUpdate(module, ids, input)),
    changeOwner: (module, ids, ownerId, options) =>
      run([module], options, () => service.changeOwner(module, ids, ownerId)),
    delete: (module, ids, options) => run([module], options, () => service.delete(module, ids)),
    merge: (module, input, options) => run([module], options, () => service.merge(module, input)),
    deduplicate: (module, fields, options) =>
      run([module], options, () => service.deduplicate(module, fields)),
    convertLead: (id, original, options) => {
      const input = structuredClone(original);
      return run(
        [
          "Leads",
          ...(input.account ? ["Accounts"] : []),
          ...(input.contact ? ["Contacts"] : []),
          ...(input.deal ? ["Deals"] : []),
        ],
        options,
        () => service.convertLead(id, input),
      );
    },
  };
}
