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
  private readonly baselines = new Map<string, ModuleBaseline>();
  private readonly initialRevisions = new Map<string, number>();
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
    return resolveEffectiveModule(this.baseline(module), this.snapshot(orgId, module));
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
    const patches = new Map(Object.entries(previous.fieldPatches));
    for (const [id, properties] of Object.entries(patch.fieldPatches ?? {})) {
      patches.set(id, { ...patches.get(id), ...properties });
    }
    const candidate: CustomizationSnapshot = {
      ...previous,
      revision: previous.revision + 1,
      fields: [...previous.fields, ...(patch.addFields ?? [])],
      fieldPatches: Object.fromEntries(patches),
      ...(patch.layouts !== undefined ? { layouts: patch.layouts } : {}),
      ...(patch.views !== undefined ? { views: patch.views } : {}),
    };
    const effective = resolveEffectiveModule(baseline, candidate);
    // Only publish a detached, fully validated snapshot. Failure above changes nothing.
    const next = new Map(this.snapshots.get(orgId));
    next.set(module, immutable(structuredClone(candidate)));
    this.snapshots.set(orgId, next);
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
    for (const [orgId, modules] of this.snapshots) {
      const snapshot = modules.get(baseline.apiName);
      if (!snapshot) continue;
      const candidate = {
        ...snapshot,
        baselineVersion: baseline.version,
        revision: snapshot.revision + 1,
      };
      resolveEffectiveModule(baseline, candidate);
      candidates.set(orgId, immutable(structuredClone(candidate)));
    }
    for (const [orgId, candidate] of candidates) {
      this.snapshots.get(orgId)?.set(baseline.apiName, candidate);
    }
    this.baselines.set(baseline.apiName, immutable(baseline));
    this.initialRevisions.set(
      baseline.apiName,
      (this.initialRevisions.get(baseline.apiName) ?? 0) + 1,
    );
  }
}
