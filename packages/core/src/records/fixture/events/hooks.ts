import { ValidationError } from "../../../errors";
import type { FixtureModuleHooks } from "../hooks";

export const eventsHooks: FixtureModuleHooks = {
  applyRules(fields, _input, _previous, ctx) {
    for (const field of ["Start_DateTime", "End_DateTime"]) {
      if (typeof fields[field] !== "string" || !fields[field])
        throw new ValidationError({ [field]: ["This field is required."] }, undefined, "mandatory");
    }
    if (Date.parse(String(fields.End_DateTime)) < Date.parse(String(fields.Start_DateTime)))
      throw new ValidationError({ End_DateTime: ["End must not precede start."] });
    if (fields.All_day === true) {
      const start = new Date(String(fields.Start_DateTime));
      const end = new Date(String(fields.End_DateTime));
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 0);
      fields.Start_DateTime = start.toISOString();
      fields.End_DateTime = end.toISOString();
    }
    const participants = fields.Participants;
    if (participants === null) return;
    const fail = (): never => {
      throw new ValidationError({ Participants: ["Choose up to 50 valid participants."] });
    };
    if (!Array.isArray(participants) || participants.length > 50) fail();
    fields.Participants = (participants as unknown[]).map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
      const item = value as Record<string, unknown>;
      if (
        !["user", "lead", "contact", "email"].includes(String(item.type)) ||
        typeof item.name !== "string"
      )
        return fail();
      if (item.id !== null && typeof item.id !== "string") return fail();
      if (item.email !== null && typeof item.email !== "string") return fail();
      if (item.type === "email") {
        if (typeof item.email !== "string" || !item.email.trim()) return fail();
      } else if (typeof item.id !== "string" || !item.id.trim()) return fail();
      if (item.type === "lead" || item.type === "contact") {
        if (
          !ctx.moduleStore(item.type === "lead" ? "Leads" : "Contacts").records.has(String(item.id))
        )
          return fail();
      }
      return {
        type: String(item.type),
        id: item.id as string | null,
        name: item.name,
        email: item.email as string | null,
      };
    });
  },
};
