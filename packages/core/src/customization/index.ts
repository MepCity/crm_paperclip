export { InMemorySchemaCoordinator, schemaRevision } from "./coordinator";
export { CustomizationConflictError, InMemoryCustomizationAdapter } from "./memory";
export { resolveEffectiveModule } from "./resolver";
export type {
  BaselineField,
  CustomizationField,
  CustomizationPatch,
  CustomizationPort,
  CustomizationRevision,
  CustomizationSnapshot,
  EffectiveModuleDefinition,
  FieldProperties,
  FieldProperty,
  LayoutDefinition,
  ModuleBaseline,
  SavedViewDefinition,
} from "./types";
