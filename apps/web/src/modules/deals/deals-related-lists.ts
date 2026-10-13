import type { RelatedListDefinition, RelatedListRailChromeDefinition } from "../types";

export const dealsRelatedListRail: RelatedListRailChromeDefinition = {
  organizeAriaLabel: "Organize Deal Details",
};

export type DealsRelatedListBadges = {
  stageHistory?: number;
  openActivities?: number;
  closedActivities?: number;
};

export type CreateDealsRelatedListsOptions = {
  badges?: DealsRelatedListBadges;
};

function badgeValue(count: number | undefined): number | undefined {
  return count !== undefined && count > 0 ? count : undefined;
}

/** Title-only related cards for the upper detail task; interiors ship in a follow-up issue. */
export function createDealsRelatedLists(
  options: CreateDealsRelatedListsOptions = {},
): readonly RelatedListDefinition[] {
  const { badges = {} } = options;
  const stageHistoryBadge = badgeValue(badges.stageHistory);
  const openActivitiesBadge = badgeValue(badges.openActivities);
  const closedActivitiesBadge = badgeValue(badges.closedActivities);

  return [
    {
      id: "notes",
      title: "Notes",
      moduleKey: "M6",
      order: 1,
      targetId: "related-list-notes",
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
      emptyStateText: "No Attachment",
    },
    {
      id: "stage-history",
      title: "Stage History",
      moduleKey: "M4",
      order: 4,
      targetId: "related-list-stage-history",
      countBadge: stageHistoryBadge,
      emptyStateText: "No records found",
    },
    {
      id: "competitors",
      title: "Competitors",
      moduleKey: "P3",
      order: 5,
      targetId: "related-list-competitors",
      emptyStateText: "No records found",
    },
    {
      id: "cadences",
      title: "Cadences",
      moduleKey: "P3",
      order: 6,
      targetId: "related-list-cadences",
      emptyStateText: "No records found",
    },
    {
      id: "open-activities",
      title: "Open Activities",
      moduleKey: "M5",
      order: 7,
      targetId: "related-list-open-activities",
      countBadge: openActivitiesBadge,
      emptyStateText: "No records found",
    },
    {
      id: "closed-activities",
      title: "Closed Activities",
      moduleKey: "M5",
      order: 8,
      targetId: "related-list-closed-activities",
      countBadge: closedActivitiesBadge,
      emptyStateText: "No records found",
    },
    {
      id: "products",
      title: "Products",
      moduleKey: "P2",
      order: 9,
      targetId: "related-list-products",
      emptyStateText: "No records found",
    },
    {
      id: "quotes",
      title: "Quotes",
      moduleKey: "P2",
      order: 10,
      targetId: "related-list-quotes",
      emptyStateText: "No records found",
    },
    {
      id: "sales-orders",
      title: "Sales Orders",
      moduleKey: "P2",
      order: 11,
      targetId: "related-list-sales-orders",
      emptyStateText: "No records found",
    },
    {
      id: "contact-roles",
      title: "Contact Roles",
      moduleKey: "M2",
      order: 12,
      targetId: "related-list-contact-roles",
      emptyStateText: "No records found",
    },
    {
      id: "emails",
      title: "Emails",
      moduleKey: "M10",
      order: 13,
      targetId: "related-list-emails",
      emptyStateText: "No records found",
    },
    {
      id: "cases",
      title: "Cases",
      moduleKey: "M8",
      order: 14,
      targetId: "related-list-cases",
      emptyStateText: "No records found",
    },
    {
      id: "invoices",
      title: "Invoices",
      moduleKey: "P2",
      order: 15,
      targetId: "related-list-invoices",
      emptyStateText: "No records found",
    },
  ];
}
