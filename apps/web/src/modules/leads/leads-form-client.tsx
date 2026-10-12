"use client";
import { ModuleFormClient } from "../module-form-client";
import { leadsScreenDefinition } from "./definition";
export function LeadsFormClient(props: Omit<Parameters<typeof ModuleFormClient>[0], "definition">) {
  return <ModuleFormClient {...props} definition={leadsScreenDefinition} />;
}
