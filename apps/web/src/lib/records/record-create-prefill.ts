import type { FieldValue, ModuleApiName } from "@crm/core/records";

export type RecordCreatePrefill = {
  module: ModuleApiName;
  fields: Readonly<Record<string, FieldValue>>;
  /** Where Save returns to instead of the new record (e.g. the parent detail). */
  returnTo?: string;
};

const STORAGE_PREFIX = "mep:record-create-prefill:";

export function recordCreatePrefillKey(orgSlug: string, module: ModuleApiName): string {
  return `${STORAGE_PREFIX}${orgSlug}:${module}`;
}

export function writeRecordCreatePrefill(orgSlug: string, prefill: RecordCreatePrefill): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(recordCreatePrefillKey(orgSlug, prefill.module), JSON.stringify(prefill));
}

export function readRecordCreatePrefill(
  orgSlug: string,
  module: ModuleApiName,
): RecordCreatePrefill | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(recordCreatePrefillKey(orgSlug, module));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RecordCreatePrefill;
    if (parsed.module !== module || typeof parsed.fields !== "object" || parsed.fields === null) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function consumeRecordCreatePrefill(
  orgSlug: string,
  module: ModuleApiName,
): RecordCreatePrefill | null {
  const prefill = readRecordCreatePrefill(orgSlug, module);
  if (!prefill) return null;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(recordCreatePrefillKey(orgSlug, module));
  }
  return prefill;
}
