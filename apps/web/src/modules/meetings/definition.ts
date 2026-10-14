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
import { MEETINGS_LIST_CURRENCY_CODE, meetingsListPageConfig } from "./list-config";
import { buildMeetingsFilterGroups } from "./list-filters";

/**
 * Interim: the Meetings detail and form research is ongoing, so the definition below
 * borrows the neutral Accounts builders for detail and form contracts.
 * Identity, list config, and filter groups are Meetings-specific.
 */
export const meetingsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Events",
  tab: "Meetings",
  singularLabel: "Meeting",
  pluralLabel: "Meetings",
  pageTitle: "Meetings",
  navigation: { id: "meetings", icon: Icons.calendar, group: "activities" },
  list: meetingsListPageConfig,
  listCurrencyCode: MEETINGS_LIST_CURRENCY_CODE,
  searchColumns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id", "Owner"],
  buildFilterGroups: buildMeetingsFilterGroups,
  form: {
    rules: accountsFormRules,
    inventoryChrome: true,
  },
  detail: {
    header: accountsRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: false,
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
