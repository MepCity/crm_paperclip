import type { ModuleListPort, ModuleSummary } from "./port";

const names: [string, string | null, boolean][] = [
  ["Home", null, true],
  ["Leads", "Oct 14, 2026", true],
  ["Contacts", "Oct 14, 2026", true],
  ["Accounts", "Oct 14, 2026", true],
  ["Deals", "Aug 22, 2026", true],
  ["Tasks", "Oct 22, 2026", true],
  ["Meetings", "Jul 4, 2026", true],
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
