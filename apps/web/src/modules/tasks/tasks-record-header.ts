import type { RecordData } from "@crm/core/records";
import type { ComponentType, SVGProps } from "react";
import { Icons } from "@/components/ui/icon";

/**
 * Record header identity: static task icon (not a portrait upload) plus the Subject title.
 * Previous / next record arrows follow the shared header default (TD-08, TD-09).
 */
export function tasksRecordHeaderIdentity(
  record: RecordData,
  _context?: unknown,
): {
  title: string;
  subtitle?: string;
  hasPortrait?: boolean;
  portraitIcon?: ComponentType<SVGProps<SVGSVGElement>>;
} {
  const title = typeof record.fields.Subject === "string" ? (record.fields.Subject as string) : "";

  return {
    title,
    hasPortrait: true,
    portraitIcon: Icons.check,
  };
}
