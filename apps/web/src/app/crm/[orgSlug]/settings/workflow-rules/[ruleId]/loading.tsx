"use client";

import { useParams } from "next/navigation";
import { WorkflowRulesLoading } from "@/modules/workflow-rules/workflow-rules-loading";

export default function Loading() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  return <WorkflowRulesLoading orgSlug={orgSlug} />;
}
