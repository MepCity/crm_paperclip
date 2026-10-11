import { Icons } from "@/components/ui/icon";
import type { ModuleScreenDefinition } from "../types";
import {
  buildContactsBusinessCardFields,
  buildContactsDetailSections,
} from "./contacts-detail-sections";
import {
  CONTACTS_FORM_ADDRESS_GROUPS,
  CONTACTS_FORM_INFORMATION_COLUMNS,
  contactsFormRules,
} from "./contacts-form-rules";
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

export const contactsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Contacts",
  tab: "Contacts",
  singularLabel: "Contact",
  pluralLabel: "Contacts",
  pageTitle: "Contacts",
  navigation: { id: "contacts", icon: Icons.users },
  list: contactsListPageConfig,
  listCurrencyCode: CONTACTS_LIST_CURRENCY_CODE,
  buildFilterGroups: buildContactsFilterGroups,
  form: {
    rules: contactsFormRules,
    fallbackColumns: { "Contact Information": CONTACTS_FORM_INFORMATION_COLUMNS },
    addressGroups: CONTACTS_FORM_ADDRESS_GROUPS,
  },
  detail: {
    header: contactsRecordHeaderIdentity,
    businessCard: buildContactsBusinessCardFields,
    sections: buildContactsDetailSections,
    inlineEditable: isContactInlineEditable,
    lastUpdate: formatContactsLastUpdateLabel,
    moreOptions: buildContactsRecordMoreMenuGroups,
    deleteTitle: CONTACTS_DELETE_CONFIRM_TITLE,
    deleteMessage: CONTACTS_DELETE_CONFIRM_MESSAGE,
    timeline: {
      subtabs: CONTACTS_TIMELINE_SUBTABS,
      modules: CONTACTS_TIMELINE_MODULE_OPTIONS,
      sources: CONTACTS_TIMELINE_SOURCE_OPTIONS,
      events: CONTACTS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeContactsEventKind,
    },
  },
};
