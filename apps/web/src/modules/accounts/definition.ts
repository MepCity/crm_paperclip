import { Icons } from "@/components/ui/icon";
import {
  buildContactsRecordMoreMenuGroups,
  CONTACTS_DELETE_CONFIRM_MESSAGE,
  CONTACTS_DELETE_CONFIRM_TITLE,
} from "../contacts/contacts-record-more-options";
import {
  CONTACTS_TIMELINE_EMPTY_EVENTS,
  CONTACTS_TIMELINE_MODULE_OPTIONS,
  CONTACTS_TIMELINE_SOURCE_OPTIONS,
  CONTACTS_TIMELINE_SUBTABS,
  normalizeContactsEventKind,
} from "../contacts/contacts-timeline";
import type { ModuleScreenDefinition } from "../types";
import {
  buildAccountsBusinessCardFields,
  buildAccountsDetailSections,
} from "./accounts-detail-sections";
import { ACCOUNTS_FORM_INFORMATION_COLUMNS, accountsFormRules } from "./accounts-form-rules";
import { isAccountInlineEditable } from "./accounts-inline-edit";
import { formatAccountsLastUpdateLabel } from "./accounts-last-update";
import { AccountBuildingPlaceholder, accountsRecordHeaderIdentity } from "./accounts-record-header";
import { ACCOUNTS_LIST_CURRENCY_CODE, accountsListPageConfig } from "./list-config";
import { buildAccountsFilterGroups } from "./list-filters";

export const accountsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Accounts",
  tab: "Accounts",
  singularLabel: "Account",
  pluralLabel: "Accounts",
  pageTitle: "Accounts",
  navigation: { id: "accounts", icon: Icons.building },
  list: accountsListPageConfig,
  listCurrencyCode: ACCOUNTS_LIST_CURRENCY_CODE,
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
    headerCommands: [{ id: "send-email", label: "Send Email", laterModule: "M10" }],
    businessCard: buildAccountsBusinessCardFields,
    sections: buildAccountsDetailSections,
    inlineEditable: isAccountInlineEditable,
    lastUpdate: formatAccountsLastUpdateLabel,
    // Interim: More Options menu, delete messages and timeline are borrowed from Contacts
    // until Accounts-specific record detail tasks (MEP-332 etc.) implement them.
    moreOptions: buildContactsRecordMoreMenuGroups,
    deleteTitle: CONTACTS_DELETE_CONFIRM_TITLE,
    deleteMessage: CONTACTS_DELETE_CONFIRM_MESSAGE,
    loadingAttributes: { "data-account-record-loading": true },
    timeline: {
      subtabs: CONTACTS_TIMELINE_SUBTABS,
      modules: CONTACTS_TIMELINE_MODULE_OPTIONS,
      sources: CONTACTS_TIMELINE_SOURCE_OPTIONS,
      events: CONTACTS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeContactsEventKind,
      upcomingAutomatedActions: {
        label: "Show Upcoming Automated Actions",
        laterModule: "M12",
      },
    },
  },
};
