import { Icons } from "@/components/ui/icon";
import { accountsFormRules } from "../accounts/accounts-form-rules";
import { isAccountInlineEditable } from "../accounts/accounts-inline-edit";
import { formatAccountsLastUpdateLabel } from "../accounts/accounts-last-update";
import { ActivitySidePanel } from "../activity-detail";
import type { ModuleScreenDefinition } from "../types";
import { buildCallsBusinessCardFields, buildCallsDetailSections } from "./calls-detail-sections";
import { callsRecordHeaderIdentity } from "./calls-record-header";
import {
  buildCallsRecordMoreMenuGroups,
  CALLS_DELETE_CONFIRM_MESSAGE,
  CALLS_DELETE_CONFIRM_TITLE,
} from "./calls-record-more-options";
import { isCallScheduled } from "./calls-reschedule";
import {
  CALLS_TIMELINE_EMPTY_EVENTS,
  CALLS_TIMELINE_MODULE_OPTIONS,
  CALLS_TIMELINE_SOURCE_OPTIONS,
  CALLS_TIMELINE_SUBTABS,
  normalizeCallsEventKind,
} from "./calls-timeline";
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
    layout: "activity",
    titleGlyph: Icons.phone,
    header: callsRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: true,
    addTags: { label: "Add Tags", laterModule: "M5" },
    // Scheduled calls: Reschedule Call split button and Edit in More; other states keep Edit.
    buildHeaderCommands: (record, { editHref }) =>
      isCallScheduled(record)
        ? [
            {
              id: "reschedule-call",
              label: "Reschedule Call",
              variant: "primary" as const,
              href: editHref,
              splitLabel: "Reschedule options",
            },
          ]
        : [{ id: "edit", label: "Edit", variant: "secondary" as const, href: editHref }],
    businessCard: buildCallsBusinessCardFields,
    sections: buildCallsDetailSections,
    inlineEditable: isAccountInlineEditable,
    lastUpdate: formatAccountsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: (handlers) =>
      buildCallsRecordMoreMenuGroups({
        onEdit: handlers.onEdit ?? handlers.onClone,
        onDelete: handlers.onDelete,
      }),
    deleteTitle: CALLS_DELETE_CONFIRM_TITLE,
    deleteMessage: CALLS_DELETE_CONFIRM_MESSAGE,
    SidePanel: ActivitySidePanel,
    timeline: {
      subtabs: CALLS_TIMELINE_SUBTABS,
      modules: CALLS_TIMELINE_MODULE_OPTIONS,
      sources: CALLS_TIMELINE_SOURCE_OPTIONS,
      events: CALLS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeCallsEventKind,
      upcomingAutomatedActions: { label: "Upcoming Automated Actions", laterModule: "M11" },
    },
  },
};
