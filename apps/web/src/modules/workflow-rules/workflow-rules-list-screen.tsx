"use client";

import type { ReadResult, RulePage, WorkflowRule } from "@crm/core/automation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonSizes, buttonStyles } from "@/components/ui/button-styles";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUiTranslations } from "@/i18n/client-provider";
import { formatTrigger } from "./formatters";
import { WorkflowCreate } from "./workflow-create";

export interface WorkflowRulesListScreenProps {
  orgSlug: string;
  result: ReadResult<RulePage>;
  triggerResults: Record<string, ReadResult<WorkflowRule>>;
  module?: string;
  cursor?: string;
}

const DEFAULT_MODULES = ["Leads", "Contacts", "Accounts", "Deals"];

export function WorkflowRulesListScreen({
  orgSlug,
  result,
  triggerResults,
  module,
  cursor,
}: WorkflowRulesListScreenProps) {
  const t = useUiTranslations();
  const [creating, setCreating] = useState(false);
