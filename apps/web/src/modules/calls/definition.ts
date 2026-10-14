import { Icons } from "@/components/ui/icon";
import {
  buildAccountsBusinessCardFields,
  buildAccountsDetailSections,
} from "../accounts/accounts-detail-sections";
import { accountsFormRules } from "../accounts/accounts-form-rules";
import { isAccountInlineEditable } from "../accounts/accounts-inline-edit";
import { formatAccountsLastUpdateLabel } from "../accounts/accounts-last-update";
import { accountsRecordHeaderIdentity } from "../accounts/accounts-record-header";
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
import { CALLS_LIST_CURRENCY_CODE, callsListPageConfig } from "./list-config";
import { buildCallsFilterGroups } from "./list-filters";

export const callsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Calls",
  tab: "Calls",
  singularLabel: "Call",
  pluralLabel: "Calls",
  pageTitle: "Calls",
  navigation: { id: "calls", icon: Icons.phone, group: "activities" },
  list: callsListPageConfig,
  listCurrencyCode: CALLS_LIST_CURRENCY_CODE,
  searchColumns: ["Subject", "Call_Type", "Call_Start_Time", "Call_Duration", "Owner"],
  buildFilterGroups: buildCallsFilterGroups,
  form: {
    // Temporary fallback: form rules will be replaced in the Calls form task
    rules: accountsFormRules,
  },
  detail: {
    // Temporary fallbacks: detail pieces will be replaced in the Calls detail task
    header: accountsRecordHeaderIdentity,
    businessCard: buildAccountsBusinessCardFields,
    sections: buildAccountsDetailSections,
    inlineEditable: isAccountInlineEditable,
    lastUpdate: formatAccountsLastUpdateLabel,
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: ACCOUNTS_DELETE_CONFIRM_TITLE,
    deleteMessage: ACCOUNTS_DELETE_CONFIRM_MESSAGE,
    relatedListRail: accountsRelatedListRail,
    timeline: {
      subtabs: ACCOUNTS_TIMELINE_SUBTABS,
      modules: ACCOUNTS_TIMELINE_MODULE_OPTIONS,
      sources: ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
      events: ACCOUNTS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeAccountsEventKind,
    },
  },
};
