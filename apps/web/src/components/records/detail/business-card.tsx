"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import "./detail-cards.css";
import { DetailFieldRow } from "./detail-field-row";

export type BusinessCardField = {
  field: FieldDefinition;
  value: FieldValue;
  callAction?: boolean;
  valueSuffix?: string;
};

export interface BusinessCardProps {
  fields: readonly BusinessCardField[];
  ownerNames?: Readonly<Record<string, string>>;
  format: FormatOptions;
}

export function BusinessCard({ fields, ownerNames, format }: BusinessCardProps) {
  return (
    <section className="detail-card detail-business-card" aria-label="Business card">
      {fields.map(({ field, value, callAction, valueSuffix }) => (
        <DetailFieldRow
          key={field.apiName}
          field={field}
          value={value}
          callAction={callAction}
          valueSuffix={valueSuffix}
          ownerNames={ownerNames}
          format={format}
          layout="business"
        />
      ))}
    </section>
  );
}
