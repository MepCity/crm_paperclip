import type { RecordData } from "@crm/core/records";
import { Icons } from "@/components/ui/icon";
import {
  buildDealsBusinessCardFields,
  buildDealsDetailSections,
} from "../deals/deals-detail-sections";
import { isDealInlineEditable } from "../deals/deals-inline-edit";
import { formatDealsLastUpdateLabel } from "../deals/deals-last-update";
import { buildDealsRecordMoreMenuGroups } from "../deals/deals-record-more-options";
import {
  DEALS_TIMELINE_EMPTY_EVENTS,
  DEALS_TIMELINE_MODULE_OPTIONS,
  DEALS_TIMELINE_SOURCE_OPTIONS,
  DEALS_TIMELINE_SUBTABS,
  normalizeDealsEventKind,
} from "../deals/deals-timeline";
import type { ModuleScreenDefinition } from "../types";
import { TASKS_LIST_CURRENCY_CODE, tasksListPageConfig } from "./list-config";
import { buildTasksFilterGroups } from "./list-filters";
import { TASKS_FORM_INFORMATION_COLUMNS, tasksFormRules } from "./tasks-form-rules";

/**
 * Interim: the Tasks detail research is still open, so the detail screen
 * below borrows the module-neutral Deals builders (layout-driven sections, shared
 * inline edit, last-update label, empty timeline, More Options). Only the header title
 * is Tasks-specific.
 */
function tasksRecordHeaderIdentity(record: RecordData) {
  const title = typeof record.fields.Subject === "string" ? record.fields.Subject : "";
  return { title, hasPortrait: false, recordNavigation: false };
}

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
    variant: "activity",
    rules: tasksFormRules,
    fallbackColumns: { "Task Information": TASKS_FORM_INFORMATION_COLUMNS },
    inventoryChrome: true,
  },
  detail: {
    header: tasksRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: false,
    businessCard: buildDealsBusinessCardFields,
    sections: buildDealsDetailSections,
    inlineEditable: isDealInlineEditable,
    lastUpdate: formatDealsLastUpdateLabel,
    moreOptions: buildDealsRecordMoreMenuGroups,
    deleteTitle: "Delete Task",
    deleteMessage: "Are you sure you want to delete this Task?",
    timeline: {
      subtabs: DEALS_TIMELINE_SUBTABS,
      modules: DEALS_TIMELINE_MODULE_OPTIONS,
      sources: DEALS_TIMELINE_SOURCE_OPTIONS,
      events: DEALS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: normalizeDealsEventKind,
    },
  },
};
