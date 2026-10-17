import { Icons } from "@/components/ui/icon";
import { buildAccountsRecordMoreMenuGroups } from "../accounts/accounts-record-more-options";
import {
  ACCOUNTS_TIMELINE_EMPTY_EVENTS,
  ACCOUNTS_TIMELINE_MODULE_OPTIONS,
  ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
  ACCOUNTS_TIMELINE_SUBTABS,
  normalizeAccountsEventKind,
} from "../accounts/accounts-timeline";
import type { ModuleScreenDefinition } from "../types";
import { buildCasesBusinessCardFields, buildCasesDetailSections } from "./cases-detail-sections";
import {
  CASES_DELETE_CONFIRM_MESSAGE,
  CASES_DELETE_CONFIRM_TITLE,
  casesFormRules,
} from "./cases-form-rules";
import { isCaseInlineEditable } from "./cases-inline-edit";
import { formatCasesLastUpdateLabel } from "./cases-last-update";
import { casesRecordHeaderIdentity } from "./cases-record-header";
import { CASES_LIST_CURRENCY_CODE, casesListPageConfig } from "./list-config";
import { buildCasesFilterGroups } from "./list-filters";

/**
 * Not registered in `registry.ts`. The more-options menu and the timeline are temporary
 * Accounts bindings; the record detail tasks replace them. No related-list rail yet.
 */
export const casesScreenDefinition: ModuleScreenDefinition = {
  apiName: "Cases",
  tab: "Cases",
  singularLabel: "Case",
  pluralLabel: "Cases",
  pageTitle: "Cases",
  navigation: { id: "cases", icon: Icons.building },
  list: casesListPageConfig,
  listCurrencyCode: CASES_LIST_CURRENCY_CODE,
  searchColumns: ["Case_Number", "Subject", "Status", "Priority", "Owner"],
  buildFilterGroups: buildCasesFilterGroups,
  form: {
    rules: casesFormRules,
    inventoryChrome: true,
  },
  detail: {
    header: casesRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: false,
    businessCard: buildCasesBusinessCardFields,
    sections: buildCasesDetailSections,
    inlineEditable: isCaseInlineEditable,
    lastUpdate: formatCasesLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: CASES_DELETE_CONFIRM_TITLE,
    deleteMessage: CASES_DELETE_CONFIRM_MESSAGE,
    timeline: {
      subtabs: ACCOUNTS_TIMELINE_SUBTABS,
      modules: ACCOUNTS_TIMELINE_MODULE_OPTIONS,
      sources: ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
      events: ACCOUNTS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeAccountsEventKind,
    },
  },
};
