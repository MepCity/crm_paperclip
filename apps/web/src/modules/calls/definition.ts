import { Icons } from "@/components/ui/icon";
import { isDealInlineEditable } from "../deals/deals-inline-edit";
import { formatDealsLastUpdateLabel } from "../deals/deals-last-update";
import type { ModuleScreenDefinition } from "../types";
import { CallRecordScreen } from "./call-record-screen";
import { buildCallsBusinessCardFields, buildCallsDetailSections } from "./calls-detail-sections";
import {
  CALLS_EDIT_INTENTS,
  CALLS_FORM_FALLBACK_COLUMNS,
  callsFormRules,
} from "./calls-form-rules";
import { callsRecordHeaderIdentity } from "./calls-record-header";
import {
  buildCallsRecordMoreMenuGroups,
  CALLS_DELETE_CONFIRM_MESSAGE,
  CALLS_DELETE_CONFIRM_TITLE,
} from "./calls-record-more-options";
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
    variant: "activity",
    rules: callsFormRules,
    fallbackColumns: CALLS_FORM_FALLBACK_COLUMNS,
    inventoryChrome: true,
    editIntents: CALLS_EDIT_INTENTS,
  },
  detail: {
    header: callsRecordHeaderIdentity,
    hasPortrait: true,
    portraitIcon: Icons.phone,
    portraitAppearance: "inline",
    lastUpdatePlacement: "tab-row",
    addTags: { label: "Add Tags", laterModule: "M6" },
    businessCard: buildCallsBusinessCardFields,
    sections: buildCallsDetailSections,
    inlineEditable: isDealInlineEditable,
    lastUpdate: formatDealsLastUpdateLabel,
    moreOptions: buildCallsRecordMoreMenuGroups,
    deleteTitle: CALLS_DELETE_CONFIRM_TITLE,
    deleteMessage: CALLS_DELETE_CONFIRM_MESSAGE,
    timeline: {
      subtabs: CALLS_TIMELINE_SUBTABS,
      modules: CALLS_TIMELINE_MODULE_OPTIONS,
      sources: CALLS_TIMELINE_SOURCE_OPTIONS,
      events: CALLS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeCallsEventKind,
    },
    Screen: CallRecordScreen,
  },
};
