"use client";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
} from "@/components/records/detail/record-detail-screen";
import { leadsScreenDefinition } from "./definition";

export type { RecordDetailPaths as LeadRecordPaths } from "@/components/records/detail/record-detail-screen";
export function LeadRecordScreen(props: Omit<RecordDetailScreenProps, "definition">) {
  return <RecordDetailScreen {...props} definition={leadsScreenDefinition} />;
}
