import { Icons } from "@/components/ui/icon";
import type { ModuleScreenDefinition } from "../types";
import { LeadStatusRibbonSection } from "./lead-status-ribbon-section";
import { buildLeadsBusinessCardFields, buildLeadsDetailSections } from "./leads-detail-sections";
import { leadsFormRules } from "./leads-form-rules";
import { isLeadInlineEditable } from "./leads-inline-edit";
import { formatLeadsLastUpdateLabel } from "./leads-last-update";
import { leadsRecordHeaderIdentity } from "./leads-record-header";
import {
  buildLeadsRecordMoreMenuGroups,
  LEADS_DELETE_CONFIRM_MESSAGE,
  LEADS_DELETE_CONFIRM_TITLE,
} from "./leads-record-more-options";
import { readLeadStatusValue } from "./leads-status-ribbon";
import {
  LEADS_TIMELINE_EMPTY_EVENTS,
  LEADS_TIMELINE_MODULE_OPTIONS,
  LEADS_TIMELINE_SOURCE_OPTIONS,
  LEADS_TIMELINE_SUBTABS,
} from "./leads-timeline";
import { LEADS_LIST_CURRENCY_CODE, LEADS_MODULE, leadsListPageConfig } from "./list-config";
import { buildLeadsFilterGroups } from "./list-filters";

/** Interim criterion field order (MEP-352); rows missing from metadata are skipped. */
export const leadsMergeDefinition = {
  criterionFields: ["First_Name", "Last_Name", "Email", "Phone", "Mobile", "Company"],
  matchingColumns: [
    "Full_Name",
    "Company",
    "Email",
    "Phone",
    "Mobile",
    "Created_Time",
    "Modified_Time",
    "Owner",
  ],
} as const;

export const leadsScreenDefinition: ModuleScreenDefinition = {
  apiName: LEADS_MODULE,
  tab: "Leads",
  singularLabel: "Lead",
  pluralLabel: "Leads",
  pageTitle: "Leads",
  navigation: { id: "leads", icon: Icons.building },
  list: leadsListPageConfig,
  listCurrencyCode: LEADS_LIST_CURRENCY_CODE,
  merge: leadsMergeDefinition,
  buildFilterGroups: buildLeadsFilterGroups,
  form: { rules: leadsFormRules },
  detail: {
    header: leadsRecordHeaderIdentity,
    businessCard: buildLeadsBusinessCardFields,
    sections: buildLeadsDetailSections,
    inlineEditable: isLeadInlineEditable,
    lastUpdate: formatLeadsLastUpdateLabel,
    moreOptions: buildLeadsRecordMoreMenuGroups,
    deleteTitle: LEADS_DELETE_CONFIRM_TITLE,
    deleteMessage: LEADS_DELETE_CONFIRM_MESSAGE,
    loadingAttributes: { "data-lead-record-loading": true },
    statusRibbon: {
      field: "Lead_Status",
      readValue: readLeadStatusValue,
      component: LeadStatusRibbonSection,
    },
    timeline: {
      subtabs: LEADS_TIMELINE_SUBTABS,
      modules: LEADS_TIMELINE_MODULE_OPTIONS,
      sources: LEADS_TIMELINE_SOURCE_OPTIONS,
      events: LEADS_TIMELINE_EMPTY_EVENTS,
      normalizeEventKind: (kind) => (kind === "lead_image_upload" ? "image_upload" : kind),
    },
    relatedLists: [],
  },
};
