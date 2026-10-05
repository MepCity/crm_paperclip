"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { useState } from "react";
import "./detail-cards.css";
import { DetailFieldRow } from "./detail-field-row";

export type DetailFieldEntry = {
  field: FieldDefinition;
  value: FieldValue;
  auditTimestamp?: string | null;
  column: "left" | "right" | "full";
};

export type DetailSection = {
  title: string;
  fields: readonly DetailFieldEntry[];
};

export interface DetailsCardProps {
  sections: readonly DetailSection[];
  ownerNames?: Readonly<Record<string, string>>;
  format: FormatOptions;
  defaultDetailsHidden?: boolean;
  onEdit?: (apiName: string) => void;
}

export function DetailsCard({
  sections,
  ownerNames,
  format,
  defaultDetailsHidden = false,
  onEdit,
}: DetailsCardProps) {
  const [expanded, setExpanded] = useState(!defaultDetailsHidden);
  const toggleLabel = expanded ? "Hide Details" : "Show Details";

  return (
    <section className="detail-card detail-details-card" aria-label="Details card">
      <button
        type="button"
        className="detail-details-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        {toggleLabel}
      </button>
      <hr className="detail-details-divider" data-detail-divider />
      {expanded ? (
        <div data-detail-sections>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="detail-section-title">{section.title}</h3>
              <SectionFields
                fields={section.fields}
                ownerNames={ownerNames}
                format={format}
                onEdit={onEdit}
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SectionFields({
  fields,
  ownerNames,
  format,
  onEdit,
}: {
  fields: readonly DetailFieldEntry[];
  ownerNames?: Readonly<Record<string, string>>;
  format: FormatOptions;
  onEdit?: (apiName: string) => void;
}) {
  const fullWidth = fields.filter((entry) => entry.column === "full");
  const left = fields.filter((entry) => entry.column === "left");
  const right = fields.filter((entry) => entry.column === "right");
  const hasColumns = left.length > 0 || right.length > 0;

  return (
    <>
      {hasColumns ? (
        <div className="detail-two-column" data-detail-columns>
          <div className="detail-column" data-detail-column="left">
            {left.map((entry) => (
              <FieldEntry
                key={entry.field.apiName}
                entry={entry}
                ownerNames={ownerNames}
                format={format}
                onEdit={onEdit}
              />
            ))}
          </div>
          <div className="detail-column" data-detail-column="right">
            {right.map((entry) => (
              <FieldEntry
                key={entry.field.apiName}
                entry={entry}
                ownerNames={ownerNames}
                format={format}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ) : null}
      {fullWidth.map((entry) => (
        <FieldEntry
          key={entry.field.apiName}
          entry={entry}
          ownerNames={ownerNames}
          format={format}
          onEdit={onEdit}
          layout="details-full"
        />
      ))}
    </>
  );
}

function FieldEntry({
  entry,
  ownerNames,
  format,
  onEdit,
  layout = "details",
}: {
  entry: DetailFieldEntry;
  ownerNames?: Readonly<Record<string, string>>;
  format: FormatOptions;
  onEdit?: (apiName: string) => void;
  layout?: "details" | "details-full";
}) {
  return (
    <DetailFieldRow
      field={entry.field}
      value={entry.value}
      auditTimestamp={entry.auditTimestamp}
      ownerNames={ownerNames}
      format={format}
      layout={layout}
      onEdit={onEdit}
    />
  );
}
