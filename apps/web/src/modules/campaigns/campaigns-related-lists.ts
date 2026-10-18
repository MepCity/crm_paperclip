import { createElement } from "react";
import { CampaignChildCampaignsCardBody } from "@/components/records/detail/campaign-child-campaigns-card-body";
import { CampaignMembersCardBody } from "@/components/records/detail/campaign-members-card-body";
import { RelatedDealsCardBody } from "@/components/records/detail/related-deals-card-body";
import { Icons } from "@/components/ui/icon";
import { notesCardBody } from "../notes-card";
import { parentActivitiesBody } from "../parent-activity-cards";
import type {
  RelatedListActivityColumnDefinition,
  RelatedListDefinition,
  RelatedListRailChromeDefinition,
  RelatedListTableRowDefinition,
} from "../types";

/**
 * Provisional rule (MEP-812, MEP-813): the rail follows the service `related_lists` order and
 * visibility. Open / Closed Calls, Tasks and Meetings fold into the two activity cards
 * the way Accounts draws them; Locking Information and Checklists have no Accounts
 * counterpart and stay hidden.
 * Lower half (MEP-813):
 * - GK-5: Leads and Contacts cards show campaign membership with Member Status, Email and Phone.
 * - GK-6: Deals card shows matching deals where Campaign_Source == this campaign.
 * - GK-7: Child Campaigns card shows campaigns where Parent_Campaign == this campaign.
 * - GK-8: Notes, Attachments, Open/Closed Activities, Connected Records follow Accounts behaviour.
 */
export const campaignsRelatedListRail: RelatedListRailChromeDefinition = {
  organizeAriaLabel: "Organize Campaigns Details",
  linksGroup: {
    title: "Links",
    addLink: { id: "add-link", label: "Add Link", moduleKey: "M11" },
  },
};

export const campaignsLeadsTableColumns = [
  { id: "leadName", cellKind: "recordLink", label: "Lead Name" },
  { id: "memberStatus", label: "Member Status" },
  { id: "email", cellKind: "emailLink", label: "Email" },
  { id: "phone", cellKind: "phoneAction", label: "Phone" },
] as const;

export const campaignsContactsTableColumns = [
  { id: "contactName", cellKind: "recordLink", label: "Contact Name" },
  { id: "memberStatus", label: "Member Status" },
  { id: "email", cellKind: "emailLink", label: "Email" },
  { id: "phone", cellKind: "phoneAction", label: "Phone" },
] as const;

export const campaignsChildCampaignsTableColumns = [
  { id: "campaignName", cellKind: "recordLink", label: "Campaign Name" },
  { id: "type", label: "Type" },
  { id: "status", label: "Status" },
  { id: "startDate", label: "Start Date" },
  { id: "endDate", label: "End Date" },
  { id: "campaignOwner", label: "Campaign Owner" },
] as const;

export const campaignsLeadsTablePreviewRows: readonly RelatedListTableRowDefinition[] = [
  {
    id: "preview-lead-1",
    cells: {
      leadName: "Example Lead",
      memberStatus: "Planned",
      email: "lead@example.org",
      phone: "555-0100",
    },
    recordLink: { href: "#preview-lead-1" },
    emailLink: { href: "mailto:lead@example.org" },
    phoneAction: { moduleKey: "M5" },
  },
];

export const campaignsContactsTablePreviewRows: readonly RelatedListTableRowDefinition[] = [
  {
    id: "preview-contact-1",
    cells: {
      contactName: "Example Contact",
      memberStatus: "Sent",
      email: "contact@example.org",
      phone: "555-0200",
    },
    recordLink: { href: "#preview-contact-1" },
    emailLink: { href: "mailto:contact@example.org" },
    phoneAction: { moduleKey: "M5" },
  },
];

export const campaignsChildCampaignsTablePreviewRows: readonly RelatedListTableRowDefinition[] = [
  {
    id: "preview-child-1",
    cells: {
      campaignName: "Example Child Campaign",
      type: "Webinar",
      status: "Active",
      startDate: "2026-01-15",
      endDate: "2026-01-17",
      campaignOwner: "Alex Morgan",
    },
    recordLink: { href: "#preview-child-1" },
  },
];

export interface CampaignsRelatedListHandlers {
  onDealsAssign?: () => void;
  onDealsNew?: () => void;
  onChildCampaignNew?: () => void;
}

export type CampaignsRelatedListBadges = {
  notes?: number;
  leads?: number;
  contacts?: number;
  deals?: number;
  childCampaigns?: number;
  openActivities?: number;
  closedActivities?: number;
};

export type CreateCampaignsRelatedListsOptions = {
  handlers?: CampaignsRelatedListHandlers;
  badges?: CampaignsRelatedListBadges;
  includePreview?: boolean;
};

function badgeValue(count: number | undefined): number | undefined {
  return count !== undefined && count > 0 ? count : undefined;
}

function activityCount(
  columns: readonly RelatedListActivityColumnDefinition[],
  supplied: number | undefined,
): number | undefined {
  return supplied ?? columns.reduce((total, column) => total + column.count, 0);
}

function activityColumns(
  prefix: "open" | "closed",
): readonly RelatedListActivityColumnDefinition[] {
  const word = prefix === "open" ? "Open" : "Closed";
  return [
    {
      id: `${prefix}-tasks`,
      title: `${word} Tasks`,
      count: 0,
      emptyText: "No records found",
      icon: Icons.check,
    },
    {
      id: `${prefix}-meetings`,
      title: `${word} Meetings`,
      count: 0,
      emptyText: "No records found",
      icon: Icons.calendar,
    },
  ];
}

function viewControls(suffix: "open" | "closed") {
  return [
    { id: `column-view-${suffix}`, label: "Column View", type: "select", moduleKey: "M5" },
    {
      id: `table-plus-${suffix}`,
      label: "Customize",
      type: "icon-button",
      moduleKey: "M11",
      icon: Icons.tablePlus,
    },
    {
      id: `expand-${suffix}`,
      label: "Expand",
      type: "icon-button",
      moduleKey: "M5",
      icon: Icons.diagonalExpand,
    },
  ] as const;
}

export function createCampaignsRelatedLists(
  options: CreateCampaignsRelatedListsOptions = {},
): readonly RelatedListDefinition[] {
  const { handlers = {}, badges = {}, includePreview = false } = options;

  const openActivityColumns = activityColumns("open");
  const closedActivityColumns = activityColumns("closed");

  const openActivitiesBadge = badgeValue(activityCount(openActivityColumns, badges.openActivities));
  const closedActivitiesBadge = badgeValue(
    activityCount(closedActivityColumns, badges.closedActivities),
  );

  return [
    {
      id: "connected-records",
      title: "Connected Records",
      moduleKey: "P3",
      order: 1,
      targetId: "related-list-connected-records",
      emptyStateText: "No records found",
    },
    {
      id: "notes",
      renderBody: notesCardBody("Campaigns"),
      title: "Notes",
      moduleKey: "M6",
      order: 2,
      targetId: "related-list-notes",
      countBadge: badgeValue(badges.notes),
      railAction: { id: "notes-add", label: "Add", moduleKey: "M6" },
      notesShowMore: true,
      emptyStateText: "No records found",
    },
    {
      id: "child-campaigns",
      renderBody: ({ record, recordPath, definition }) =>
        record && !definition.tablePreviewRows?.length
          ? createElement(CampaignChildCampaignsCardBody, {
              parentRecord: record,
              campaignRecordPath: (id) => recordPath("Campaigns", id),
            })
          : undefined,
      title: "Child Campaigns",
      moduleKey: "M7",
      order: 3,
      targetId: "related-list-child-campaigns",
      countBadge: badgeValue(badges.childCampaigns),
      tableColumns: [...campaignsChildCampaignsTableColumns],
      ...(includePreview ? { tablePreviewRows: campaignsChildCampaignsTablePreviewRows } : {}),
      emptyStateText: "No records found",
    },
    {
      id: "open-activities",
      renderBody: parentActivitiesBody("Campaigns", "open"),
      title: "Open Activities",
      moduleKey: "M5",
      order: 6,
      targetId: "related-list-open-activities",
      countBadge: openActivitiesBadge,
      upperControls: [
        { id: "add-new", label: "Add New", type: "split-button", moduleKey: "M5" },
        ...viewControls("open"),
      ],
      activityColumns: openActivityColumns,
    },
    {
      id: "attachments",
      title: "Attachments",
      moduleKey: "M6",
      order: 9,
      targetId: "related-list-attachments",
      upperControls: [{ id: "attach", label: "Attach", type: "split-button", moduleKey: "M6" }],
      emptyStateText: "No Attachment",
    },
    {
      id: "closed-activities",
      renderBody: parentActivitiesBody("Campaigns", "closed"),
      title: "Closed Activities",
      moduleKey: "M5",
      order: 10,
      targetId: "related-list-closed-activities",
      countBadge: closedActivitiesBadge,
      upperControls: [...viewControls("closed")],
      activityColumns: closedActivityColumns,
    },
    {
      id: "leads",
      renderBody: ({ record, recordPath, definition }) =>
        record && !definition.tablePreviewRows?.length
          ? createElement(CampaignMembersCardBody, {
              campaignRecord: record,
              memberKind: "Lead",
              recordPath,
            })
          : undefined,
      title: "Leads",
      moduleKey: "M2",
      order: 15,
      targetId: "related-list-leads",
      countBadge: badgeValue(badges.leads),
      tableColumns: [...campaignsLeadsTableColumns],
      ...(includePreview ? { tablePreviewRows: campaignsLeadsTablePreviewRows } : {}),
      emptyStateText: "No records found",
    },
    {
      id: "deals",
      renderBody: ({ record, recordPath, definition }) =>
        record
          ? createElement(RelatedDealsCardBody, {
              managerRecord: record,
              filterField: definition.recordFilterField ?? "Campaign_Source",
              dealRecordPath: (id) => recordPath("Deals", id),
            })
          : undefined,
      title: "Deals",
      moduleKey: "M4",
      order: 16,
      targetId: "related-list-deals",
      countBadge: badgeValue(badges.deals),
      recordFilterField: "Campaign_Source",
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
      renderBody: ({ record, recordPath, definition }) =>
        record && !definition.tablePreviewRows?.length
          ? createElement(CampaignMembersCardBody, {
              campaignRecord: record,
              memberKind: "Contact",
              recordPath,
            })
          : undefined,
      title: "Contacts",
      moduleKey: "M2",
      order: 17,
      targetId: "related-list-contacts",
      countBadge: badgeValue(badges.contacts),
      tableColumns: [...campaignsContactsTableColumns],
      ...(includePreview ? { tablePreviewRows: campaignsContactsTablePreviewRows } : {}),
      emptyStateText: "No records found",
    },
  ];
}

export const campaignsRelatedLists = createCampaignsRelatedLists({
  includePreview: false,
});
