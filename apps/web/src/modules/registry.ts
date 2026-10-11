import { contactsScreenDefinition } from "./contacts/definition";
import { leadsScreenDefinition } from "./leads/definition";
import type { ModuleScreenDefinition } from "./types";

/** Add a shipped module here to enable its routes and shell entries together. */
export const moduleScreens: readonly ModuleScreenDefinition[] = [
  leadsScreenDefinition,
  contactsScreenDefinition,
];

export function resolveModuleScreen(
  tab: string,
  definitions: readonly ModuleScreenDefinition[] = moduleScreens,
): ModuleScreenDefinition | undefined {
  return definitions.find((definition) => definition.tab === tab);
}
