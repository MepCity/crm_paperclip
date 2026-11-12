import { can } from "./evaluate";
import type { AccessSnapshot, ClientModulePermissions, ClientPermissions } from "./types";

const list = (value: readonly string[] | undefined, module: string) =>
  (value ?? []).includes(module);

/**
 * Browser payload of one snapshot (ADR 0017 §8). No record data, no other users.
 * Administrators get every flag true for every module they are asked about.
 */
export function toClientPermissions(
  snapshot: AccessSnapshot,
  moduleNames: readonly string[],
): ClientPermissions {
  const p = snapshot.permissions;
  const admin = snapshot.profileKind === "administrator";
  const modules: Record<string, ClientModulePermissions> = {};
  for (const name of moduleNames) {
    const view = can(snapshot, name, "view");
    const tool = (toolList: readonly string[]) => admin || (view && list(toolList, name));
    modules[name] = {
      view,
      create: can(snapshot, name, "create"),
      edit: can(snapshot, name, "edit"),
      delete: can(snapshot, name, "delete"),
      import: admin || (view && list(p.importModules, name)),
      export: admin || (view && list(p.exportModules, name)),
      massUpdate: tool(p.tools.massUpdate),
      massDelete: tool(p.tools.massDelete),
      changeOwner: tool(p.tools.changeOwner),
      convert: tool(p.tools.convert),
      merge: tool(p.tools.findAndMerge),
      print: tool(p.tools.printView),
      enrollCadence: tool(p.tools.enrollInCadence),
    };
  }
  return {
    profile: {
      id: snapshot.profileId,
      name: snapshot.profileName ?? snapshot.profileKind,
      kind: snapshot.profileKind,
    },
    modules,
    features: p.features,
    tools: {
      manageViews: admin || p.tools.manageViews,
      tags: admin || p.tools.tags,
      recordTimeline: admin || p.tools.recordTimeline,
    },
    admin: {
      userManagement: admin || p.admin.userManagement,
      moduleCustomization: admin || p.admin.moduleCustomization,
      manageCurrencies: admin || p.admin.manageCurrencies,
      customizeHome: admin || p.admin.customizeHome,
      manageAutomation: admin || p.admin.manageAutomation,
      manageTemplates: admin || p.admin.manageTemplates,
      emailSettings: admin || p.admin.emailSettings,
      dataManagement: admin || p.admin.dataManagement,
      manageWebforms: admin || p.admin.manageWebforms,
      manageJourneys: admin || p.admin.manageJourneys,
      manageIntegrations: admin || p.admin.manageIntegrations,
      managePortals: admin || p.admin.managePortals,
    },
    onlyListSubordinates: !admin && p.tools.onlyListSubordinates,
  };
}
