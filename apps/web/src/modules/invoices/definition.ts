import { Icons } from "@/components/ui/icon";
import { buildAccountsRecordMoreMenuGroups } from "../accounts/accounts-record-more-options";
import {
  ACCOUNTS_TIMELINE_MODULE_OPTIONS,
  ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
  ACCOUNTS_TIMELINE_SUBTABS,
  normalizeAccountsEventKind,
} from "../accounts/accounts-timeline";
import type { ModuleScreenDefinition } from "../types";
import {
  buildInvoicesBusinessCardFields,
  buildInvoicesDetailSections,
} from "./invoices-detail-sections";
import {
  INVOICES_DELETE_CONFIRM_MESSAGE,
  INVOICES_DELETE_CONFIRM_TITLE,
  invoicesFormRules,
} from "./invoices-form-rules";
import { isInvoiceInlineEditable } from "./invoices-inline-edit";
import { formatInvoicesLastUpdateLabel } from "./invoices-last-update";
import { invoicesRecordHeaderIdentity } from "./invoices-record-header";
import { invoicesRelatedListRail, invoicesRelatedLists } from "./invoices-related-lists";
import { INVOICES_LIST_CURRENCY_CODE, invoicesListPageConfig } from "./list-config";
import { buildInvoicesFilterGroups } from "./list-filters";

/**
 * Registered in `registry.ts`. The more-options menu and the timeline are temporary
 * Accounts bindings. The line-item table is integrated separately (ADR 0016).
 */
export const invoicesScreenDefinition: ModuleScreenDefinition = {
  apiName: "Invoices",
  tab: "Invoices",
  singularLabel: "Invoice",
  pluralLabel: "Invoices",
  pageTitle: "Invoices",
  navigation: { id: "invoices", icon: Icons.store, group: "flat" },
  list: invoicesListPageConfig,
  listCurrencyCode: INVOICES_LIST_CURRENCY_CODE,
  searchColumns: ["Subject", "Invoice_Number", "Status", "Owner"],
  buildFilterGroups: buildInvoicesFilterGroups,
  form: {
    rules: invoicesFormRules,
  },
  detail: {
    header: invoicesRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: true,
    businessCard: buildInvoicesBusinessCardFields,
    sections: buildInvoicesDetailSections,
    inlineEditable: isInvoiceInlineEditable,
    lastUpdate: formatInvoicesLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: INVOICES_DELETE_CONFIRM_TITLE,
    deleteMessage: INVOICES_DELETE_CONFIRM_MESSAGE,
    relatedLists: invoicesRelatedLists,
    relatedListRail: invoicesRelatedListRail,
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
