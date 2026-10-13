import { Icons } from "@/components/ui/icon";
import {
  ACCOUNTS_DELETE_CONFIRM_MESSAGE,
  ACCOUNTS_DELETE_CONFIRM_TITLE,
  buildAccountsRecordMoreMenuGroups,
} from "../accounts/accounts-record-more-options";
import { accountsRelatedListRail } from "../accounts/accounts-related-lists";
import {
  ACCOUNTS_TIMELINE_EMPTY_EVENTS,
  ACCOUNTS_TIMELINE_MODULE_OPTIONS,
  ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
  ACCOUNTS_TIMELINE_SUBTABS,
  normalizeAccountsEventKind,
} from "../accounts/accounts-timeline";
import type { ModuleScreenDefinition } from "../types";
import { buildDealsBusinessCardFields, buildDealsDetailSections } from "./deals-detail-sections";
import { DEALS_FORM_INFORMATION_COLUMNS, dealsFormRules } from "./deals-form-rules";
import { isDealInlineEditable } from "./deals-inline-edit";
import { formatDealsLastUpdateLabel } from "./deals-last-update";
import { dealsRecordHeaderIdentity } from "./deals-record-header";
import { DEALS_LIST_CURRENCY_CODE, dealsListPageConfig } from "./list-config";
import { buildDealsFilterGroups } from "./list-filters";

export const dealsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Deals",
  tab: "Deals",
  singularLabel: "Deal",
  pluralLabel: "Deals",
  pageTitle: "Deals",
  navigation: { id: "deals", icon: Icons.building },
  list: dealsListPageConfig,
  listCurrencyCode: DEALS_LIST_CURRENCY_CODE,
  searchColumns: [
    "Deal_Name",
    "Amount",
    "Stage",
    "Closing_Date",
    "Account_Name",
    "Contact_Name",
    "Owner",
  ],
  buildFilterGroups: buildDealsFilterGroups,
  form: {
    rules: dealsFormRules,
    fallbackColumns: { "Deal Information": DEALS_FORM_INFORMATION_COLUMNS },
    inventoryChrome: true,
  },
  detail: {
    header: dealsRecordHeaderIdentity,
    headerCurrency: true,
    hasPortrait: false,
    recordNavigation: false,
    addTags: { label: "Add Tags", laterModule: "M6" },
    headerCommands: [
      { id: "send-email", label: "Send Email", variant: "primary", laterModule: "M10" },
    ],
    businessCard: buildDealsBusinessCardFields,
    sections: buildDealsDetailSections,
    inlineEditable: isDealInlineEditable,
    lastUpdate: formatDealsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    // Temporary wiring from Accounts package (interim until dedicated Deals record detail tasks)
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: ACCOUNTS_DELETE_CONFIRM_TITLE,
    deleteMessage: ACCOUNTS_DELETE_CONFIRM_MESSAGE,
    loadingAttributes: { "data-deal-record-loading": true },
    relatedListRail: accountsRelatedListRail,
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
