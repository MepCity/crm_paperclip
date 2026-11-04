import { Icons } from "@/components/ui/icon";
import { buildAccountsRecordMoreMenuGroups } from "../accounts/accounts-record-more-options";
import {
  ACCOUNTS_TIMELINE_MODULE_OPTIONS,
  ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
  ACCOUNTS_TIMELINE_SUBTABS,
  normalizeAccountsEventKind,
} from "../accounts/accounts-timeline";
import type { ModuleScreenDefinition } from "../types";
import { QUOTES_LIST_CURRENCY_CODE, quotesListPageConfig } from "./list-config";
import { buildQuotesFilterGroups } from "./list-filters";
import { buildQuotesBusinessCardFields, buildQuotesDetailSections } from "./quotes-detail-sections";
import {
  QUOTES_DELETE_CONFIRM_MESSAGE,
  QUOTES_DELETE_CONFIRM_TITLE,
  quotesFormRules,
} from "./quotes-form-rules";
import { isQuoteInlineEditable } from "./quotes-inline-edit";
import { formatQuotesLastUpdateLabel } from "./quotes-last-update";
import { quotesRecordHeaderIdentity } from "./quotes-record-header";
import { quotesRelatedListRail, quotesRelatedLists } from "./quotes-related-lists";

/**
 * Registered in `registry.ts`. The more-options menu and the timeline are temporary
 * Accounts bindings. The line-item table is integrated separately (ADR 0016).
 */
export const quotesScreenDefinition: ModuleScreenDefinition = {
  apiName: "Quotes",
  tab: "Quotes",
  singularLabel: "Quote",
  pluralLabel: "Quotes",
  pageTitle: "Quotes",
  navigation: { id: "quotes", icon: Icons.handshake, group: "flat" },
  list: quotesListPageConfig,
  listCurrencyCode: QUOTES_LIST_CURRENCY_CODE,
  searchColumns: ["Subject", "Quote_Number", "Quote_Stage", "Owner"],
  buildFilterGroups: buildQuotesFilterGroups,
  form: {
    rules: quotesFormRules,
  },
  detail: {
    header: quotesRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: true,
    businessCard: buildQuotesBusinessCardFields,
    sections: buildQuotesDetailSections,
    inlineEditable: isQuoteInlineEditable,
    lastUpdate: formatQuotesLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: QUOTES_DELETE_CONFIRM_TITLE,
    deleteMessage: QUOTES_DELETE_CONFIRM_MESSAGE,
    relatedLists: quotesRelatedLists,
    relatedListRail: quotesRelatedListRail,
    timeline: {
      subtabs: ACCOUNTS_TIMELINE_SUBTABS,
      modules: ACCOUNTS_TIMELINE_MODULE_OPTIONS,
      sources: ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
      normalizeEventKind: normalizeAccountsEventKind,
      upcomingAutomatedActions: {
        label: "Show Upcoming Automated Actions",
        laterModule: "M12",
      },
    },
  },
};
