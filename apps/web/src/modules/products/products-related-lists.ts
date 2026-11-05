import { createElement } from "react";
import { RelatedInvoicesCardBody } from "@/components/records/detail/related-invoices-card-body";
import { RelatedQuotesCardBody } from "@/components/records/detail/related-quotes-card-body";
import { Icons } from "@/components/ui/icon";
import { parentActivitiesBody } from "../parent-activity-cards";
import type {
  RelatedListActivityColumnDefinition,
  RelatedListDefinition,
  RelatedListRailChromeDefinition,
} from "../types";

export const productsRelatedListRail: RelatedListRailChromeDefinition = {
  organizeAriaLabel: "Organize Products Details",
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

export const productsRelatedLists: readonly RelatedListDefinition[] = [
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
    moduleKey: "M2",
    order: 2,
    targetId: "related-list-notes",
    emptyStateText: "No records found",
  },
  {
    id: "attachments",
    title: "Attachments",
    moduleKey: "M8",
    order: 3,
    targetId: "related-list-attachments",
    emptyStateText: "No Attachment",
  },
  {
    id: "price-books",
    title: "Price Books",
    moduleKey: "P2",
    order: 4,
    targetId: "related-list-price-books",
    emptyStateText: "No records found",
  },
  {
    id: "open-activities",
    renderBody: parentActivitiesBody("Products", "open"),
    title: "Open Activities",
    moduleKey: "M5",
    order: 7,
    targetId: "related-list-open-activities",
    upperControls: [
      { id: "add-new", label: "Add New", type: "split-button", moduleKey: "M5" },
      ...viewControls("open"),
    ],
    activityColumns: activityColumns("open"),
  },
  {
    id: "closed-activities",
    renderBody: parentActivitiesBody("Products", "closed"),
    title: "Closed Activities",
    moduleKey: "M5",
    order: 11,
    targetId: "related-list-closed-activities",
    upperControls: [...viewControls("closed")],
    activityColumns: activityColumns("closed"),
  },
  {
    id: "quotes",
    renderBody: ({ record, recordPath }) =>
      record
        ? createElement(RelatedQuotesCardBody, {
            managerRecord: record,
            quoteRecordPath: (id) => recordPath("Quotes", id),
          })
        : undefined,
    title: "Quotes",
    moduleKey: "P2",
    order: 14,
    targetId: "related-list-quotes",
    emptyStateText: "No records found",
  },
  {
    id: "invoices",
    renderBody: ({ record, recordPath }) =>
      record
        ? createElement(RelatedInvoicesCardBody, {
            managerRecord: record,
            invoiceRecordPath: (id) => recordPath("Invoices", id),
          })
        : undefined,
    title: "Invoices",
    moduleKey: "P2",
    order: 15,
    targetId: "related-list-invoices",
    emptyStateText: "No records found",
  },
];
