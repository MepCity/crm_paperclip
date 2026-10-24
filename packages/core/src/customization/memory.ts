import { ConflictError, NotFoundError } from "../errors";
import { emptySnapshot, immutable, invalid, resolveEffectiveModule } from "./resolver";
import { baselineSchema, parse, patchSchema } from "./schema";
import type {
  CustomizationPatch,
  CustomizationPort,
  CustomizationRevision,
  CustomizationSnapshot,
  EffectiveModuleDefinition,
  ModuleBaseline,
} from "./types";

export class CustomizationConflictError extends ConflictError {
  override name = "CustomizationConflictError";
  constructor(
    readonly expectedRevision: number,
    readonly actualRevision: number,
  ) {
    super("Customization revision changed. Refresh the schema before retrying.");
  }
}

/**
 * Ephemeral, single-process metadata adapter. Methods publish synchronously before
 * resolving their promises; no await separates the revision check and publication.
 * This is not the record-write coordinator or an authorization service.
 */
export class InMemoryCustomizationAdapter implements CustomizationPort {
  private publicationGuard?: (
    orgId: string,
    module: string,
    before: EffectiveModuleDefinition,
    after: EffectiveModuleDefinition,
  ) => void;

  /** One coordinator owns this adapter for its entire lifetime. */
  setPublicationGuard(guard: NonNullable<InMemoryCustomizationAdapter["publicationGuard"]>): void {
    if (this.publicationGuard) invalid("A schema coordinator is already attached.");
    this.publicationGuard = guard;
  }

  private readonly baselines = new Map<string, ModuleBaseline>();
  private readonly initialRevisions = new Map<string, number>();
  private readonly resolved = new Map<string, Map<string, EffectiveModuleDefinition>>();
  private readonly organizations = new Set<string>();
  private readonly snapshots = new Map<string, Map<string, CustomizationSnapshot>>();

  constructor(baselines: readonly ModuleBaseline[]) {
    for (const input of baselines) {
      const baseline = parse(baselineSchema, input);
      if (this.baselines.has(baseline.apiName)) invalid("Duplicate baseline module.");
      resolveEffectiveModule(baseline);
      this.baselines.set(baseline.apiName, immutable(baseline));
      this.initialRevisions.set(baseline.apiName, 0);
    }
  }

  hasModule(module: string): boolean {
    return this.baselines.has(module);
  }

  private baseline(module: string): ModuleBaseline {
    const baseline = this.baselines.get(module);
    if (!baseline) throw new NotFoundError("Unknown customization module.");
    return baseline;
  }

  private snapshot(orgId: string, module: string): CustomizationSnapshot {
    if (!orgId) invalid("Organization is required.");
    return (
      this.snapshots.get(orgId)?.get(module) ?? {
        ...emptySnapshot(this.baseline(module)),
        revision: this.initialRevisions.get(module) ?? 0,
      }
    );
  }

  async readEffective(orgId: string, module: string): Promise<EffectiveModuleDefinition> {
    return this.readEffectiveSync(orgId, module);
  }

  readEffectiveSync(orgId: string, module: string): EffectiveModuleDefinition {
    const baseline = this.baseline(module);
    const snapshot = this.snapshot(orgId, module);
    const cached = this.resolved.get(orgId)?.get(module);
    if (cached?.baselineVersion === baseline.version && cached.revision === snapshot.revision)
      return cached;
    const effective = resolveEffectiveModule(baseline, snapshot);
    this.organizations.add(orgId);
    const modules = this.resolved.get(orgId) ?? new Map();
    modules.set(module, effective);
    this.resolved.set(orgId, modules);
    return effective;
  }

  async applyPatch(
    orgId: string,
    module: string,
    expectedRevision: CustomizationRevision,
    input: CustomizationPatch,
  ): Promise<EffectiveModuleDefinition> {
    const baseline = this.baseline(module);
    const previous = this.snapshot(orgId, module);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
      invalid("Invalid expected revision.");
    if (previous.revision !== expectedRevision) {
      throw new CustomizationConflictError(expectedRevision, previous.revision);
    }
    const patch = parse(patchSchema, input);
    if (patch.addFields?.some((field) => field.lifecycle !== "active")) {
      invalid("New custom fields must be active.");
    }
    const lifecycleIds = [...(patch.retireFields ?? []), ...(patch.restoreFields ?? [])];
    if (
      new Set(lifecycleIds).size !== lifecycleIds.length ||
      lifecycleIds.some((id) => !previous.fields.some((field) => field.id === id))
    )
      invalid("Lifecycle changes require distinct existing custom field identities.");
    if (lifecycleIds.length && !this.publicationGuard)
      invalid("Lifecycle changes require a schema coordinator.");
    if (patch.retireFields?.some((id) => Object.hasOwn(patch.fieldPatches ?? {}, id)))
      invalid("Cannot patch a field while retiring it.");
    const patches = new Map(Object.entries(previous.fieldPatches));
    for (const [id, properties] of Object.entries(patch.fieldPatches ?? {})) {
      patches.set(id, { ...patches.get(id), ...properties });
    }
    for (const id of patch.retireFields ?? []) patches.delete(id);
    const candidate: CustomizationSnapshot = {
      ...previous,
      revision: previous.revision + 1,
      fields: [...previous.fields, ...(patch.addFields ?? [])].map((field) => ({
        ...field,
        ...(patch.retireFields?.includes(field.id) ? previous.fieldPatches[field.id] : {}),
        lifecycle: patch.retireFields?.includes(field.id)
          ? ("retired" as const)
          : patch.restoreFields?.includes(field.id)
            ? ("active" as const)
            : field.lifecycle,
      })),
      fieldPatches: Object.fromEntries(patches),
      ...(patch.layouts !== undefined ? { layouts: patch.layouts } : {}),
      ...(patch.views !== undefined ? { views: patch.views } : {}),
    };
    const effective = resolveEffectiveModule(baseline, candidate);
    this.publicationGuard?.(orgId, module, this.readEffectiveSync(orgId, module), effective);
    // Only publish a detached, fully validated snapshot. Failure above changes nothing.
    const next = new Map(this.snapshots.get(orgId));
    next.set(module, immutable(structuredClone(candidate)));
    this.snapshots.set(orgId, next);
    this.organizations.add(orgId);
    return effective;
  }

  /** Validate every tenant before activating a baseline. Any failure retains all old state. */
  upgradeBaseline(input: ModuleBaseline): void {
    const baseline = parse(baselineSchema, input);
    const previous = this.baseline(baseline.apiName);
    if (baseline.version === previous.version)
      invalid("A baseline upgrade requires a new version.");
    resolveEffectiveModule(baseline);
    // Stable identities and reserved historical names must survive baseline upgrades.
    for (const field of previous.fields) {
      const next = baseline.fields.find((candidate) => candidate.id === field.id);
      if (
        !next ||
        next.apiName !== field.apiName ||
        next.dataType !== field.dataType ||
        (field.lifecycle === "retired" && next.lifecycle !== "retired")
      ) {
        invalid("Baseline upgrade cannot remove or reidentify existing fields.");
      }
    }
    if (previous.reservedApiNames.some((name) => !baseline.reservedApiNames.includes(name))) {
      invalid("Baseline upgrade cannot release reserved names.");
    }
    const candidates = new Map<string, CustomizationSnapshot>();
    for (const orgId of this.organizations) {
      const snapshot = this.snapshot(orgId, baseline.apiName);
      const candidate = {
        ...snapshot,
        baselineVersion: baseline.version,
        revision: snapshot.revision + 1,
      };
      const effective = resolveEffectiveModule(baseline, candidate);
      this.publicationGuard?.(
        orgId,
        baseline.apiName,
        this.readEffectiveSync(orgId, baseline.apiName),
        effective,
      );
      candidates.set(orgId, immutable(structuredClone(candidate)));
    }
    for (const [orgId, candidate] of candidates) {
      const modules = new Map(this.snapshots.get(orgId));
      modules.set(baseline.apiName, candidate);
      this.snapshots.set(orgId, modules);
    }
    this.baselines.set(baseline.apiName, immutable(baseline));
    this.initialRevisions.set(
      baseline.apiName,
      (this.initialRevisions.get(baseline.apiName) ?? 0) + 1,
    );
  }
}
