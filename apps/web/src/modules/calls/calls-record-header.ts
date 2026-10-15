import type { ModuleApiName, ModuleRecordReference, RecordData } from "@crm/core/records";
import type { ComponentType, SVGProps } from "react";
import { Icons } from "@/components/ui/icon";
import { moduleRecordPath } from "@/lib/crm-paths";
import { callReferenceSuffix } from "./calls-detail-sections";

function whoRef(record: RecordData): Partial<ModuleRecordReference> | undefined {
  const who = record.fields.Who_Id;
  if (!who || typeof who !== "object" || Array.isArray(who)) return undefined;
  const ref = who as Partial<ModuleRecordReference>;
  return typeof ref.name === "string" && ref.name.trim() !== "" ? ref : undefined;
}

/** Header identity: Call For contact record's name + link + module suffix, or Subject (CD-02). Static handset glyph. */
export function callsRecordHeaderIdentity(
  record: RecordData,
  context?: { orgSlug?: string },
): {
  title: string;
  titleHref?: string;
  subtitle?: string;
  hasPortrait?: boolean;
  portraitIcon?: ComponentType<SVGProps<SVGSVGElement>>;
  recordNavigation?: boolean;
} {
  const link = callsHeaderTitleLink(record);
  const subject = typeof record.fields.Subject === "string" ? record.fields.Subject : "";
  const title = link?.name ?? subject;
  const orgSlug = context?.orgSlug ?? "";
  const titleHref =
    link?.id && orgSlug
      ? moduleRecordPath(orgSlug, (link.module ?? "Contacts") as ModuleApiName, link.id)
      : undefined;
  const suffix = link?.suffix ?? "";
  const cleanSuffix = suffix.startsWith("- ") ? suffix.slice(2).trim() : suffix.trim();

  return {
    title,
    ...(titleHref ? { titleHref } : {}),
    ...(cleanSuffix ? { subtitle: cleanSuffix } : {}),
    hasPortrait: true,
    portraitIcon: Icons.phone,
    recordNavigation: true,
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
