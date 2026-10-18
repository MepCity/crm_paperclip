import { Icons } from "@/components/ui/icon";
import type { ModuleScreenDefinition } from "../types";
import { DealRecordScreen } from "./deal-record-screen";
import { buildDealsBusinessCardFields, buildDealsDetailSections } from "./deals-detail-sections";
import { DEALS_FORM_INFORMATION_COLUMNS, dealsFormRules } from "./deals-form-rules";
import { isDealInlineEditable } from "./deals-inline-edit";
import { formatDealsLastUpdateLabel } from "./deals-last-update";
import { dealsRecordHeaderIdentity } from "./deals-record-header";
import {
  buildDealsRecordMoreMenuGroups,
  DEALS_DELETE_CONFIRM_MESSAGE,
  DEALS_DELETE_CONFIRM_TITLE,
} from "./deals-record-more-options";
import { dealsRelatedListRail } from "./deals-related-lists";
import {
  DEALS_TIMELINE_EMPTY_EVENTS,
  DEALS_TIMELINE_MODULE_OPTIONS,
  DEALS_TIMELINE_SOURCE_OPTIONS,
  DEALS_TIMELINE_SUBTABS,
  normalizeDealsEventKind,
} from "./deals-timeline";
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
    Screen: DealRecordScreen,
    header: dealsRecordHeaderIdentity,
    headerCurrency: true,
    hasPortrait: false,
    recordNavigation: false,
    addTags: { label: "Add Tags" },
    headerCommands: [
      { id: "send-email", label: "Send Email", variant: "primary", laterModule: "M10" },
    ],
    businessCard: buildDealsBusinessCardFields,
    sections: buildDealsDetailSections,
    inlineEditable: isDealInlineEditable,
    lastUpdate: formatDealsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildDealsRecordMoreMenuGroups,
    deleteTitle: DEALS_DELETE_CONFIRM_TITLE,
    deleteMessage: DEALS_DELETE_CONFIRM_MESSAGE,
    loadingAttributes: { "data-deal-record-loading": true },
    relatedListRail: dealsRelatedListRail,
    timeline: {
      subtabs: DEALS_TIMELINE_SUBTABS,
      modules: DEALS_TIMELINE_MODULE_OPTIONS,
      sources: DEALS_TIMELINE_SOURCE_OPTIONS,
      events: DEALS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeDealsEventKind,
      upcomingAutomatedActions: {
        label: "Show Upcoming Automated Actions",
        laterModule: "M12",
      },
    },
  },
};
