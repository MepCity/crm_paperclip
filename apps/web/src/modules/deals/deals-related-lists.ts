import { createElement } from "react";
import { ContactRolesCardBody } from "@/components/records/detail/contact-roles-card-body";
import { DealStageHistoryCardBody } from "@/components/records/detail/deal-stage-history-card-body";
import { RelatedCasesCardBody } from "@/components/records/detail/related-cases-card-body";
import { Icons } from "@/components/ui/icon";
import { attachmentsCard } from "../attachments-card";
import { notesCardBody, openNotesComposer } from "../notes-card";
import { parentActivitiesBody } from "../parent-activity-cards";
import type {
  RelatedListActivityColumnDefinition,
  RelatedListDefinition,
  RelatedListRailChromeDefinition,
  RelatedListTableColumnDefinition,
} from "../types";

export const dealsRelatedListRail: RelatedListRailChromeDefinition = {
  organizeAriaLabel: "Organize Deal Details",
};

export type DealsRelatedListBadges = {
  stageHistory?: number;
  contactRoles?: number;
  openActivities?: number;
  closedActivities?: number;
};

export type DealsRelatedListHandlers = {
  onCasesNew?: () => void;
};

export type CreateDealsRelatedListsOptions = {
  handlers?: DealsRelatedListHandlers;
  badges?: DealsRelatedListBadges;
};

const STAGE_HISTORY_COLUMNS: readonly RelatedListTableColumnDefinition[] = [
  { id: "Stage", label: "Stage" },
  { id: "Amount", label: "Amount" },
  { id: "Probability", label: "Probability (%)" },
  { id: "Expected_Revenue", label: "Expected Revenue" },
  { id: "Closing_Date", label: "Closing Date" },
  { id: "Stage_Duration_Calendar_Days", label: "Stage Duration (Calendar Days)" },
  { id: "Modified_Time", label: "Modified Time" },
  { id: "Modified_By", label: "Modified By" },
];

const CONTACT_ROLES_COLUMNS: readonly RelatedListTableColumnDefinition[] = [
  { id: "contactName", label: "Contact Name" },
  { id: "accountName", label: "Account Name" },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "roleName", label: "Role Name" },
];

/** DD-111: reference shows an untranslated column-view label in this slot. */
export const DEALS_OPEN_ACTIVITIES_COLUMN_VIEW_LABEL = "crm.label.openActivities.columnView";

/** DD-137: deal association scope selector (clipped in reference captures). */
export const DEALS_EMAILS_SCOPE_LABEL = "Emails associated with this Deal";

function badgeValue(count: number | undefined): number | undefined {
  return count !== undefined && count > 0 ? count : undefined;
}

function activityCount(
  columns: readonly RelatedListActivityColumnDefinition[],
  supplied: number | undefined,
): number | undefined {
  return supplied ?? columns.reduce((total, column) => total + column.count, 0);
}

export function createDealsRelatedLists(
  options: CreateDealsRelatedListsOptions = {},
): readonly RelatedListDefinition[] {
  const { badges = {}, handlers = {} } = options;
  const stageHistoryBadge = badgeValue(badges.stageHistory);
  const openActivityColumns: readonly RelatedListActivityColumnDefinition[] = [
    {
      id: "open-tasks",
      title: "Open Tasks",
      count: 0,
      emptyText: "No records found",
      icon: Icons.check,
    },
    {
      id: "open-meetings",
      title: "Open Meetings",
      count: 0,
      emptyText: "No records found",
      icon: Icons.calendar,
    },
  ];
  const closedActivityColumns: readonly RelatedListActivityColumnDefinition[] = [
    {
      id: "closed-tasks",
      title: "Closed Tasks",
      count: 0,
      emptyText: "No records found",
      icon: Icons.check,
    },
    {
      id: "closed-meetings",
      title: "Closed Meetings",
      count: 0,
      emptyText: "No records found",
      icon: Icons.calendar,
    },
  ];
  const openActivitiesBadge = badgeValue(activityCount(openActivityColumns, badges.openActivities));
  const closedActivitiesBadge = badgeValue(
    activityCount(closedActivityColumns, badges.closedActivities),
  );

  return [
    {
      id: "notes",
      renderBody: notesCardBody("Deals"),
      title: "Notes",
      moduleKey: "M2",
      order: 1,
      targetId: "related-list-notes",
      railAction: {
        id: "notes-add",
        label: "Add",
        onAction: openNotesComposer,
      },
      emptyStateText: "No records found",
    },
    {
      id: "connected-records",
      title: "Connected Records",
      moduleKey: "P3",
      order: 2,
      targetId: "related-list-connected-records",
      emptyStateText: "No records found",
    },
    {
      id: "attachments",
      renderCard: attachmentsCard("Deals"),
      title: "Attachments",
      moduleKey: "M6",
      order: 3,
      targetId: "related-list-attachments",
      upperControls: [
        {
          id: "attach",
          label: "Attach",
          type: "split-button",
          moduleKey: "M6",
        },
      ],
      emptyStateText: "No Attachment",
    },
    {
      id: "stage-history",
      renderBody: ({ record }) =>
        record ? createElement(DealStageHistoryCardBody, { dealId: record.id }) : undefined,
      title: "Stage History",
      moduleKey: "M4",
      order: 4,
      targetId: "related-list-stage-history",
      countBadge: stageHistoryBadge,
      upperControls: [
        {
          id: "table-plus-stage-history",
          label: "Customize",
          type: "icon-button",
          moduleKey: "M11",
          icon: Icons.tablePlus,
        },
      ],
      tableColumns: STAGE_HISTORY_COLUMNS,
      emptyStateText: "No records found",
    },
    {
      id: "competitors",
      title: "Competitors",
      moduleKey: "P3",
      order: 5,
      targetId: "related-list-competitors",
      upperControls: [
        {
          id: "new-competitor",
          label: "New",
          type: "button",
          moduleKey: "P3",
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "cadences",
      title: "Cadences",
      moduleKey: "P3",
      order: 6,
      targetId: "related-list-cadences",
      railAction: {
        id: "cadences-add",
        label: "Add",
        moduleKey: "P3",
      },
      upperControls: [
        {
          id: "enroll",
          label: "Enroll",
          type: "button",
          moduleKey: "P3",
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "open-activities",
      renderBody: parentActivitiesBody("Deals", "open"),
      title: "Open Activities",
      moduleKey: "M5",
      order: 7,
      targetId: "related-list-open-activities",
      countBadge: openActivitiesBadge,
      upperControls: [
        {
          id: "add-new",
          label: "Add New",
          type: "split-button",
          moduleKey: "M5",
        },
        {
          id: "column-view-open",
          label: DEALS_OPEN_ACTIVITIES_COLUMN_VIEW_LABEL,
          type: "select",
          moduleKey: "M5",
        },
        {
          id: "table-plus-open",
          label: "Customize",
          type: "icon-button",
          moduleKey: "M11",
          icon: Icons.tablePlus,
        },
        {
          id: "expand-open",
          label: "Expand",
          type: "icon-button",
          moduleKey: "M5",
          icon: Icons.diagonalExpand,
        },
      ],
      activityColumns: openActivityColumns,
    },
    {
      id: "closed-activities",
      renderBody: parentActivitiesBody("Deals", "closed"),
      title: "Closed Activities",
      moduleKey: "M5",
      order: 8,
      targetId: "related-list-closed-activities",
      countBadge: closedActivitiesBadge,
      upperControls: [
        {
          id: "column-view-closed",
          label: "Column View",
          type: "select",
          moduleKey: "M5",
        },
        {
          id: "table-plus-closed",
          label: "Customize",
          type: "icon-button",
          moduleKey: "M11",
          icon: Icons.tablePlus,
        },
        {
          id: "expand-closed",
          label: "Expand",
          type: "icon-button",
          moduleKey: "M5",
          icon: Icons.diagonalExpand,
        },
      ],
      activityColumns: closedActivityColumns,
    },
    {
      id: "products",
      title: "Products",
      moduleKey: "P2",
      order: 9,
      targetId: "related-list-products",
      upperControls: [
        {
          id: "add-products",
          label: "Add Products",
          type: "button",
          moduleKey: "P2",
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "quotes",
      title: "Quotes",
      moduleKey: "P2",
      order: 10,
      targetId: "related-list-quotes",
      upperControls: [
        {
          id: "assign-quotes",
          label: "Assign",
          type: "button",
          moduleKey: "P2",
        },
        {
          id: "new-quote",
          label: "New",
          type: "button",
          moduleKey: "P2",
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "sales-orders",
      title: "Sales Orders",
      moduleKey: "P2",
      order: 11,
      targetId: "related-list-sales-orders",
      railAction: {
        id: "sales-orders-add",
        label: "Add",
        moduleKey: "P2",
      },
      upperControls: [
        {
          id: "assign-sales-orders",
          label: "Assign",
          type: "button",
          moduleKey: "P2",
        },
        {
          id: "new-sales-order",
          label: "New",
          type: "button",
          moduleKey: "P2",
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "contact-roles",
      renderBody: ({ record, recordPath }) =>
        record
          ? createElement(ContactRolesCardBody, {
              dealId: record.id,
              contactPath: (id) => recordPath("Contacts", id),
              accountPath: (id) => recordPath("Accounts", id),
            })
          : undefined,
      showEmptyTable: true,
      countBadge: badgeValue(badges.contactRoles),
      title: "Contact Roles",
      moduleKey: "M2",
      order: 12,
      targetId: "related-list-contact-roles",
      upperControls: [
        {
          id: "add-contact-roles",
          label: "Add Contacts Roles",
          type: "button",
          moduleKey: "M2",
        },
        {
          id: "edit-all-contact-roles",
          label: "Edit All",
          type: "button",
          moduleKey: "M2",
        },
        {
          id: "table-plus-contact-roles",
          label: "Customize",
          type: "icon-button",
          moduleKey: "M11",
          icon: Icons.tablePlus,
        },
      ],
      tableColumns: CONTACT_ROLES_COLUMNS,
      emptyStateText: "No records found",
    },
    {
      id: "emails",
      title: "Emails",
      moduleKey: "M10",
      order: 13,
      targetId: "related-list-emails",
      upperControls: [
        {
          id: "compose-email",
          label: "Compose Email",
          type: "button",
          moduleKey: "M10",
        },
      ],
      subtabs: [
        { id: "mails", label: "Mails" },
        { id: "drafts", label: "Drafts" },
        { id: "scheduled", label: "Scheduled" },
      ],
      subtabRowEndControl: {
        id: "deal-email-scope",
        label: DEALS_EMAILS_SCOPE_LABEL,
        type: "select",
        moduleKey: "M10",
      },
      emptyStateText: "No records found",
    },
    {
      id: "cases",
      renderBody: ({ record, recordPath }) =>
        record
          ? createElement(RelatedCasesCardBody, {
              managerRecord: record,
              filterField: "Deal_Name",
              caseRecordPath: (id) => recordPath("Cases", id),
            })
          : undefined,
      title: "Cases",
      moduleKey: "M4",
      order: 14,
      targetId: "related-list-cases",
      upperControls: [
        {
          id: "assign-cases",
          label: "Assign",
          type: "button",
          moduleKey: "M4",
        },
        {
          id: "new-case",
          label: "New",
          type: "button",
          moduleKey: "M4",
          onAction: handlers.onCasesNew,
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "invoices",
      title: "Invoices",
      moduleKey: "P2",
      order: 15,
      targetId: "related-list-invoices",
      railAction: {
        id: "invoices-add",
        label: "Add",
        moduleKey: "P2",
      },
      upperControls: [
        {
          id: "assign-invoices",
          label: "Assign",
          type: "button",
          moduleKey: "P2",
        },
        {
          id: "new-invoice",
          label: "New",
          type: "button",
          moduleKey: "P2",
        },
      ],
      emptyStateText: "No records found",
    },
  ];
}

export const dealsRelatedLists = createDealsRelatedLists();
