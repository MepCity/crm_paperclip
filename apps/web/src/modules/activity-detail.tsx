"use client";

import type { Criteria, ModuleApiName, ModuleRecordReference, RecordData } from "@crm/core/records";
import { useMemo, useState } from "react";
import {
  type ActivityRelationDeal,
  ActivityRelationPanel,
  type ActivityRelationPerson,
} from "@/components/records/detail/activity-relation-panel";
import { formatFieldValue } from "@/components/records/field-format";
import { useModule, useRecord, useRecordList, useViews } from "@/lib/api/client/hooks";
import { moduleRecordPath } from "@/lib/crm-paths";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { useParentActivities } from "@/lib/records/use-parent-activities";
import { resolveModuleScreenByApiName } from "./registry";

function asRef(value: unknown): ModuleRecordReference | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const ref = value as Partial<ModuleRecordReference>;
  return ref.id && ref.module && typeof ref.name === "string"
    ? (ref as ModuleRecordReference)
    : undefined;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function tabOf(module: string): string {
  return resolveModuleScreenByApiName(module as ModuleApiName)?.tab ?? module;
}

/**
 * Right-hand relation panel of Task / Meeting / Call details (MEP-591, rows 3 and 24):
 * the related person (Who_Id, else a person-like What_Id) with Info / Conversations,
 * Deal Summary (the person's Deals) and Open Activities (the person's open Tasks,
 * Meetings and Calls), read through the existing list endpoints.
 */
export function ActivitySidePanel({ record, orgSlug }: { record: RecordData; orgSlug: string }) {
  const personRef = asRef(record.fields.Who_Id) ?? asRef(record.fields.What_Id);
  const personQuery = useRecord(
    (personRef?.module ?? "Contacts") as ModuleApiName,
    personRef?.id ?? "",
  );
  const [selected, setSelected] = useState<string | null>(null);
  const fields = personQuery.data?.fields ?? {};
  const account = asRef(fields.Account_Name);
  const isCall =
    "Call_Type" in record.fields ||
    "Call_Start_Time" in record.fields ||
    "Outgoing_Call_Status" in record.fields;
  const persons: ActivityRelationPerson[] = personRef
    ? [
        {
          id: personRef.id,
          name: personRef.name ?? "",
          moduleLabel:
            resolveModuleScreenByApiName(personRef.module as ModuleApiName)?.singularLabel ??
            personRef.module,
          accountId: account?.id ?? null,
          accountName: account?.name ?? null,
          email: text(fields.Email),
          phone: text(fields.Phone),
          mobile: isCall ? null : text(fields.Mobile),
        },
      ]
    : [];
  const selectedId = selected ?? persons[0]?.id ?? null;

  const isContact = personRef?.module === "Contacts";
  const dealsModule = useModule("Deals");
  const dealViews = useViews("Deals", { enabled: isContact });
  const dealViewId = dealViews.data?.find((view) => view.isDefault)?.id ?? null;
  const dealFilter = useMemo<Criteria | undefined>(
    () =>
      personRef && isContact
        ? { field: "Contact_Name", comparator: "equal", value: personRef.id }
        : undefined,
    [isContact, personRef],
  );
  const dealList = useRecordList(
    "Deals",
    {
      viewId: dealViewId ?? "pending",
      page: 1,
      perPage: 100,
      filters: dealFilter,
    },
    { enabled: dealViewId !== null && dealFilter !== undefined },
  );
  const deals = useMemo<ActivityRelationDeal[]>(() => {
    const fieldsByName = new Map((dealsModule.data?.fields ?? []).map((f) => [f.apiName, f]));
    const part = (row: RecordData, apiName: string): string | null => {
      const field = fieldsByName.get(apiName);
      const value = row.fields[apiName];
      if (!field || value === undefined) return null;
      const formatted = formatFieldValue(field, value, {}, DEFAULT_FORMAT, {
        numericDates: true,
      });
      return formatted.kind === "text" || formatted.kind === "multiline" ? formatted.text : null;
    };
    return (dealList.data?.records ?? []).map((row) => ({
      id: row.id,
      name: text(row.fields.Deal_Name) ?? row.id,
      summaryText: ["Amount", "Stage", "Closing_Date"]
        .map((apiName) => part(row, apiName))
        .filter((v): v is string => v !== null)
        .join(" · "),
    }));
  }, [dealList.data, dealsModule.data]);

  const activities = useParentActivities(
    personRef?.module ?? "",
    personRef?.id ?? "",
    (module, id) => moduleRecordPath(orgSlug, tabOf(module), id),
  );
  const countOf = (kind: "task" | "meeting" | "call") =>
    activities.open.find((category) => category.kind === kind)?.count ?? 0;
  return (
    <ActivityRelationPanel
      persons={persons}
      selectedPersonId={selectedId}
      onSelectPerson={setSelected}
      deals={deals}
      openActivities={{
        tasks: { count: countOf("task") },
        meetings: { count: countOf("meeting") },
        calls: { count: countOf("call") },
      }}
      contactRecordPath={(id) =>
        moduleRecordPath(orgSlug, tabOf(personRef?.module ?? "Contacts"), id)
      }
      accountRecordPath={(id) => moduleRecordPath(orgSlug, "Accounts", id)}
      dealRecordPath={(id) => moduleRecordPath(orgSlug, "Deals", id)}
    />
  );
}
