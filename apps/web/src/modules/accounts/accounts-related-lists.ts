import { createElement } from "react";
import { AccountContactsCardBody } from "@/components/records/detail/account-contacts-card-body";
import { AccountMemberAccountsCardBody } from "@/components/records/detail/account-member-accounts-card-body";
import { RelatedDealsCardBody } from "@/components/records/detail/related-deals-card-body";
import { Icons } from "@/components/ui/icon";
import { notesCardBody } from "../notes-card";
import { parentActivitiesBody } from "../parent-activity-cards";
import type {
  RelatedListActivityColumnDefinition,
  RelatedListDefinition,
  RelatedListRailLinksGroupDefinition,
  RelatedListTableRowDefinition,
} from "../types";

export interface AccountsRelatedListHandlers {
  onHierarchyView?: () => void;
  onContactsAssign?: () => void;
  onContactsNew?: () => void;
  onContactsEdit?: () => void;
  onMemberAccountNew?: () => void;
  onDealsAssign?: () => void;
  onDealsNew?: () => void;
}

export interface AccountsRelatedListRailDefinition {
  organizeAriaLabel: string;
  linksGroup: RelatedListRailLinksGroupDefinition;
}

export const accountsRelatedListRail: AccountsRelatedListRailDefinition = {
  organizeAriaLabel: "Organize Accounts Details",
  linksGroup: {
    title: "Links",
    addLink: { id: "add-link", label: "Add Link", moduleKey: "M11" },
  },
};

const contactsTableColumns = [
  { id: "contactName", cellKind: "recordLink", label: "Contact Name" },
  { id: "email", cellKind: "emailLink", label: "Email" },
  { id: "phone", cellKind: "phoneAction", label: "Phone" },
  { id: "mobile", label: "Mobile" },
  { id: "fax", label: "Fax" },
  { id: "contactOwner", label: "Contact Owner" },
] as const;

export const accountsContactsTablePreviewRows: readonly RelatedListTableRowDefinition[] = [
  {
    id: "preview-contact-1",
    cells: {
      contactName: "Example Contact",
      email: "contact@example.org",
      phone: "555-0100",
      mobile: "555-0101",
      fax: "555-0102",
      contactOwner: "Alex Morgan",
    },
    recordLink: { href: "#preview-contact-1" },
    emailLink: { href: "mailto:contact@example.org" },
    phoneAction: { moduleKey: "M5" },
  },
];

export type AccountsRelatedListBadges = {
  notes?: number;
  contacts?: number;
  deals?: number;
  openActivities?: number;
  closedActivities?: number;
};

export type CreateAccountsRelatedListsOptions = {
  handlers?: AccountsRelatedListHandlers;
  badges?: AccountsRelatedListBadges;
  includeContactsPreview?: boolean;
};

function badgeValue(count: number | undefined): number | undefined {
  return count !== undefined && count > 0 ? count : undefined;
}

/** AD-30/AD-31: the rail badge is the number of records the card holds; zero draws no badge. */
function activityCount(
  columns: readonly RelatedListActivityColumnDefinition[],
  supplied: number | undefined,
): number | undefined {
  return supplied ?? columns.reduce((total, column) => total + column.count, 0);
}

export function createAccountsRelatedLists(
  options: CreateAccountsRelatedListsOptions = {},
): readonly RelatedListDefinition[] {
  const { handlers = {}, badges = {}, includeContactsPreview = false } = options;
  const notesBadge = badges.notes !== undefined ? badgeValue(badges.notes) : badgeValue(1);
  const contactsBadge = badges.contacts !== undefined ? badgeValue(badges.contacts) : badgeValue(1);
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
      renderBody: notesCardBody("Accounts"),
      title: "Notes",
      moduleKey: "M6",
      order: 1,
      targetId: "related-list-notes",
      countBadge: notesBadge,
      railAction: {
        id: "notes-add",
        label: "Add",
        moduleKey: "M6",
      },
      notesShowMore: true,
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
      id: "deals",
      renderBody: ({ record, recordPath, definition }) =>
        record
          ? createElement(RelatedDealsCardBody, {
              managerRecord: record,
              filterField: definition.recordFilterField ?? "Account_Name",
              dealRecordPath: (id) => recordPath("Deals", id),
            })
          : undefined,
      title: "Deals",
      moduleKey: "M4",
      order: 4,
      targetId: "related-list-deals",
      countBadge: badgeValue(badges.deals),
      recordFilterField: "Account_Name",
      railAction: {
        id: "deals-add",
        label: "Add",
        moduleKey: "M4",
        onAction: handlers.onDealsNew,
      },
      upperControls: [
        {
          id: "assign-deals",
          label: "Assign",
          type: "button",
          moduleKey: "M4",
          onAction: handlers.onDealsAssign,
        },
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
      id: "contacts",
      renderBody: ({ record, orgSlug, recordPath, definition }) =>
        record && !definition.tablePreviewRows?.length
          ? createElement(AccountContactsCardBody, {
              accountRecord: record,
              orgSlug,
              contactRecordPath: (id) => recordPath("Contacts", id),
            })
          : undefined,
      title: "Contacts",
      moduleKey: "M2",
      order: 5,
      targetId: "related-list-contacts",
      countBadge: contactsBadge,
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
          id: "assign-contacts",
          label: "Assign",
          type: "button",
          moduleKey: "M2",
          onAction: handlers.onContactsAssign,
        },
        {
          id: "new-contact",
          label: "New",
          type: "button",
          moduleKey: "M2",
          onAction: handlers.onContactsNew,
        },
        {
          id: "edit-contacts",
          label: "Edit",
          type: "button",
          moduleKey: "M2",
          onAction: handlers.onContactsEdit,
        },
        {
          id: "table-plus-contacts",
          label: "Customize",
          type: "icon-button",
          moduleKey: "M11",
          icon: Icons.tablePlus,
        },
        {
          id: "expand-contacts",
          label: "Expand",
          type: "icon-button",
          moduleKey: "M2",
          icon: Icons.diagonalExpand,
        },
      ],
      tableColumns: [...contactsTableColumns],
      ...(includeContactsPreview ? { tablePreviewRows: accountsContactsTablePreviewRows } : {}),
      emptyStateText: "No records found",
    },
    {
      id: "emails",
      title: "Emails",
      moduleKey: "M10",
      order: 6,
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
        id: "sent-mail-source",
        label: "Sent",
        type: "select",
        moduleKey: "M10",
      },
      emptyStateText: "No records found",
    },
    {
      id: "open-activities",
      renderBody: parentActivitiesBody("Accounts", "open"),
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
      renderBody: parentActivitiesBody("Accounts", "closed"),
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
      id: "invoices",
      title: "Invoices",
      moduleKey: "P2",
      order: 12,
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
      id: "member-accounts",
      renderBody: ({ record, orgSlug, recordPath }) =>
        record
          ? createElement(AccountMemberAccountsCardBody, {
              parentRecord: record,
              orgSlug,
              accountRecordPath: (id) => recordPath("Accounts", id),
            })
          : undefined,
      title: "Member Accounts",
      moduleKey: "M3",
      order: 13,
      targetId: "related-list-member-accounts",
      railAction: {
        id: "member-accounts-add",
        label: "Add",
        moduleKey: "M3",
        onAction: handlers.onMemberAccountNew,
      },
      upperControls: [
        {
          id: "new-member-account",
          label: "New",
          type: "button",
          moduleKey: "M3",
          onAction: handlers.onMemberAccountNew,
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "cases",
      title: "Cases",
      moduleKey: "M8",
      order: 14,
      targetId: "related-list-cases",
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
      id: "social",
      title: "Social",
      moduleKey: "M15",
      order: 15,
      targetId: "related-list-social",
      socialLinks: [
        { id: "assoc-twitter", label: "Associate Twitter", moduleKey: "M15" },
        { id: "assoc-facebook", label: "Associate Facebook", moduleKey: "M15" },
      ],
      socialGuidance:
        "You cannot search a profile in Facebook. This has to be associated from the Social Tab",
    },
  ];
}

export const accountsRelatedLists = createAccountsRelatedLists({
  includeContactsPreview: true,
});
