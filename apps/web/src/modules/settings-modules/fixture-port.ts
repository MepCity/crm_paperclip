import type { ModuleListPort, ModuleSummary } from "./port";

const names: [string, string | null, boolean][] = [
  ["Home", null, true],
  ["Workqueue", null, true],
  ["Leads", "2026-10-14", true],
  ["Contacts", "2026-10-14", true],
  ["Accounts", "2026-10-14", true],
  ["Deals", "2026-08-22", true],
  ["Tasks", "2026-10-22", true],
  ["Meetings", "2026-07-04", true],
  ["Calls", null, true],
  ["Campaigns", null, true],
  ["Cases", null, true],
  ["Solutions", null, true],
  ["Documents", null, true],
  ["Reports", null, true],
];

export const FIXTURE_MODULES: ModuleSummary[] = names.map(([n, d, enabled]) => ({
  apiName: n,
  displayLabel: n,
  moduleName: n,
  kind: "system",
  teamspaceCount: 1,
  sharedTo: "All Profiles",
  lastModifiedAt: d,
  enabled,
}));

export const fixtureModuleListPort: ModuleListPort = {
  async listModules() {
    return FIXTURE_MODULES;
  },
};
