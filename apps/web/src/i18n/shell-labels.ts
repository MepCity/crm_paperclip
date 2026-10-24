"use client";

import { english, type MessageKey } from "./catalogs";
import { useUiTranslations } from "./client-provider";

/** Explicit presentation map; IDs, routes and customized/unknown labels stay verbatim. */
const keys: Record<string, keyof typeof english.shell> = {
  home: "home",
  workqueue: "workqueue",
  reports: "reports",
  analytics: "analytics",
  teamspace: "teamspace",
  sales: "sales",
  activities: "activities",
  integrations: "integrations",
  leads: "leads",
  contacts: "contacts",
  accounts: "accounts",
  deals: "deals",
  tasks: "tasks",
  meetings: "meetings",
  calls: "calls",
  campaigns: "campaigns",
  solutions: "solutions",
  cases: "cases",
  documents: "documents",
  visits: "visits",
  social: "social",
  general: "general",
  members: "members",
  "personal-settings": "personal-settings",
  "company-details": "company-details",
  currencies: "currencies",
  "calendar-booking": "calendar-booking",
  email: "email",
  "import-history": "import-history",
  "export-history": "export-history",
  "modules-and-fields": "modules-and-fields",
  "workflow-rules": "workflow-rules",
  "assignment-rules": "assignment-rules",
  Leads: "lead",
  Contacts: "contact",
  Accounts: "account",
  Deals: "deal",
  Tasks: "task",
  Events: "meeting",
  Meetings: "meeting",
  Calls: "call",
  Campaigns: "campaign",
  Solutions: "solution",
  Cases: "case",
};
export function useShellLabel() {
  const t = useUiTranslations();
  return (id: string, label: string) => {
    const key = keys[id];
    return key && english.shell[key] === label ? t(`shell.${key}` as MessageKey) : label;
  };
}
