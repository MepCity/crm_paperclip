"use client";
import { useCallback } from "react";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
} from "@/components/records/detail/record-detail-screen";
import { useParentActivityBadges } from "@/lib/records/use-parent-activities";
import { leadsScreenDefinition } from "./definition";
import { createLeadsRelatedLists } from "./leads-related-lists";

export type { RecordDetailPaths as LeadRecordPaths } from "@/components/records/detail/record-detail-screen";
export function LeadRecordScreen({
  definition = leadsScreenDefinition,
  ...props
}: Omit<RecordDetailScreenProps, "definition"> & {
  definition?: RecordDetailScreenProps["definition"];
}) {
  const badges = useParentActivityBadges("Leads", props.recordId);
  const buildRelatedLists = useCallback(() => createLeadsRelatedLists(badges), [badges]);
  return (
    <RecordDetailScreen {...props} definition={definition} buildRelatedLists={buildRelatedLists} />
  );
}
