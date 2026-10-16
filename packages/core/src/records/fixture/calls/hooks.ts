import { ValidationError } from "../../../errors";
import type { FixtureModuleHooks } from "../hooks";

export const callsHooks: FixtureModuleHooks = {
  optionalFields: (fields) =>
    fields.Call_Type === "Inbound" || fields.Outgoing_Call_Status === "Completed"
      ? []
      : ["Call_Duration"],
  applyRules(fields) {
    if (fields.Outgoing_Call_Status !== "Completed" && fields.Call_Type !== "Inbound") return;
    const duration = fields.Call_Duration;
    if (typeof duration !== "string" || !/^\d{2,}:[0-5]\d$/.test(duration))
      throw new ValidationError({ Call_Duration: ["Enter a duration in mm:ss format."] });
    const [minutes, seconds] = duration.split(":").map(Number);
    const total = (minutes ?? 0) * 60 + (seconds ?? 0);
    if (!Number.isSafeInteger(total))
      throw new ValidationError({ Call_Duration: ["Enter a duration in mm:ss format."] });
    fields.Call_Duration_in_seconds = total;
  },
  readRecord(record, now) {
    return record.fields.Outgoing_Call_Status === "Scheduled" &&
      Date.parse(String(record.fields.Call_Start_Time)) < now.getTime()
      ? { ...record, fields: { ...record.fields, Outgoing_Call_Status: "Overdue" } }
      : record;
  },
};
