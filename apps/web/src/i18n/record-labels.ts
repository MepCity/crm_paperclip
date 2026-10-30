"use client";

import type { ListView } from "@crm/core/records";
import { english, type MessageKey, type MessageValues } from "./catalogs";
import { useUiTranslations } from "./client-provider";

export function useRecordLabel() {
  const t = useUiTranslations();
  return (label: string) => {
    const entry = Object.entries(english.records.chrome).find(([, value]) => value === label);
    if (entry) return t(`records.chrome.${entry[0]}` as MessageKey);
    const action = Object.entries(english.records.actions).find(([, value]) => value === label);
    if (action) return t(`records.actions.${action[0]}` as MessageKey);
    const transfer = english.records.transfer;
    for (const [module, names] of Object.entries(english.metadata.modules)) {
      if (label === `Export ${names.plural}` && Object.hasOwn(transfer.exportItem, module))
        return t(`records.transfer.exportItem.${module}` as MessageKey);
      if (label === `Import ${names.plural}` && Object.hasOwn(transfer.importItem, module))
        return t(`records.transfer.importItem.${module}` as MessageKey);
    }
    if (label === "Edit") return t("common.actions.edit");
    return label;
  };
}

export function builtInViewLabel(
  view: Pick<ListView, "name" | "systemDefined" | "isDefault">,
  plural: string,
  translatedPlural: string,
  t: (key: MessageKey, values?: MessageValues) => string,
): string {
  if (!view.systemDefined) return view.name;
  const names = {
    [`All ${plural}`]: "records.chrome.allRecords",
    [`My ${plural}`]: "records.chrome.myRecords",
    [`All Locked ${plural}`]: "records.chrome.allLockedRecords",
    [`Unread ${plural}`]: "records.chrome.unreadRecords",
    [`All Active ${plural}`]: "records.chrome.allActiveRecords",
    [`My Active ${plural}`]: "records.chrome.myActiveRecords",
    [`Open ${plural}`]: "records.chrome.openRecords",
    [`Closed ${plural}`]: "records.chrome.closedRecords",
    [`Escalated ${plural}`]: "records.chrome.escalatedRecords",
    [`Today’s ${plural}`]: "records.chrome.todayRecords",
    [`Today's ${plural}`]: "records.chrome.todayRecords",
  } as const;
  const key = names[view.name];
  return key ? t(key, { module: translatedPlural }) : view.name;
}
