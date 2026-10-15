import { Icons } from "@/components/ui/icon";
import { ActivitySidePanel } from "../activity-detail";
import { isDealInlineEditable } from "../deals/deals-inline-edit";
import { formatDealsLastUpdateLabel } from "../deals/deals-last-update";
import type { ModuleScreenDefinition } from "../types";
import { TASKS_LIST_CURRENCY_CODE, tasksListPageConfig } from "./list-config";
import { buildTasksFilterGroups } from "./list-filters";
import { closeTaskPatch, isCloseTaskButtonVisible } from "./tasks-closing";
import { buildTasksBusinessCardFields, buildTasksDetailSections } from "./tasks-detail-sections";
import { TASKS_FORM_INFORMATION_COLUMNS, tasksFormRules } from "./tasks-form-rules";
import { tasksRecordHeaderIdentity } from "./tasks-record-header";
import {
  buildTasksRecordMoreMenuGroups,
  TASKS_DELETE_CONFIRM_MESSAGE,
  TASKS_DELETE_CONFIRM_TITLE,
} from "./tasks-record-more-options";
import {
  normalizeTasksEventKind,
  TASKS_TIMELINE_EMPTY_EVENTS,
  TASKS_TIMELINE_MODULE_OPTIONS,
  TASKS_TIMELINE_SOURCE_OPTIONS,
  TASKS_TIMELINE_SUBTABS,
} from "./tasks-timeline";

export const tasksScreenDefinition: ModuleScreenDefinition = {
  apiName: "Tasks",
  tab: "Tasks",
  singularLabel: "Task",
  pluralLabel: "Tasks",
  pageTitle: "Tasks",
  navigation: { id: "tasks", icon: Icons.check, group: "activities" },
  list: tasksListPageConfig,
  listCurrencyCode: TASKS_LIST_CURRENCY_CODE,
  searchColumns: ["Subject", "Due_Date", "Status", "Priority", "Owner"],
  buildFilterGroups: buildTasksFilterGroups,
  form: {
    rules: tasksFormRules,
    fallbackColumns: { "Task Information": TASKS_FORM_INFORMATION_COLUMNS },
    inventoryChrome: true,
  },
  detail: {
    layout: "activity",
    titleGlyph: Icons.checkSquare,
    header: tasksRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: true,
    addTags: { label: "Add Tags", laterModule: "M5" },
    buildHeaderCommands: (record, { editHref, save }) => [
      ...(isCloseTaskButtonVisible(record)
        ? [
            {
              id: "close-task",
              label: "Close Task",
              variant: "primary" as const,
              onPress: () => void save(closeTaskPatch()),
            },
          ]
        : []),
      { id: "edit", label: "Edit", variant: "secondary" as const, href: editHref },
    ],
    businessCard: buildTasksBusinessCardFields,
    sections: buildTasksDetailSections,
    inlineEditable: isDealInlineEditable,
    lastUpdate: formatDealsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildTasksRecordMoreMenuGroups,
    deleteTitle: TASKS_DELETE_CONFIRM_TITLE,
    deleteMessage: TASKS_DELETE_CONFIRM_MESSAGE,
    SidePanel: ActivitySidePanel,
    timeline: {
      subtabs: TASKS_TIMELINE_SUBTABS,
      modules: TASKS_TIMELINE_MODULE_OPTIONS,
      sources: TASKS_TIMELINE_SOURCE_OPTIONS,
      events: TASKS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeTasksEventKind,
      upcomingAutomatedActions: { label: "Upcoming Automated Actions", laterModule: "M11" },
    },
  },
};
