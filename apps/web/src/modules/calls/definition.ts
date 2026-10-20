import { Icons } from "@/components/ui/icon";
import { isAccountInlineEditable } from "../accounts/accounts-inline-edit";
import { formatAccountsLastUpdateLabel } from "../accounts/accounts-last-update";
import { ActivitySidePanel } from "../activity-detail";
import type { ModuleScreenDefinition } from "../types";
import { buildCallsBusinessCardFields, buildCallsDetailSections } from "./calls-detail-sections";
import {
  CALLS_EDIT_INTENTS,
  CALLS_FORM_CANCELLED_STATUS,
  CALLS_FORM_FALLBACK_COLUMNS,
  callsFormRules,
} from "./calls-form-rules";
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

export const CALLS_CANCEL_CONFIRM_TITLE = "Cancel Call";
export const CALLS_CANCEL_CONFIRM_MESSAGE = "Are you sure you want to cancel this Call?";

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
    variant: "activity",
    rules: callsFormRules,
    fallbackColumns: CALLS_FORM_FALLBACK_COLUMNS,
    inventoryChrome: true,
    editIntents: CALLS_EDIT_INTENTS,
  },
  detail: {
    layout: "activity",
    titleGlyph: Icons.phone,
    header: callsRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: true,
    addTags: { label: "Add Tags", laterModule: "M6" },
    // Scheduled calls: Reschedule Call split button and Edit in More; other states keep Edit.
    buildHeaderCommands: (record, { editHref, save, navigate, confirm }) =>
      isCallScheduled(record)
        ? [
            {
              id: "reschedule-call",
              label: "Reschedule Call",
              variant: "primary" as const,
              href: `${editHref}?intent=reschedule`,
              splitLabel: "Reschedule options",
              splitMenu: [
                {
                  id: "mark-as-completed",
                  label: "Mark as Completed",
                  onAction: () => navigate(`${editHref}?intent=complete`),
                },
                {
                  id: "cancel-call",
                  label: "Cancel Call",
                  onAction: () =>
                    confirm({
                      title: CALLS_CANCEL_CONFIRM_TITLE,
                      message: CALLS_CANCEL_CONFIRM_MESSAGE,
                      confirmLabel: "Cancel Call",
                      onConfirm: () => save({ Outgoing_Call_Status: CALLS_FORM_CANCELLED_STATUS }),
                    }),
                },
              ],
            },
          ]
        : [],
    businessCard: buildCallsBusinessCardFields,
    sections: buildCallsDetailSections,
    inlineEditable: isAccountInlineEditable,
    lastUpdate: formatAccountsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: (handlers) =>
      buildCallsRecordMoreMenuGroups({
        onEdit: handlers.onEdit ?? (() => {}),
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
