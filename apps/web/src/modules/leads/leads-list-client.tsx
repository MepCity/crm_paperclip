"use client";

import { ModuleListScreen } from "@/components/records/list/module-list-screen";
import { leadsListPageConfig } from "./list-config";

export function LeadsListClient({ orgSlug, viewId }: { orgSlug: string; viewId?: string }) {
  return <ModuleListScreen orgSlug={orgSlug} config={leadsListPageConfig} viewId={viewId} />;
}
