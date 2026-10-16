import { Icons } from "@/components/ui/icon";
import { isDealInlineEditable } from "../deals/deals-inline-edit";
import { formatDealsLastUpdateLabel } from "../deals/deals-last-update";
import type { ModuleScreenDefinition } from "../types";
import { MEETINGS_LIST_CURRENCY_CODE, meetingsListPageConfig } from "./list-config";
import { buildMeetingsFilterGroups } from "./list-filters";
import { MeetingRecordScreen } from "./meeting-record-screen";
import {
  buildMeetingsBusinessCardFields,
  buildMeetingsDetailSections,
} from "./meetings-detail-sections";
import { meetingsFormRules } from "./meetings-form-rules";
import { meetingsRecordHeaderIdentity } from "./meetings-record-header";
import {
  buildMeetingsRecordMoreMenuGroups,
  MEETINGS_DELETE_CONFIRM_MESSAGE,
  MEETINGS_DELETE_CONFIRM_TITLE,
} from "./meetings-record-more-options";
import {
  MEETINGS_TIMELINE_EMPTY_EVENTS,
  MEETINGS_TIMELINE_MODULE_OPTIONS,
  MEETINGS_TIMELINE_SOURCE_OPTIONS,
  MEETINGS_TIMELINE_SUBTABS,
  normalizeMeetingsEventKind,
} from "./meetings-timeline";

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
    variant: "activity",
    rules: meetingsFormRules,
    inventoryChrome: true,
  },
  detail: {
    header: meetingsRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: true,
    lastUpdatePlacement: "tab-row",
    addTags: { label: "Add Tags", laterModule: "M6" },
    Screen: MeetingRecordScreen,
    businessCard: buildMeetingsBusinessCardFields,
    sections: buildMeetingsDetailSections,
    inlineEditable: isDealInlineEditable,
    lastUpdate: formatDealsLastUpdateLabel,
    moreOptions: buildMeetingsRecordMoreMenuGroups,
    deleteTitle: MEETINGS_DELETE_CONFIRM_TITLE,
    deleteMessage: MEETINGS_DELETE_CONFIRM_MESSAGE,
    timeline: {
      subtabs: MEETINGS_TIMELINE_SUBTABS,
      modules: MEETINGS_TIMELINE_MODULE_OPTIONS,
      sources: MEETINGS_TIMELINE_SOURCE_OPTIONS,
      events: MEETINGS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeMeetingsEventKind,
    },
  },
};
