import { notesCardBody } from "../notes-card";
import type { RelatedListDefinition, RelatedListRailChromeDefinition } from "../types";

/**
 * Provisional rule (MEP-863): the rail follows the service `related_lists` order and
 * visibility. Locking Information, Checklists and Review processes have no counterpart / stay hidden.
 * No activity, email or Cases ↔ Solutions cards are present (metadata has none).
 */
export const solutionsRelatedListRail: RelatedListRailChromeDefinition = {
  organizeAriaLabel: "Organize Solutions Details",
  linksGroup: {
    title: "Links",
    addLink: { id: "add-link", label: "Add Link", moduleKey: "M11" },
  },
};

export const solutionsRelatedLists: readonly RelatedListDefinition[] = [
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
    renderBody: notesCardBody("Solutions"),
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
    order: 3,
    targetId: "related-list-attachments",
    upperControls: [{ id: "attach", label: "Attach", type: "split-button", moduleKey: "M6" }],
    emptyStateText: "No Attachment",
  },
];
