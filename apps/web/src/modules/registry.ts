import type { ModuleKey } from "@/components/ui/later-module";
import { accountsScreenDefinition } from "./accounts/definition";
import { callsScreenDefinition } from "./calls/definition";
import { campaignsScreenDefinition } from "./campaigns/definition";
import { casesScreenDefinition } from "./cases/definition";
import { contactsScreenDefinition } from "./contacts/definition";
import { dealsScreenDefinition } from "./deals/definition";
import { leadsScreenDefinition } from "./leads/definition";
import { meetingsScreenDefinition } from "./meetings/definition";
import { solutionsScreenDefinition } from "./solutions/definition";
import { tasksScreenDefinition } from "./tasks/definition";
import type { ModuleScreenDefinition } from "./types";

/** Module to laterModule key mapping maintained in one single place. */
export const MODULE_LATER_KEYS: Readonly<Record<string, ModuleKey>> = {
  Accounts: "M3",
  Deals: "M4",
  Activities: "M5",
  Tasks: "M5",
  Meetings: "M5",
  Events: "M5",
  Calls: "M5",
  Campaigns: "M7",
  Cases: "M8",
  Solutions: "M8",
  Documents: "M9",
  Vendors: "P2",
  Products: "P2",
  Price_Books: "P2",
  Quotes: "P2",
  Sales_Orders: "P2",
  Purchase_Orders: "P2",
  Invoices: "P2",
  Forecasts: "P2",
};

export function resolveModuleLaterKey(moduleApiName: string): ModuleKey {
  return MODULE_LATER_KEYS[moduleApiName] ?? "P3";
}

let cachedModuleScreens: readonly ModuleScreenDefinition[] | undefined;

/** Add a shipped module here to enable its routes and shell entries together. */
export function getModuleScreens(): readonly ModuleScreenDefinition[] {
  if (!cachedModuleScreens) {
    cachedModuleScreens = [
      leadsScreenDefinition,
      contactsScreenDefinition,
      accountsScreenDefinition,
      dealsScreenDefinition,
      tasksScreenDefinition,
      meetingsScreenDefinition,
      callsScreenDefinition,
      campaignsScreenDefinition,
      casesScreenDefinition,
      solutionsScreenDefinition,
    ];
  }
  return cachedModuleScreens;
}

/** Backward-compatible export delegating to getModuleScreens(). */
export const moduleScreens: readonly ModuleScreenDefinition[] = new Proxy(
  [] as unknown as readonly ModuleScreenDefinition[],
  {
    get(_target, prop, receiver) {
      const screens = getModuleScreens();
      const val = Reflect.get(screens, prop, receiver);
      return typeof val === "function" ? val.bind(screens) : val;
    },
  },
);

export function resolveModuleScreen(
  tab: string,
  definitions: readonly ModuleScreenDefinition[] = getModuleScreens(),
): ModuleScreenDefinition | undefined {
  return definitions.find((definition) => definition.tab === tab);
}

export function resolveModuleScreenByApiName(
  apiName: string,
  definitions: readonly ModuleScreenDefinition[] = getModuleScreens(),
): ModuleScreenDefinition | undefined {
  return definitions.find((definition) => definition?.apiName === apiName);
}

export function isModuleRegistered(
  moduleApiName: string,
  definitions: readonly ModuleScreenDefinition[] = getModuleScreens(),
): boolean {
  return definitions.some((definition) => definition?.apiName === moduleApiName);
}
