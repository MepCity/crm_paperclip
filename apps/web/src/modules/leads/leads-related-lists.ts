import { createElement } from "react";
import { campaignsCardBody } from "@/components/records/campaigns/campaigns-card";
import { Icons } from "@/components/ui/icon";
import { attachmentsCard } from "../attachments-card";
import { emailsCard } from "../emails/record-card";
import { notesCardBody } from "../notes-card";
import { parentActivitiesBody } from "../parent-activity-cards";
import { SocialRecordCardBody } from "../social/social-record-card";
import type { RelatedListDefinition } from "../types";

export interface LeadsRelatedListBadges {
  openActivities?: number;
  closedActivities?: number;
  campaigns?: number;
}

export interface LeadsRelatedListHandlers {
  onAddCampaigns?: () => void;
}

function badgeValue(count: number | undefined): number | undefined {
  return count !== undefined && count > 0 ? count : undefined;
}

function viewControls(suffix: "open" | "closed") {
  return [
    {
      id: `column-view-${suffix}`,
      label: "Column View",
      type: "select",
      moduleKey: "M5",
    },
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

export function createLeadsRelatedLists(
  badges: LeadsRelatedListBadges = {},
  handlers: LeadsRelatedListHandlers = {},
): readonly RelatedListDefinition[] {
  return [
    {
      id: "notes",
      renderBody: notesCardBody("Leads"),
      title: "Notes",
      moduleKey: "M2",
      order: 0,
      targetId: "related-list-notes",
      emptyStateText: "No records found",
    },
    {
      id: "open-activities",
      renderBody: parentActivitiesBody("Leads", "open"),
      title: "Open Activities",
      moduleKey: "M5",
      order: 1,
      targetId: "related-list-open-activities",
      countBadge: badgeValue(badges.openActivities),
      upperControls: [
        { id: "add-new", label: "Add New", type: "split-button", moduleKey: "M5" },
        ...viewControls("open"),
      ],
    },
    {
      id: "closed-activities",
      renderBody: parentActivitiesBody("Leads", "closed"),
      title: "Closed Activities",
      moduleKey: "M5",
      order: 2,
      targetId: "related-list-closed-activities",
      countBadge: badgeValue(badges.closedActivities),
      upperControls: [...viewControls("closed")],
    },
    {
      id: "attachments",
      renderCard: attachmentsCard("Leads"),
      title: "Attachments",
      moduleKey: "M6",
      order: 3,
      targetId: "related-list-attachments",
      upperControls: [{ id: "attach", label: "Attach", type: "split-button", moduleKey: "M6" }],
      emptyStateText: "No Attachment",
    },
    {
      id: "emails",
      renderCard: emailsCard("Leads"),
      title: "Emails",
      moduleKey: "M10",
      order: 4,
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
      id: "campaigns",
      renderBody: ({ record, recordPath }) =>
        record
          ? campaignsCardBody("Leads", record.id, (id) => recordPath("Campaigns", id))
          : undefined,
      title: "Campaigns",
      // The card is live; "M2" keeps the rail entry and controls unlocked.
      moduleKey: "M2",
      order: 5,
      targetId: "related-list-campaigns",
      countBadge: badgeValue(badges.campaigns),
      railAction: {
        id: "add-campaigns",
        label: "Add Campaigns",
        onAction: handlers.onAddCampaigns,
      },
      upperControls: [
        {
          id: "add-campaigns",
          label: "Add Campaigns",
          type: "button",
          onAction: handlers.onAddCampaigns,
        },
      ],
      emptyStateText: "No records found",
    },
    {
      id: "social",
      renderBody: () => createElement(SocialRecordCardBody),
      title: "Social",
      moduleKey: "M2",
      order: 6,
      targetId: "related-list-social",
    },
  ];
}
