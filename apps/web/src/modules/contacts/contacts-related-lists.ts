import { createElement } from "react";
import { RelatedDealsCardBody } from "@/components/records/detail/related-deals-card-body";
import { ReportingContactsCardBody } from "@/components/records/detail/reporting-contacts-card-body";
import { Icons } from "@/components/ui/icon";
import { notesCardBody } from "../notes-card";
import { parentActivitiesBody } from "../parent-activity-cards";
import type { RelatedListActivityColumnDefinition, RelatedListDefinition } from "../types";

export interface ContactsRelatedListHandlers {
  onHierarchyView?: () => void;
  onNewReportingContact?: () => void;
  onAddReportingContact?: () => void;
  onDealsNew?: () => void;
}

export interface ContactsRelatedListBadges {
  deals?: number;
  openActivities?: number;
  closedActivities?: number;
}

/** D-30/D-31: the rail badge is the number of records the card holds; zero draws no badge. */
function activityBadge(
  columns: readonly RelatedListActivityColumnDefinition[],
  supplied?: number,
): number | undefined {
  const total = supplied ?? columns.reduce((sum, column) => sum + column.count, 0);
  return total > 0 ? total : undefined;
}

export function createContactsRelatedLists(
  handlers: ContactsRelatedListHandlers = {},
  badges: ContactsRelatedListBadges = {},
): readonly RelatedListDefinition[] {
  const dealsBadge = badges.deals !== undefined && badges.deals > 0 ? badges.deals : undefined;
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
  return [
    {
      id: "notes",
      renderBody: notesCardBody("Contacts"),
      title: "Notes",
      moduleKey: "M6",
      order: 1,
      targetId: "related-list-notes",
      railAction: {
        id: "notes-add",
        label: "Add",
        moduleKey: "M6",
      },
      emptyStateText: "No records found",
    },
    {
      id: "connected-records",
      title: "Connected Records",
      moduleKey: "P3", // Spec Module: '?', drawn with laterModule="P3"
      order: 2,
      targetId: "related-list-connected-records",
      loadingText: "Loading...",
    },
    {
      id: "attachments",
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
      id: "cadences",
      title: "Cadences",
      moduleKey: "P3",
      order: 4,
      targetId: "related-list-cadences",
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
      id: "deals",
      renderBody: ({ record, recordPath, definition }) =>
        record
          ? createElement(RelatedDealsCardBody, {
              managerRecord: record,
              filterField: definition.recordFilterField ?? "Contact_Name",
              dealRecordPath: (id) => recordPath("Deals", id),
            })
          : undefined,
      title: "Deals",
      moduleKey: "M4",
      order: 5,
      targetId: "related-list-deals",
      countBadge: dealsBadge,
      recordFilterField: "Contact_Name",
      upperControls: [
        {
          id: "new-deal",
          label: "New Deal",
          type: "button",
          moduleKey: "M4",
          onAction: handlers.onDealsNew,
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "open-activities",
      renderBody: parentActivitiesBody("Contacts", "open"),
      title: "Open Activities",
      moduleKey: "M5",
      order: 6,
      targetId: "related-list-open-activities",
      countBadge: activityBadge(openActivityColumns, badges.openActivities),
      upperControls: [
        {
          id: "add-new",
          label: "Add New",
          type: "split-button",
          moduleKey: "M5",
        },
        {
          id: "column-view-open",
          label: "Column View",
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
      renderBody: parentActivitiesBody("Contacts", "closed"),
      title: "Closed Activities",
      moduleKey: "M5",
      order: 7,
      targetId: "related-list-closed-activities",
      countBadge: activityBadge(closedActivityColumns, badges.closedActivities),
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
      id: "invited-meetings",
      title: "Invited Meetings",
      moduleKey: "M5",
      order: 8,
      targetId: "related-list-invited-meetings",
      emptyStateText: "No records found",
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
      id: "cases",
      title: "Cases",
      moduleKey: "M8",
      order: 10,
      targetId: "related-list-cases",
      railAction: {
        id: "cases-add",
        label: "Add",
        moduleKey: "M8",
      },
      upperControls: [
        {
          id: "assign-cases",
          label: "Assign",
          type: "button",
          moduleKey: "M8",
        },
        {
          id: "new-case",
          label: "New",
          type: "button",
          moduleKey: "M8",
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "quotes",
      title: "Quotes",
      moduleKey: "P2",
      order: 11,
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
      order: 12,
      targetId: "related-list-sales-orders",
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
      id: "purchase-orders",
      title: "Purchase Orders",
      moduleKey: "P2",
      order: 13,
      targetId: "related-list-purchase-orders",
      upperControls: [
        {
          id: "assign-purchase-orders",
          label: "Assign",
          type: "button",
          moduleKey: "P2",
        },
        {
          id: "new-purchase-order",
          label: "New",
          type: "button",
          moduleKey: "P2",
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "emails",
      title: "Emails",
      moduleKey: "M10",
      order: 14,
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
    {
      id: "campaigns",
      title: "Campaigns",
      moduleKey: "M7",
      order: 16,
      targetId: "related-list-campaigns",
      upperControls: [
        {
          id: "add-campaigns",
          label: "Add Campaigns",
          type: "button",
          moduleKey: "M7",
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "social",
      title: "Social",
      moduleKey: "M15",
      order: 17,
      targetId: "related-list-social",
      socialLinks: [
        { id: "assoc-twitter", label: "Associate Twitter", moduleKey: "M15" },
        { id: "assoc-facebook", label: "Associate Facebook", moduleKey: "M15" },
      ],
      socialGuidance:
        "You cannot search a profile in Facebook. This has to be associated from the Social Tab",
    },
    {
      id: "reporting-contacts",
      renderBody: ({ record, module, orgSlug, recordPath }) =>
        record && module
          ? createElement(ReportingContactsCardBody, {
              managerRecord: record,
              orgSlug,
              recordPath: (id) => recordPath(module, id),
            })
          : undefined,
      title: "Reporting Contacts",
      moduleKey: "M2",
      order: 18,
      targetId: "related-list-reporting-contacts",
      railAction: {
        id: "reporting-contacts-add",
        label: "Add",
        moduleKey: "M2",
        onAction: handlers.onAddReportingContact,
      },
      upperControls: [
        {
          id: "hierarchy-view",
          label: "Hierarchy View",
          type: "button",
          moduleKey: "M2",
          position: "after-title",
          onAction: handlers.onHierarchyView,
        },
        {
          id: "new-reporting-contact",
          label: "New",
          type: "button",
          moduleKey: "M2",
          onAction: handlers.onNewReportingContact,
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "voice-of-the-customer",
      title: "Voice of the Customer",
      moduleKey: "P3",
      order: 19,
      targetId: "related-list-voice-of-the-customer",
      introductoryText:
        "Voice of the Customer provides various visualizations based on individual customer feedback. Gain deeper insights into your customer's voices through Voice of the Customer feature.",
      bodyAction: {
        id: "enable-feature",
        label: "Enable feature",
        moduleKey: "P3",
      },
    },
  ];
}

export const contactsRelatedLists = createContactsRelatedLists();
