import { ValidationError } from "../../../errors";
import { referenceId } from "../campaigns/hooks";
import type { FixtureHookContext, FixtureModuleHooks } from "../hooks";

export const campaignMembersHooks: FixtureModuleHooks = {
  applyRules(fields, _input, previous, ctx) {
    const lead = referenceId(fields.Lead);
    const contact = referenceId(fields.Contact);
    if (Boolean(lead) === Boolean(contact))
      throw new ValidationError({ Lead: ["Choose exactly one lead or contact."] });
    // Same composite uniqueness mechanism as Contact_Roles, also on re-parenting.
    for (const row of ctx.moduleStore("Campaign_Members").records.values()) {
      if (row.id === previous?.id) continue;
      if (
        referenceId(row.fields.Campaign) === referenceId(fields.Campaign) &&
        referenceId(row.fields.Lead) === lead &&
        referenceId(row.fields.Contact) === contact
      )
        throw new ValidationError({
          [lead ? "Lead" : "Contact"]: ["This member already belongs to the campaign."],
        });
    }
  },
};
export function removeCampaignMembersFor(
  field: "Campaign" | "Lead" | "Contact",
  ids: readonly string[],
  ctx: FixtureHookContext,
): void {
  const store = ctx.moduleStore("Campaign_Members");
  for (const row of [...store.records.values()]) {
    const id = referenceId(row.fields[field]);
    if (id && ids.includes(id)) store.records.delete(row.id);
  }
}
