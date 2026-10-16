import { Icons } from "@/components/ui/icon";
import { isAccountInlineEditable } from "../accounts/accounts-inline-edit";
import { formatAccountsLastUpdateLabel } from "../accounts/accounts-last-update";
import { ActivitySidePanel } from "../activity-detail";
import type { ModuleScreenDefinition } from "../types";
import { MEETINGS_LIST_CURRENCY_CODE, meetingsListPageConfig } from "./list-config";
import { buildMeetingsFilterGroups } from "./list-filters";
import {
  buildMeetingsBusinessCardFields,
  buildMeetingsDetailSections,
} from "./meetings-detail-sections";
import { meetingsFormRules } from "./meetings-form-rules";
import { MeetingsParticipantsCard } from "./meetings-participants-card";
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

/** Interim: the Meetings form still borrows the neutral Accounts form rules. */
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
    rules: meetingsFormRules,
    inventoryChrome: true,
  },
  detail: {
    layout: "activity",
    titleGlyph: Icons.calendar,
    header: meetingsRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: true,
    addTags: { label: "Add Tags", laterModule: "M5" },
    businessCard: buildMeetingsBusinessCardFields,
    sections: buildMeetingsDetailSections,
    inlineEditable: isAccountInlineEditable,
    lastUpdate: formatAccountsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildMeetingsRecordMoreMenuGroups,
    deleteTitle: MEETINGS_DELETE_CONFIRM_TITLE,
    deleteMessage: MEETINGS_DELETE_CONFIRM_MESSAGE,
    BetweenCards: () => <MeetingsParticipantsCard participants={[]} />,
    SidePanel: ActivitySidePanel,
    timeline: {
      subtabs: MEETINGS_TIMELINE_SUBTABS,
      modules: MEETINGS_TIMELINE_MODULE_OPTIONS,
      sources: MEETINGS_TIMELINE_SOURCE_OPTIONS,
      events: MEETINGS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeMeetingsEventKind,
      upcomingAutomatedActions: { label: "Upcoming Automated Actions", laterModule: "M11" },
    },
  },
};
