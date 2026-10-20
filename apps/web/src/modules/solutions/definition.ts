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
import { solutionsRelatedListRail, solutionsRelatedLists } from "./solutions-related-lists";

/**
 * Registered in `registry.ts`. The more-options menu and the timeline are temporary
 * Accounts bindings; the rail follows metadata order with provisional rules (MEP-863).
 */
export const solutionsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Solutions",
  tab: "Solutions",
  singularLabel: "Solution",
  pluralLabel: "Solutions",
  pageTitle: "Solutions",
  navigation: { id: "solutions", icon: Icons.bookUser, group: "flat" },
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
    recordNavigation: true,
    businessCard: buildSolutionsBusinessCardFields,
    sections: buildSolutionsDetailSections,
    inlineEditable: isSolutionInlineEditable,
    lastUpdate: formatSolutionsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: SOLUTIONS_DELETE_CONFIRM_TITLE,
    deleteMessage: SOLUTIONS_DELETE_CONFIRM_MESSAGE,
    relatedLists: solutionsRelatedLists,
    relatedListRail: solutionsRelatedListRail,
    timeline: {
      subtabs: ACCOUNTS_TIMELINE_SUBTABS,
      modules: ACCOUNTS_TIMELINE_MODULE_OPTIONS,
      sources: ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
      events: ACCOUNTS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeAccountsEventKind,
      upcomingAutomatedActions: {
        label: "Show Upcoming Automated Actions",
        laterModule: "M12",
      },
    },
  },
};
