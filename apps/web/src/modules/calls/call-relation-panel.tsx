"use client";

import type {
  FieldDefinition,
  FieldValue,
  ModuleApiName,
  ModuleRecordReference,
  RecordData,
} from "@crm/core/records";
import { useMemo } from "react";
import {
  type ActivityRelationDeal,
  type ActivityRelationGroup,
  type ActivityRelationKind,
  ActivityRelationPanel,
  type ActivityRelationPerson,
} from "@/components/records/detail/activity-relation-panel";
import { formatFieldValue } from "@/components/records/field-format";
import { useRecord, useRecordCount, useRecordList } from "@/lib/api/client/hooks";
import { moduleRecordPath } from "@/lib/crm-paths";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { resolveModuleScreenByApiName } from "../registry";
import { CALLS_LIST_CURRENCY_CODE } from "./list-config";

export interface CallRelationPanelProps {
  record: RecordData;
  orgSlug: string;
}

function asLookup(value: unknown): ModuleRecordReference | null {
  if (!value || typeof value !== "object" || !("module" in value) || !("id" in value)) return null;
  return value as ModuleRecordReference;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function summaryField(apiName: string, dataType: "date" | "currency"): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType,
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: false, edit: false, quickCreate: false },
  };
}

function formatted(field: FieldDefinition, value: FieldValue): string | null {
  const result = formatFieldValue(field, value, {}, DEFAULT_FORMAT, {
    currencyCode: CALLS_LIST_CURRENCY_CODE,
  });
  return result.kind === "text" ? result.text : null;
}

const CLOSING_DATE_FIELD = summaryField("Closing_Date", "date");
const AMOUNT_FIELD = summaryField("Amount", "currency");

function dealSummaryText(deal: RecordData): string {
  const parts = [text(deal.fields.Stage)];
  if (deal.fields.Closing_Date != null)
    parts.push(formatted(CLOSING_DATE_FIELD, deal.fields.Closing_Date));
  if (typeof deal.fields.Amount === "number")
    parts.push(formatted(AMOUNT_FIELD, deal.fields.Amount));
  return parts.filter(Boolean).join(" · ");
}

/**
 * Loads the data of the Calls right-hand relation panel (CD-50 – CD-70) through the record service:
 * the Who_Id contact person with its account, person deals and open activity counts.
 * In accordance with the spec (CD-50–CD-70): no mobile value/action (TD-59 absent) and no deal link.
 */
export function CallRelationPanel({ record, orgSlug }: CallRelationPanelProps) {
  const whoRef = asLookup(record.fields.Who_Id);
  const whoModule = (whoRef?.module ?? "Contacts") as ModuleApiName;
  const whoId = whoRef?.id ?? "";
  const whoQuery = useRecord(whoModule, whoId);
  const isContact = whoModule === "Contacts";

  const dealsQuery = useRecordList(
    "Deals",
    {
      viewId: "all-deals",
      page: 1,
      perPage: 20,
      filters: { field: "Contact_Name", comparator: "equal", value: whoId },
    },
    { enabled: Boolean(whoId) && isContact },
  );

  const openTasks = useRecordCount(
    "Tasks",
    {
      viewId: "all-tasks",
      filters: {
        groupOperator: "and",
        group: [
          { field: "Who_Id", comparator: "equal", value: whoId },
          { field: "Status", comparator: "not_equal", value: "Completed" },
        ],
      },
    },
    { enabled: Boolean(whoId) },
  );

  const openCalls = useRecordCount(
    "Calls",
    {
      viewId: "all-calls",
      filters: {
        groupOperator: "and",
        group: [
          { field: "Who_Id", comparator: "equal", value: whoId },
          { field: "Outgoing_Call_Status", comparator: "equal", value: "Scheduled" },
        ],
      },
    },
    { enabled: Boolean(whoId) },
  );

  const persons = useMemo((): ActivityRelationPerson[] => {
    if (!whoRef) return [];
    const person = whoQuery.data;
    const accountRef = asLookup(person?.fields.Account_Name);
    const fullName = text(person?.fields.Full_Name) ?? whoRef.name ?? whoRef.id;
    return [
      {
        id: whoRef.id,
        name: fullName,
        moduleLabel: resolveModuleScreenByApiName(whoRef.module)?.singularLabel ?? whoRef.module,
        accountId: accountRef?.id ?? null,
        accountName: accountRef?.name ?? null,
        email: text(person?.fields.Email),
        phone: text(person?.fields.Phone),
        // TD-59 mobile call button and mobile value absent per spec
        mobile: null,
      },
    ];
  }, [whoRef, whoQuery.data]);

  const deals = useMemo(
    (): ActivityRelationDeal[] =>
      (dealsQuery.data?.records ?? []).map((deal) => ({
        id: deal.id,
        name: text(deal.fields.Deal_Name) ?? deal.id,
        summaryText: dealSummaryText(deal),
      })),
    [dealsQuery.data],
  );

  const openActivities: Record<ActivityRelationKind, ActivityRelationGroup> = {
    tasks: { count: whoId ? (openTasks.data ?? 0) : 0 },
    meetings: { count: 0 },
    calls: { count: whoId ? (openCalls.data ?? 0) : 0 },
  };

  return (
    <ActivityRelationPanel
      persons={persons}
      selectedPersonId={whoRef?.id ?? null}
      onSelectPerson={() => {}}
      deals={deals}
      dealEmptyText="No Deals found"
      openActivities={openActivities}
      contactRecordPath={(id) =>
        moduleRecordPath(orgSlug, (whoRef?.module ?? "Contacts") as ModuleApiName, id)
      }
      accountRecordPath={(id) => moduleRecordPath(orgSlug, "Accounts", id)}
      dealRecordPath={(id) => moduleRecordPath(orgSlug, "Deals", id)}
    />
  );
}
