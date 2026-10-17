import { Icons } from "@/components/ui/icon";
import type {
  RelatedListActivityColumnDefinition,
  RelatedListDefinition,
  RelatedListRailChromeDefinition,
} from "../types";

/**
 * Provisional rule (MEP-812): the rail follows the service `related_lists` order and
 * visibility. Open / Closed Calls, Tasks and Meetings fold into the two activity cards
 * the way Accounts draws them; Locking Information and Checklists have no Accounts
 * counterpart and stay hidden. Card bodies are the empty card until the lower-half task.
 */
export const campaignsRelatedListRail: RelatedListRailChromeDefinition = {
  organizeAriaLabel: "Organize Campaigns Details",
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

export const campaignsRelatedLists: readonly RelatedListDefinition[] = [
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
    title: "Notes",
    moduleKey: "M6",
    order: 2,
    targetId: "related-list-notes",
    railAction: { id: "notes-add", label: "Add", moduleKey: "M6" },
    emptyStateText: "No records found",
  },
  {
    id: "child-campaigns",
    title: "Child Campaigns",
    moduleKey: "M7",
    order: 3,
    targetId: "related-list-child-campaigns",
    emptyStateText: "No records found",
  },
  {
    id: "open-activities",
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
    title: "Closed Activities",
    moduleKey: "M5",
    order: 10,
    targetId: "related-list-closed-activities",
    upperControls: [...viewControls("closed")],
    activityColumns: activityColumns("closed"),
  },
  {
    id: "leads",
    title: "Leads",
    moduleKey: "M2",
    order: 15,
    targetId: "related-list-leads",
    emptyStateText: "No records found",
  },
  {
    id: "deals",
    title: "Deals",
    moduleKey: "M4",
    order: 16,
    targetId: "related-list-deals",
    emptyStateText: "No records found",
  },
  {
    id: "contacts",
    title: "Contacts",
    moduleKey: "M2",
    order: 17,
    targetId: "related-list-contacts",
    emptyStateText: "No records found",
  },
];
