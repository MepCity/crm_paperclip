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
import { SOLUTIONS_LIST_CURRENCY_CODE, solutionsListPageConfig } from "./list-config";
import { buildSolutionsFilterGroups } from "./list-filters";
import {
  buildSolutionsBusinessCardFields,
  buildSolutionsDetailSections,
} from "./solutions-detail-sections";
import {
  SOLUTIONS_DELETE_CONFIRM_MESSAGE,
  SOLUTIONS_DELETE_CONFIRM_TITLE,
  solutionsFormRules,
} from "./solutions-form-rules";
import { isSolutionInlineEditable } from "./solutions-inline-edit";
import { formatSolutionsLastUpdateLabel } from "./solutions-last-update";
import { solutionsRecordHeaderIdentity } from "./solutions-record-header";

/**
 * Registered in `registry.ts`. The more-options menu and the timeline are temporary
 * Accounts bindings; the record detail tasks replace them. No related-list rail yet.
 */
export const solutionsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Solutions",
  tab: "Solutions",
  singularLabel: "Solution",
  pluralLabel: "Solutions",
  pageTitle: "Solutions",
  navigation: { id: "solutions", icon: Icons.building },
  list: solutionsListPageConfig,
  listCurrencyCode: SOLUTIONS_LIST_CURRENCY_CODE,
  searchColumns: ["Solution_Title", "Solution_Number", "Status", "Owner"],
  buildFilterGroups: buildSolutionsFilterGroups,
  form: {
    rules: solutionsFormRules,
    inventoryChrome: true,
  },
  detail: {
    header: solutionsRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: false,
    businessCard: buildSolutionsBusinessCardFields,
    sections: buildSolutionsDetailSections,
    inlineEditable: isSolutionInlineEditable,
    lastUpdate: formatSolutionsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: SOLUTIONS_DELETE_CONFIRM_TITLE,
    deleteMessage: SOLUTIONS_DELETE_CONFIRM_MESSAGE,
    timeline: {
      subtabs: ACCOUNTS_TIMELINE_SUBTABS,
      modules: ACCOUNTS_TIMELINE_MODULE_OPTIONS,
      sources: ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
      events: ACCOUNTS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeAccountsEventKind,
    },
  },
};
