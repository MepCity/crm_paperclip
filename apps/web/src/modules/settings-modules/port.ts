export type ModuleSummary = {
  apiName: string;
  displayLabel: string;
  moduleName: string;
  kind: "system" | "custom" | "team";
  teamspaceCount: number;
  sharedTo: string;
  lastModifiedAt: string | null;
  enabled: boolean;
};

export type ModuleListPort = { listModules(): Promise<ModuleSummary[]> };
