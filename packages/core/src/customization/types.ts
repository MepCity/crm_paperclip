import type { FieldDataType, FieldDefinition, ListView } from "../records/contract";

export type CustomizationRevision = number;
export type FieldProperties = Pick<
  FieldDefinition,
  "label" | "required" | "readOnly" | "maxLength" | "picklist" | "views"
>;
export type FieldProperty = keyof FieldProperties;

/** IDs are local stable identities; API names are immutable storage keys. */
export interface CustomizationField extends FieldDefinition {
  id: string;
  lifecycle: "active" | "retired";
}

export interface BaselineField extends CustomizationField {
  customizable: readonly FieldProperty[];
  /** Domain-owned values may satisfy required fields without an editable control. */
  serverValue: boolean;
  systemRequired: boolean;
}

export interface LayoutDefinition {
  id: string;
  label: string;
  isDefault: boolean;
  sections: readonly {
    id: string;
    label: string;
    columnCount: number;
    /** Array position is the ordering contract. Entries are stable field IDs. */
    columns: readonly (readonly string[])[];
    /** Ordered membership, including fields without column placement. */
    fields: readonly string[];
  }[];
}

/** View references use stable field IDs, except declared external criteria names. */
export interface SavedViewDefinition extends ListView {}

export interface ModuleBaseline {
  apiName: string;
  version: string;
  singularLabel: string;
  pluralLabel: string;
  fields: readonly BaselineField[];
  layouts: readonly LayoutDefinition[];
  views: readonly SavedViewDefinition[];
  /** API names allowed only in saved-view criteria, outside the field catalog. */
  externalCriteriaFields: readonly string[];
  reservedApiNames: readonly string[];
  /** Explicit engine support, not permission to expose an editing UI. */
  customFieldTypes: readonly FieldDataType[];
  supportedColumnCounts: readonly number[];
  capabilities: Readonly<Record<string, boolean>>;
  engineCapabilities: Readonly<Record<string, boolean>>;
}

export interface CustomizationSnapshot {
  baselineVersion: string;
  revision: CustomizationRevision;
  fields: readonly CustomizationField[];
  fieldPatches: Readonly<Record<string, Partial<FieldProperties>>>;
  /** Omitted means inherit the baseline; supplied arrays replace placement. */
  layouts?: readonly LayoutDefinition[];
  views?: readonly SavedViewDefinition[];
}

export interface CustomizationPatch {
  addFields?: readonly CustomizationField[];
  fieldPatches?: Readonly<Record<string, Partial<FieldProperties>>>;
  layouts?: readonly LayoutDefinition[];
  views?: readonly SavedViewDefinition[];
}

export interface EffectiveModuleDefinition {
  apiName: string;
  singularLabel: string;
  pluralLabel: string;
  baselineVersion: string;
  revision: CustomizationRevision;
  fields: readonly CustomizationField[];
  layouts: readonly LayoutDefinition[];
  views: readonly SavedViewDefinition[];
  /** API names allowed only in saved-view criteria, outside the field catalog. */
  externalCriteriaFields: readonly string[];
  /** Engine intersection only. The authorization service must narrow this further. */
  capabilities: Readonly<Record<string, boolean>>;
}

/** Internal ephemeral metadata port; authorization and record coordination are separate slices. */
export interface CustomizationPort {
  readEffective(orgId: string, module: string): Promise<EffectiveModuleDefinition>;
  applyPatch(
    orgId: string,
    module: string,
    expectedRevision: CustomizationRevision,
    patch: CustomizationPatch,
  ): Promise<EffectiveModuleDefinition>;
}
