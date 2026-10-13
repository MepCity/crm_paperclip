import { Icons } from "@/components/ui/icon";
import type { ModuleScreenDefinition } from "../types";
import {
  buildAccountsBusinessCardFields,
  buildAccountsDetailSections,
} from "./accounts-detail-sections";
import { ACCOUNTS_FORM_INFORMATION_COLUMNS, accountsFormRules } from "./accounts-form-rules";
import { isAccountInlineEditable } from "./accounts-inline-edit";
import { formatAccountsLastUpdateLabel } from "./accounts-last-update";
import { AccountBuildingPlaceholder, accountsRecordHeaderIdentity } from "./accounts-record-header";
import {
  ACCOUNTS_DELETE_CONFIRM_MESSAGE,
  ACCOUNTS_DELETE_CONFIRM_TITLE,
  buildAccountsRecordMoreMenuGroups,
} from "./accounts-record-more-options";
import { accountsRelatedListRail } from "./accounts-related-lists";
import {
  ACCOUNTS_TIMELINE_EMPTY_EVENTS,
  ACCOUNTS_TIMELINE_MODULE_OPTIONS,
  ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
  ACCOUNTS_TIMELINE_SUBTABS,
  normalizeAccountsEventKind,
} from "./accounts-timeline";
import { ACCOUNTS_LIST_CURRENCY_CODE, accountsListPageConfig } from "./list-config";
import { buildAccountsFilterGroups } from "./list-filters";

export const accountsMergeDefinition = {
  criterionFields: ["Account_Name", "Phone", "Website", "Account_Number"],
  matchingColumns: [
    "Account_Name",
    "Phone",
    "Website",
    "Account_Number",
    "Created_Time",
    "Modified_Time",
    "Owner",
  ],
} as const;

export const accountsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Accounts",
  tab: "Accounts",
  singularLabel: "Account",
  pluralLabel: "Accounts",
  pageTitle: "Accounts",
  navigation: { id: "accounts", icon: Icons.building },
  list: accountsListPageConfig,
  listCurrencyCode: ACCOUNTS_LIST_CURRENCY_CODE,
  searchColumns: ["Account_Name", "Phone", "Website", "Owner"],
  merge: accountsMergeDefinition,
  buildFilterGroups: buildAccountsFilterGroups,
  form: {
    rules: accountsFormRules,
    fallbackColumns: { "Account Information": ACCOUNTS_FORM_INFORMATION_COLUMNS },
    inventoryChrome: true,
    profileImageLaterModule: "M6",
    profileImageIcon: AccountBuildingPlaceholder,
    recordPickerChrome: "observed",
  },
  detail: {
    header: accountsRecordHeaderIdentity,
    portraitIcon: AccountBuildingPlaceholder,
    addTags: { label: "Add Tags", laterModule: "M6" },
    headerCommands: [
      { id: "send-email", label: "Send Email", variant: "primary", laterModule: "M10" },
    ],
    businessCard: buildAccountsBusinessCardFields,
    sections: buildAccountsDetailSections,
    inlineEditable: isAccountInlineEditable,
    lastUpdate: formatAccountsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: ACCOUNTS_DELETE_CONFIRM_TITLE,
    deleteMessage: ACCOUNTS_DELETE_CONFIRM_MESSAGE,
    loadingAttributes: { "data-account-record-loading": true },
    linkedContactSummary: true,
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
