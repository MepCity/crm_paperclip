import type { ModuleRecordReference, RecordData } from "@crm/core/records";
import { moduleRecordPath } from "@/lib/crm-paths";
import { resolveModuleScreenByApiName } from "@/modules/registry";
import { callReferenceSuffix } from "./calls-detail-sections";

function whoRef(record: RecordData): Partial<ModuleRecordReference> | undefined {
  const who = record.fields.Who_Id;
  if (!who || typeof who !== "object" || Array.isArray(who)) return undefined;
  const ref = who as Partial<ModuleRecordReference>;
  return typeof ref.name === "string" && ref.name.trim() !== "" ? ref : undefined;
}

/** Header identity: the Call For record's name, else Subject (CD-02). No portrait. */
export function callsRecordHeaderIdentity(
  record: RecordData,
  context?: { orgSlug?: string },
): {
  title: string;
  subtitle?: string;
  hasPortrait?: boolean;
  recordNavigation?: boolean;
  titleHref?: string;
  titleSuffix?: string;
} {
  const ref = whoRef(record);
  const subject = typeof record.fields.Subject === "string" ? record.fields.Subject : "";
  const link = callsHeaderTitleLink(record);
  const tab = link ? (resolveModuleScreenByApiName(link.module)?.tab ?? link.module) : undefined;
  return {
    title: ref?.name ?? subject,
    hasPortrait: false,
    recordNavigation: true,
    ...(link && tab && context?.orgSlug
      ? { titleHref: moduleRecordPath(context.orgSlug, tab, link.id) }
      : {}),
    ...(link?.suffix ? { titleSuffix: link.suffix } : {}),
  };
}

/** Title link target and unlinked module suffix for the header (CD-02); undefined when Who_Id is empty. */
export function callsHeaderTitleLink(
  record: RecordData,
): { name: string; module: string; id: string; suffix?: string } | undefined {
  const ref = whoRef(record);
  if (!ref?.name || !ref.module || !ref.id) return undefined;
  return {
    name: ref.name,
    module: ref.module,
    id: ref.id,
    suffix: callReferenceSuffix(record, "Who_Id"),
  };
}
