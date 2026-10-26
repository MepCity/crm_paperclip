import type { RecordActionKind } from "@crm/core/records";
import type { FilterItem } from "@/components/records/list/filter-panel";

type SystemProps = Pick<FilterItem, "systemEditor" | "systemOptions">;

const editorByLabel = {
  Locked: "locked",
  "Record Action": "record_action",
  "Related Records Action": "related_records_action",
  "Touched Records": "touched",
  "Untouched Records": "untouched",
} as const;

const activityParents = ["Leads", "Contacts", "Accounts", "Deals"];
const attachmentParents = [...activityParents, "Campaigns", "Tasks", "Events"];

/** Related lists the module registers, as offered by Related Records Action. */
function relatedModules(module: string) {
  return [
    { id: "Notes", label: "Notes" },
    ...(attachmentParents.includes(module) ? [{ id: "Attachments", label: "Attachments" }] : []),
    ...(activityParents.includes(module)
      ? [
          { id: "Tasks", label: "Tasks" },
          { id: "Events", label: "Meetings" },
          { id: "Calls", label: "Calls" },
        ]
      : []),
  ];
}

/** Editor props for one of the five generic system filter rows, undefined for any other row. */
export function systemFilterProps(label: string, module: string): SystemProps | undefined {
  const systemEditor = editorByLabel[label as keyof typeof editorByLabel];
  if (!systemEditor) return undefined;
  const recordActions: readonly RecordActionKind[] =
    module === "Leads" ? ["created", "updated", "converted"] : ["created", "updated"];
  return {
    systemEditor,
    systemOptions: { relatedModules: relatedModules(module), recordActions },
  };
}
