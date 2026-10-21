import type { ModuleApiName } from "@crm/core/records";

/**
 * Module 6 print page (interim rule, own layout: the reference print page could not be
 * captured). Record Print Preview exists for these four modules.
 */
export const PRINT_PREVIEW_MODULES: readonly ModuleApiName[] = [
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
];

/** List "Print Default view": the reference Deals list shows no Print View entry. */
export const PRINT_LIST_MODULES: readonly ModuleApiName[] = [
  "Leads",
  "Contacts",
  "Accounts",
  "Cases",
];

export function supportsRecordPrint(module: ModuleApiName): boolean {
  return PRINT_PREVIEW_MODULES.includes(module);
}

export function supportsListPrint(module: ModuleApiName): boolean {
  return PRINT_LIST_MODULES.includes(module);
}
