import { Icons } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { moduleRecordPath } from "@/lib/crm-paths";
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
    buildHeaderCommands: (
      _record,
      { editHref, printHref, orgSlug, navigate, confirm, convertQuoteToInvoice },
    ) => [
      {
        id: "convert",
        label: "Convert",
        variant: "secondary" as const,
        menu: [
          {
            id: "convert-invoice",
            label: "Invoice",
            onAction: () => {
              confirm({
                title: "Convert Quote",
                message: "Are you sure you want to convert this Quote to an Invoice?",
                confirmLabel: "Convert",
                onConfirm: async () => {
                  try {
                    if (!convertQuoteToInvoice)
                      throw new Error("Quote conversion is not supported.");
                    const invoiceId = await convertQuoteToInvoice();
                    navigate(moduleRecordPath(orgSlug ?? "", "Invoices", invoiceId));
                  } catch (error) {
                    const message = error instanceof Error ? error.message : "Conversion failed";
                    toast({ variant: "danger", title: "Conversion failed", message });
                    throw error;
                  }
                },
              });
            },
          },
        ],
      },
      ...(printHref
        ? [
            {
              id: "print-preview",
              label: "Print Preview",
              variant: "secondary" as const,
              href: printHref,
            },
          ]
        : []),
      { id: "edit", label: "Edit", variant: "secondary" as const, href: editHref },
    ],
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
