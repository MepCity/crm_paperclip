"use client";

import type { FieldDefinition } from "@crm/core/records";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { BusinessCard } from "./business-card";
import { DetailsCard } from "./details-card";
import { LastUpdateLabel } from "./last-update-label";

const ownerNames = { "user-1": "Alex Morgan", "user-2": "Sam Rivera" };

function field(
  apiName: string,
  label: string,
  dataType: FieldDefinition["dataType"],
  extra: Partial<FieldDefinition> = {},
): FieldDefinition {
  return {
    apiName,
    label,
    dataType,
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...extra,
  };
}

const businessFields = [
  { field: field("Owner", "Lead Owner", "ownerlookup"), value: "user-1" },
  { field: field("Email", "Email", "email"), value: "lead001@example.org" },
  { field: field("Phone", "Phone", "phone"), value: "555-0100" },
  { field: field("Mobile", "Mobile", "phone"), value: "555-0101" },
  {
    field: field("Lead_Status", "Lead Status", "picklist", {
      picklist: [
        { storedValue: "open", displayValue: "Contacted" },
        { storedValue: "none", displayValue: "-None-" },
      ],
    }),
    value: "open",
  },
];

const leadInfoLeft = [
  { column: "left" as const, field: field("Title", "Title", "text"), value: "Director" },
  {
    column: "left" as const,
    field: field("Lead_Source", "Lead Source", "picklist", {
      picklist: [{ storedValue: "web", displayValue: "Web" }],
    }),
    value: "",
  },
  {
    column: "left" as const,
    field: field("Modified_By", "Modified By", "ownerlookup"),
    value: "user-2",
    auditTimestamp: "2026-03-01T22:30:00Z",
  },
  {
    column: "left" as const,
    field: field("Secondary_Email", "Secondary Email", "email"),
    value: "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz0123456789@example.org",
  },
];

const leadInfoRight = [
  {
    column: "right" as const,
    field: field("Lead_Name", "Lead Name", "text"),
    value:
      "Northwind Trading Company International Division Regional Procurement Office West Coast",
  },
  { column: "right" as const, field: field("Company", "Company", "text"), value: "Example Corp" },
  {
    column: "right" as const,
    field: field("Rating", "Rating", "picklist", {
      picklist: [{ storedValue: "none", displayValue: "-None-" }],
    }),
    value: "",
  },
  {
    column: "right" as const,
    field: field("Website", "Website", "website"),
    value: "https://www.example.org/products/catalog/regional/west-coast-distribution-hub",
  },
  {
    column: "right" as const,
    field: field("Created_By", "Created By", "ownerlookup"),
    value: "user-1",
    auditTimestamp: "2026-02-15T09:15:00Z",
  },
  {
    column: "right" as const,
    field: field("Twitter", "Twitter", "text"),
    value: "@example",
  },
];

const interSectionLeft = [
  { column: "left" as const, field: field("Title", "Title", "text"), value: "Director" },
];

const interSectionRight = [
  {
    column: "right" as const,
    field: field("Twitter", "Twitter", "text"),
    value: "@example",
  },
];

export default function RecordDetailCardsDemo() {
  return (
    <div className="space-y-8 bg-bg p-4">
      <section aria-label="Record detail card samples" data-record-detail-demo>
        <LastUpdateLabel text="Last Update : 3 hours ago" />
        <div className="detail-demo-frame space-y-4">
          <BusinessCard fields={businessFields} ownerNames={ownerNames} format={DEFAULT_FORMAT} />
          <DetailsCard
            ownerNames={ownerNames}
            format={DEFAULT_FORMAT}
            onEdit={() => undefined}
            sections={[
              {
                title: "Lead Information",
                fields: [...leadInfoLeft, ...leadInfoRight],
              },
              {
                title: "Address Information",
                fields: [
                  {
                    column: "full",
                    field: field("Address", "Address", "textarea"),
                    value: "100 Market St, Springfield, IL 62701, United States",
                  },
                ],
              },
              {
                title: "Description Information",
                fields: [
                  {
                    column: "full",
                    field: field("Description", "Description", "textarea"),
                    value: "",
                  },
                ],
              },
            ]}
          />
          <div className="detail-demo-frame" data-detail-inter-section-demo>
            <DetailsCard
              ownerNames={ownerNames}
              format={DEFAULT_FORMAT}
              sections={[
                {
                  title: "Lead Information",
                  fields: [...interSectionLeft, ...interSectionRight],
                },
                {
                  title: "Address Information",
                  fields: [
                    {
                      column: "full",
                      field: field("Address", "Address", "textarea"),
                      value: "100 Market St, Springfield, IL 62701, United States",
                    },
                  ],
                },
                {
                  title: "Description Information",
                  fields: [
                    {
                      column: "full",
                      field: field("Description", "Description", "textarea"),
                      value: "",
                    },
                  ],
                },
              ]}
            />
          </div>
          <div
            className="detail-demo-frame"
            style={{ width: "var(--size-detail-card-width-rail-hidden)" }}
            data-detail-rail-hidden-demo
          >
            <DetailsCard
              ownerNames={ownerNames}
              format={DEFAULT_FORMAT}
              railLayout="hidden"
              onEdit={() => undefined}
              sections={[
                {
                  title: "Lead Information",
                  fields: [
                    {
                      column: "right",
                      field: field("Rating", "Rating", "picklist", {
                        picklist: [{ storedValue: "none", displayValue: "-None-" }],
                      }),
                      value: "",
                    },
                  ],
                },
              ]}
            />
          </div>
          <div className="detail-demo-frame">
            <DetailsCard
              ownerNames={ownerNames}
              format={DEFAULT_FORMAT}
              defaultDetailsHidden
              sections={[
                {
                  title: "Lead Information",
                  fields: [
                    {
                      column: "left",
                      field: field("Email_Opt_Out", "Email Opt Out", "boolean"),
                      value: false,
                    },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
