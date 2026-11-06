import { getPersistentDefinitionPorts } from "@crm/core/definitions/runtime";
import { fixtureCustomizationPort } from "@crm/core/records/fixture/metadata-projection";
import { getCustomizationCoordinator } from "@/lib/customization";

export function definitionMetadata() {
  return getCustomizationCoordinator()?.metadata ?? fixtureCustomizationPort();
}
export function definitionPorts() {
  return getPersistentDefinitionPorts(definitionMetadata());
}
