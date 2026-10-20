import type { FieldValue, ModuleRecordReference, RecordData } from "@crm/core/records";
import { moduleCreatePath } from "@/lib/crm-paths";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";

function accountLookupOfDeal(fields: RecordData["fields"]): ModuleRecordReference | null {
  const value = fields.Account_Name as FieldValue | undefined;
  if (typeof value !== "object" || value === null || !("id" in value)) return null;
  const ref = value as ModuleRecordReference;
  if (typeof ref.id !== "string" || ref.id.length === 0) return null;
  return { module: "Accounts", id: ref.id, ...(ref.name ? { name: ref.name } : {}) };
}

/** Provisional rule (MEP-900): New Case from the Deals card fills Deal Name and Account Name. */
export function openCaseCreateWithDeal(
  orgSlug: string,
  deal: Pick<RecordData, "id" | "fields">,
  navigate: (path: string) => void,
): void {
  const account = accountLookupOfDeal(deal.fields);
  const name = deal.fields.Deal_Name;
  writeRecordCreatePrefill(orgSlug, {
    module: "Cases",
    fields: {
      Deal_Name: {
        module: "Deals",
        id: deal.id,
        ...(typeof name === "string" ? { name } : {}),
      },
      ...(account ? { Account_Name: account } : {}),
    },
  });
  navigate(moduleCreatePath(orgSlug, "Cases"));
}
