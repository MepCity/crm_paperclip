import type { GeneratedRecord } from "./dataset";

export const SLOT_COLUMNS = [
  ...Array.from({ length: 8 }, (_, i) => ({
    name: `ix_text_${i + 1}`,
    type: 'text collate "und-x-icu"',
  })),
  ...Array.from({ length: 4 }, (_, i) => ({ name: `ix_num_${i + 1}`, type: "double precision" })),
  ...Array.from({ length: 4 }, (_, i) => ({ name: `ix_time_${i + 1}`, type: "timestamptz" })),
  ...Array.from({ length: 4 }, (_, i) => ({ name: `ix_ref_${i + 1}`, type: "uuid" })),
];

export const LEAD_SLOTS: Record<string, string> = {
  company: "ix_text_1",
  last_name: "ix_text_2",
  lead_status: "ix_text_3",
  lead_source: "ix_text_4",
  industry: "ix_text_5",
  rating: "ix_text_6",
  country: "ix_text_7",
  annual_revenue: "ix_num_1",
  cf_datetime_1: "ix_time_1",
  cf_lookup_1: "ix_ref_1",
};
const CONTACT_SLOTS: Record<string, string> = {
  last_name: "ix_text_1",
  company: "ix_text_2",
  email: "ix_text_3",
};

export function slotValues(
  record: GeneratedRecord,
  contact = false,
): Array<string | number | boolean | null> {
  const assignment = contact ? CONTACT_SLOTS : LEAD_SLOTS;
  const bySlot = new Map(Object.entries(assignment).map(([key, slot]) => [slot, key]));
  return SLOT_COLUMNS.map(({ name }) => {
    const key = bySlot.get(name);
    return key ? (record.fields[key]?.column ?? null) : null;
  });
}

export function slotIndexes(nonNull: boolean): string[] {
  return SLOT_COLUMNS.map(
    ({ name }) => `create index a_slot_${name} on bench_a.records
    (organization_id, module_id, ${name}, id) where deleted_at is null${nonNull ? ` and ${name} is not null` : ""}`,
  );
}
