import { Icons } from "@/components/ui/icon";
import { notesCardBody } from "../notes-card";
import { parentActivitiesBody } from "../parent-activity-cards";
import type {
  RelatedListActivityColumnDefinition,
  RelatedListDefinition,
  RelatedListRailChromeDefinition,
} from "../types";

/**
 * Provisional rule (MEP-863): the rail follows the service `related_lists` order and
 * visibility. Open / Closed Calls, Tasks and Meetings fold into the two activity cards
 * the way Accounts draws them; Locking Information, Checklists, Mailing History and
 * Review processes have no counterpart / stay hidden.
 * No Cases ↔ Solutions card is added (metadata has none; CTO gate input).
 */
export const casesRelatedListRail: RelatedListRailChromeDefinition = {
  organizeAriaLabel: "Organize Cases Details",
  linksGroup: {
    title: "Links",
    addLink: { id: "add-link", label: "Add Link", moduleKey: "M11" },
  },
};

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

export const casesRelatedLists: readonly RelatedListDefinition[] = [
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
    renderBody: notesCardBody("Cases"),
    title: "Notes",
    moduleKey: "M6",
    order: 2,
    targetId: "related-list-notes",
    railAction: { id: "notes-add", label: "Add", moduleKey: "M6" },
    emptyStateText: "No records found",
  },
  {
    id: "attachments",
    title: "Attachments",
    moduleKey: "M6",
    order: 4,
    targetId: "related-list-attachments",
    upperControls: [{ id: "attach", label: "Attach", type: "split-button", moduleKey: "M6" }],
    emptyStateText: "No Attachment",
  },
  {
    id: "open-activities",
    renderBody: parentActivitiesBody("Cases", "open"),
    title: "Open Activities",
    moduleKey: "M5",
    order: 6,
    targetId: "related-list-open-activities",
    upperControls: [
      { id: "add-new", label: "Add New", type: "split-button", moduleKey: "M5" },
      ...viewControls("open"),
    ],
    activityColumns: activityColumns("open"),
  },
  {
    id: "closed-activities",
    renderBody: parentActivitiesBody("Cases", "closed"),
    title: "Closed Activities",
    moduleKey: "M5",
    order: 11,
    targetId: "related-list-closed-activities",
    upperControls: [...viewControls("closed")],
    activityColumns: activityColumns("closed"),
  },
  {
    id: "emails",
    title: "Emails",
    moduleKey: "M10",
    order: 16,
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
];
