import type { RelatedListDefinition, RelatedListRailChromeDefinition } from "../types";

/**
 * Related lists with a backing feature (ADR 0016 section 9): Notes, Attachments, Tasks,
 * Events, Calls (Open / Closed Activities) and Emails. Cards are drawn generically until
 * the server-side parent-module support for Quotes lands; Review Processes, Locking
 * Information, Checklists and the history lists stay out.
 */
export const quotesRelatedListRail: RelatedListRailChromeDefinition = {
  organizeAriaLabel: "Organize Quotes Details",
  linksGroup: {
    title: "Links",
    addLink: { id: "add-link", label: "Add Link", moduleKey: "M11" },
  },
};

export const quotesRelatedLists: readonly RelatedListDefinition[] = [
  {
    id: "notes",
    title: "Notes",
    moduleKey: "M2",
    order: 1,
    targetId: "related-list-notes",
    emptyStateText: "No records found",
  },
  {
    id: "attachments",
    title: "Attachments",
    moduleKey: "M8",
    order: 2,
    targetId: "related-list-attachments",
    upperControls: [{ id: "attach", label: "Attach", type: "split-button" }],
    emptyStateText: "No Attachment",
  },
  {
    id: "open-activities",
    title: "Open Activities",
    moduleKey: "M5",
    order: 3,
    targetId: "related-list-open-activities",
    emptyStateText: "No records found",
  },
  {
    id: "closed-activities",
    title: "Closed Activities",
    moduleKey: "M5",
    order: 4,
    targetId: "related-list-closed-activities",
    emptyStateText: "No records found",
  },
  {
    id: "emails",
    title: "Emails",
    moduleKey: "M10",
    order: 5,
    targetId: "related-list-emails",
    emptyStateText: "No records found",
  },
];
