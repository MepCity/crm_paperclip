"use client";
import { ModuleListClient } from "../module-list-client";
import { leadsScreenDefinition } from "./definition";
export function LeadsListClient(props: Omit<Parameters<typeof ModuleListClient>[0], "definition">) {
  return <ModuleListClient {...props} definition={leadsScreenDefinition} />;
}
