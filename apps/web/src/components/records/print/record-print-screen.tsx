"use client";

import { NotFoundError } from "@crm/core/errors";
import type { RecordId } from "@crm/core/records";
import { useMemo } from "react";
import { FieldValueView } from "@/components/records/detail/field-value";
import { NotFoundMessage } from "@/components/shell/not-found-message";
import { useModule, useRecord, useUsers } from "@/lib/api/client/hooks";
import { useFormat } from "@/lib/format-context";
import type { ModuleScreenDefinition } from "@/modules/types";
import { PrintToolbar } from "./print-toolbar";
import "./print-page.css";

/** Interim rule: sections in the detail-screen order, label–value in two columns. */
export function RecordPrintScreen({
  orgSlug,
  recordId,
  definition,
}: {
  orgSlug: string;
  recordId: RecordId;
  definition: ModuleScreenDefinition;
}) {
  const orgFormat = useFormat();
  const moduleQuery = useModule(definition.apiName);
  const recordQuery = useRecord(definition.apiName, recordId);
  const usersQuery = useUsers();
  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of usersQuery.data ?? []) map[member.userId] = member.name;
    return map;
  }, [usersQuery.data]);

  if (recordQuery.isError) {
    if (recordQuery.error instanceof NotFoundError) {
      return (
        <div className="print-page">
          <NotFoundMessage />
        </div>
      );
    }
    throw recordQuery.error;
  }
  if (moduleQuery.isError) throw moduleQuery.error;
  if (usersQuery.isError) throw usersQuery.error;
  const module = moduleQuery.data;
  const record = recordQuery.data;
  if (!module || !record || usersQuery.data === undefined) {
    return <div className="print-page" aria-hidden="true" />;
  }

  const { title } = definition.detail.header(record, { orgSlug });
  const sections = definition.detail.sections(module, record);

  return (
    <div className="print-page" data-print-kind="record">
      <PrintToolbar title={title} moduleLabel={definition.singularLabel} />
      {sections.map((section) => (
        <section key={section.title} className="print-page__section">
          <h2 className="print-page__section-title">{section.title}</h2>
          <dl className="print-page__fields">
            {section.fields.map((entry) => (
              <div
                key={entry.field.apiName}
                className="print-page__field"
                style={entry.column === "full" ? { gridColumn: "1 / -1" } : undefined}
              >
                <dt className="print-page__label">{entry.field.label}</dt>
                <dd className="print-page__value">
                  <FieldValueView
                    field={entry.field}
                    value={entry.value}
                    ownerNames={ownerNames}
                    format={orgFormat}
                    auditTimestamp={entry.auditTimestamp}
                    orgSlug={orgSlug}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
