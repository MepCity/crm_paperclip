import type { FieldDefinition, FieldValue } from "@crm/core/records";
import type { StatusRibbonProps } from "@/components/records/detail/status-ribbon";
import type { PicklistGroup, PicklistOption } from "@/components/ui/picklist-menu";

/** Interim: terminal groups are not on module metadata; matches observed board captures. */
const LEADS_TERMINAL_STATUS_GROUPS: readonly {
  categoryLabel: string;
  storedValues: readonly string[];
}[] = [
  { categoryLabel: "Junk", storedValues: ["Junk Lead"] },
  { categoryLabel: "Not Qualified", storedValues: ["Not Qualified"] },
];

export const LEADS_STATUS_RIBBON_LABELS: StatusRibbonProps["labels"] = {
  ribbon: "Lead status",
  stageMenu: "Choose lead status",
  terminalMenu: "Choose rejected lead status",
  search: "Search lead statuses",
  searchPlaceholder: "Search",
  empty: "No matching lead statuses",
  scrollPrevious: "Scroll previous stages",
  scrollNext: "Scroll next stages",
};

export function readLeadStatusValue(value: FieldValue | undefined): string | null {
  if (typeof value !== "string" || value.length === 0 || value === "-None-") return null;
  return value;
}

export function buildLeadStatusStages(
  field: FieldDefinition | undefined,
): readonly PicklistOption[] {
  const stages: PicklistOption[] = [{ value: null, label: "-None-" }];
  for (const option of field?.picklist ?? []) {
    if (option.storedValue === "-None-") continue;
    stages.push({ value: option.storedValue, label: option.displayValue });
  }
  return stages;
}

export function buildLeadStatusTerminalGroups(
  stages: readonly PicklistOption[],
): readonly PicklistGroup[] {
  const byValue = new Map(
    stages.filter((stage) => stage.value !== null).map((stage) => [stage.value, stage]),
  );
  return LEADS_TERMINAL_STATUS_GROUPS.flatMap((group) => {
    const options = group.storedValues.flatMap((stored) => {
      const stage = byValue.get(stored);
      return stage ? [stage] : [];
    });
    return options.length ? [{ label: group.categoryLabel, options }] : [];
  });
}
