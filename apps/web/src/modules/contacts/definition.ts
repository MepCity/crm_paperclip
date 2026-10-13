import { Icons } from "@/components/ui/icon";
import type { ModuleScreenDefinition } from "../types";
import { ContactRecordScreen } from "./contact-record-screen";
import {
  buildContactsBusinessCardFields,
  buildContactsDetailSections,
} from "./contacts-detail-sections";
import { CONTACTS_FORM_INFORMATION_COLUMNS, contactsFormRules } from "./contacts-form-rules";
import { isContactInlineEditable } from "./contacts-inline-edit";
import { formatContactsLastUpdateLabel } from "./contacts-last-update";
import { contactsRecordHeaderIdentity } from "./contacts-record-header";
import {
  buildContactsRecordMoreMenuGroups,
  CONTACTS_DELETE_CONFIRM_MESSAGE,
  CONTACTS_DELETE_CONFIRM_TITLE,
} from "./contacts-record-more-options";
import {
  CONTACTS_TIMELINE_EMPTY_EVENTS,
  CONTACTS_TIMELINE_MODULE_OPTIONS,
  CONTACTS_TIMELINE_SOURCE_OPTIONS,
  CONTACTS_TIMELINE_SUBTABS,
  normalizeContactsEventKind,
} from "./contacts-timeline";
import { CONTACTS_LIST_CURRENCY_CODE, contactsListPageConfig } from "./list-config";
import { buildContactsFilterGroups } from "./list-filters";

export const contactsMergeDefinition = {
  criterionFields: ["First_Name", "Last_Name", "Email", "Phone", "Mobile", "Account_Name"],
  matchingColumns: [
    "Full_Name",
    "Account_Name",
    "Email",
    "Phone",
    "Mobile",
    "Created_Time",
    "Modified_Time",
    "Owner",
  ],
} as const;

export const contactsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Contacts",
  tab: "Contacts",
  singularLabel: "Contact",
  pluralLabel: "Contacts",
  pageTitle: "Contacts",
  navigation: { id: "contacts", icon: Icons.users },
  search: { secondaryFields: ["Email", "Phone"] },
  list: contactsListPageConfig,
  listCurrencyCode: CONTACTS_LIST_CURRENCY_CODE,
  merge: contactsMergeDefinition,
  buildFilterGroups: buildContactsFilterGroups,
  form: {
    rules: contactsFormRules,
    fallbackColumns: { "Contact Information": CONTACTS_FORM_INFORMATION_COLUMNS },
    inventoryChrome: true,
    profileImageLaterModule: "M6",
  },
  detail: {
    Screen: ContactRecordScreen,
    header: contactsRecordHeaderIdentity,
    addTags: { label: "Add Tags", laterModule: "M6" },
    headerCommands: [{ id: "send-email", label: "Send Email", laterModule: "M10" }],
    businessCard: buildContactsBusinessCardFields,
    sections: buildContactsDetailSections,
    inlineEditable: isContactInlineEditable,
    lastUpdate: formatContactsLastUpdateLabel,
    moreOptions: buildContactsRecordMoreMenuGroups,
    deleteTitle: CONTACTS_DELETE_CONFIRM_TITLE,
    deleteMessage: CONTACTS_DELETE_CONFIRM_MESSAGE,
    loadingAttributes: { "data-contact-record-loading": true },
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
