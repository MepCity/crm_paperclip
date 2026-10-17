import { Icons } from "@/components/ui/icon";
import { notesCardBody } from "../notes-card";
import { parentActivitiesBody } from "../parent-activity-cards";
import type { RelatedListDefinition } from "../types";

export interface LeadsRelatedListBadges {
  openActivities?: number;
  closedActivities?: number;
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
): readonly RelatedListDefinition[] {
  return [
    {
      id: "notes",
      renderBody: notesCardBody("Leads"),
      title: "Notes",
      moduleKey: "M6",
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
  ];
}
