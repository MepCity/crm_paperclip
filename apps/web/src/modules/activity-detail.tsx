"use client";

import type { ModuleApiName, ModuleRecordReference, RecordData } from "@crm/core/records";
import { useState } from "react";
import {
  ActivityRelationPanel,
  type ActivityRelationPerson,
} from "@/components/records/detail/activity-relation-panel";
import { useRecord } from "@/lib/api/client/hooks";
import { moduleRecordPath } from "@/lib/crm-paths";
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
 * Deal Summary and Open Activities. Deal and activity lists have no data source yet,
 * so they render their empty state.
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
  return (
    <ActivityRelationPanel
      persons={persons}
      selectedPersonId={selectedId}
      onSelectPerson={setSelected}
      deals={[]}
      openActivities={{
        tasks: { count: 0 },
        meetings: { count: 0 },
        calls: { count: 0 },
      }}
      contactRecordPath={(id) =>
        moduleRecordPath(orgSlug, tabOf(personRef?.module ?? "Contacts"), id)
      }
      accountRecordPath={(id) => moduleRecordPath(orgSlug, "Accounts", id)}
      dealRecordPath={(id) => moduleRecordPath(orgSlug, "Deals", id)}
    />
  );
}
