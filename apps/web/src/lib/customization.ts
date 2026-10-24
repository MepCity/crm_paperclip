import type { OrgContext } from "@crm/core";
import { CustomizationService, InMemorySchemaCoordinator } from "@crm/core/customization";
import { fixtureCustomizationPort } from "@crm/core/records/fixture/metadata-projection";

/** Explicit ephemeral development/test gate; production editing awaits slice J. */
export function customizationEditingEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MEP_EPHEMERAL_CUSTOMIZATION === "1";
}
// Shared across development bundles (page and route modules load separately).
const runtime = globalThis as typeof globalThis & {
  __crmCustomizationCoordinator?: InMemorySchemaCoordinator;
};
export function getCustomizationCoordinator(): InMemorySchemaCoordinator | undefined {
  if (!customizationEditingEnabled()) return undefined;
  runtime.__crmCustomizationCoordinator ??= new InMemorySchemaCoordinator(
    fixtureCustomizationPort(),
  );
  return runtime.__crmCustomizationCoordinator;
}
export function getCustomizationService(ctx: OrgContext): CustomizationService {
  return new CustomizationService(ctx, fixtureCustomizationPort(), customizationEditingEnabled());
}
