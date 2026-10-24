import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { ForbiddenError, SchemaStaleError, ValidationError } from "../errors";
import type { RecordData, RecordWriteOptions } from "../records/contract";
import { validateSchemaRecord } from "../records/fixture/schema-validation";
import { assertUniqueFieldValues } from "../records/fixture/unique";
import type { OrgContext } from "../tenancy/types";
import type { InMemoryCustomizationAdapter } from "./memory";
import { invalid } from "./resolver";
import type { EffectiveModuleDefinition } from "./types";

/** Opaque wire token, including the baseline version; clients compare only for equality. */
export function schemaRevision(schema: EffectiveModuleDefinition): string {
  return `${createHash("sha256").update(schema.baselineVersion).digest("hex").slice(0, 32)}:${schema.revision}`;
}

export interface SchemaRecordSource {
  /** Includes recoverable rows for compatibility checks. Values never enter metadata. */
  records(): readonly RecordData[];
  /** Explicit inventory of non-layout/view dependencies. Unknown inventories fail closed. */
  dependencies(): { complete: boolean; fieldIds: readonly string[] };
}

/** Single-process coordinator. Publication and record commit contain no await. */
export class InMemorySchemaCoordinator {
  private readonly sources = new Map<string, Map<string, SchemaRecordSource>>();
  private readonly writes = new AsyncLocalStorage<{
    orgId: string;
    revisions: ReadonlyMap<string, string>;
  }>();
  private committing = false;

  constructor(readonly metadata: InMemoryCustomizationAdapter) {
    metadata.setPublicationGuard((orgId, module, before, after) => {
      if (this.committing) invalid("Cannot publish metadata during a record commit.");
      const source = this.sources.get(orgId)?.get(module);
      if (!source) invalid("Record compatibility source is not registered.");
      const removed = before.fields.filter((field) => !after.fields.some((f) => f.id === field.id));
      if (removed.length) {
        const dependencies = source.dependencies();
        if (!dependencies.complete || removed.some((f) => dependencies.fieldIds.includes(f.id)))
          invalid("Field has active or unknown dependencies.");
      }
      // Only changed constraints need scanning; pre-existing baseline exceptions remain domain-owned.
      const changed = after.fields.filter((field) => {
        const previous = before.fields.find((f) => f.id === field.id);
        return (
          !previous ||
          ["required", "maxLength", "picklist", "unique"].some(
            (key) =>
              JSON.stringify(previous[key as keyof typeof previous]) !==
              JSON.stringify(field[key as keyof typeof field]),
          )
        );
      });
      const rows = source.records();
      for (const record of rows) validateSchemaRecord({ ...after, fields: changed }, record);
      assertUniqueFieldValues(changed, rows);
    });
  }

  register(orgId: string, module: string, source: SchemaRecordSource): void {
    const modules = this.sources.get(orgId) ?? new Map();
    if (modules.has(module)) return;
    modules.set(module, source);
    this.sources.set(orgId, modules);
  }

  read(orgId: string, module: string): EffectiveModuleDefinition {
    return this.metadata.readEffectiveSync(orgId, module);
  }

  async run<T>(
    context: OrgContext,
    modules: readonly string[],
    options: RecordWriteOptions | undefined,
    write: () => Promise<T>,
  ): Promise<T> {
    const revisions = new Map<string, string>();
    for (const module of new Set(modules)) {
      const actual = schemaRevision(this.read(context.orgId, module));
      const expected =
        typeof options?.expectedRevision === "string"
          ? modules.length === 1
            ? options.expectedRevision
            : undefined
          : options?.expectedRevision[module];
      if (expected === undefined)
        invalid("An expected schema revision is required for every written module.");
      if (expected !== actual) throw new SchemaStaleError(actual);
      revisions.set(module, actual);
    }
    return this.writes.run({ orgId: context.orgId, revisions }, write);
  }

  async readConsistently<T>(orgId: string, read: () => Promise<T>): Promise<T> {
    const revisions = new Map(
      [...(this.sources.get(orgId)?.keys() ?? [])].map((module) => [
        module,
        schemaRevision(this.read(orgId, module)),
      ]),
    );
    const result = await read();
    for (const [module, revision] of revisions) {
      const actual = schemaRevision(this.read(orgId, module));
      if (revision !== actual) throw new SchemaStaleError(actual);
    }
    return result;
  }

  commit<T>(orgId: string, write: () => T): T {
    const active = this.writes.getStore();
    // Recovery resolves current metadata inside its synchronous transaction.
    if (active) {
      if (active.orgId !== orgId) throw new ForbiddenError();
      for (const [module, expected] of active.revisions) {
        const actual = schemaRevision(this.read(orgId, module));
        if (actual !== expected) throw new SchemaStaleError(actual);
      }
    }
    if (this.committing) throw new ValidationError({ schema: ["Nested record commit."] });
    this.committing = true;
    try {
      return write();
    } finally {
      this.committing = false;
    }
  }
}
