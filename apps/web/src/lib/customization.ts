import type { OrgContext } from "@crm/core";
import { CustomizationService, InMemorySchemaCoordinator } from "@crm/core/customization";
import { fixtureCustomizationPort } from "@crm/core/records/fixture/metadata-projection";

/** Explicit ephemeral development/test gate; production editing awaits slice J. */
export function customizationEditingEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MEP_EPHEMERAL_CUSTOMIZATION === "1";
}
let coordinator: InMemorySchemaCoordinator | undefined;
export function getCustomizationCoordinator(): InMemorySchemaCoordinator | undefined {
  if (!customizationEditingEnabled()) return undefined;
  coordinator ??= new InMemorySchemaCoordinator(fixtureCustomizationPort());
  return coordinator;
}
export function getCustomizationService(ctx: OrgContext): CustomizationService {
  return new CustomizationService(ctx, fixtureCustomizationPort(), customizationEditingEnabled());
}
