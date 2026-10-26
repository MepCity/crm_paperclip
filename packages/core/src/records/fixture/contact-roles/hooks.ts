import { ValidationError } from "../../../errors";
import type { FieldValue, RecordData } from "../../contract";
import type { FixtureHookContext, FixtureModuleHooks } from "../hooks";
import { contactRoleNames } from "./picklists";

const MODULE = "Contact_Roles";

function referenceId(value: FieldValue | undefined): string | null {
  return typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
    ? value.id
    : null;
}

export const contactRolesHooks: FixtureModuleHooks = {
  applyRules(fields, _input, previous, ctx) {
    const deal = referenceId(fields.Deal);
    const contact = referenceId(fields.Contact);
    if (previous) {
      // interim rule: the parent pair is fixed once the row exists.
      if (deal !== referenceId(previous.Deal))
        throw new ValidationError({ Deal: ["The deal cannot be changed."] });
      if (contact !== referenceId(previous.Contact))
        throw new ValidationError({ Contact: ["The contact cannot be changed."] });
    } else {
      if (!deal || !ctx.moduleStore("Deals").records.has(deal))
        throw new ValidationError({ Deal: ["Choose an existing deal."] });
      if (!contact || !ctx.moduleStore("Contacts").records.has(contact))
        throw new ValidationError({ Contact: ["Choose an existing contact."] });
      for (const row of ctx.moduleStore(MODULE).records.values())
        if (referenceId(row.fields.Deal) === deal && referenceId(row.fields.Contact) === contact)
          throw new ValidationError({
            Contact: ["This contact already has a role on the deal."],
          });
    }
    const role = fields.Contact_Role;
    if (role !== null && role !== undefined && role !== "-None-") {
      if (!(contactRoleNames as readonly string[]).includes(String(role)))
        throw new ValidationError({ Contact_Role: ["Choose a value from the list."] });
    } else fields.Contact_Role = null;
  },
};

/** Not wired yet: drop role rows whose parent deal or contact was deleted. */
export function removeContactRolesFor(
  field: "Deal" | "Contact",
  ids: readonly string[],
  ctx: FixtureHookContext,
): void {
  const store = ctx.moduleStore(MODULE);
  for (const row of [...store.records.values()]) {
    const id = referenceId(row.fields[field]);
    if (id && ids.includes(id)) store.records.delete(row.id);
  }
}

/** Not wired yet: move duplicate contacts' rows to the master; repeated deals drop. */
export function transferContactRolesToMaster(
  duplicateIds: readonly string[],
  masterId: string,
  ctx: FixtureHookContext,
): void {
  const store = ctx.moduleStore(MODULE);
  const rows = [...store.records.values()];
  const masterDeals = new Set(
    rows
      .filter((row) => referenceId(row.fields.Contact) === masterId)
      .map((row) => referenceId(row.fields.Deal)),
  );
  for (const row of rows) {
    const contact = referenceId(row.fields.Contact);
    if (!contact || !duplicateIds.includes(contact)) continue;
    const deal = referenceId(row.fields.Deal);
    if (masterDeals.has(deal)) {
      store.records.delete(row.id);
      continue;
    }
    masterDeals.add(deal);
    const moved: RecordData = {
      id: row.id,
      fields: { ...row.fields, Contact: { module: "Contacts", id: masterId } },
    };
    store.records.set(row.id, moved);
  }
}
