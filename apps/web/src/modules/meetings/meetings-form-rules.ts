import type { FieldValue, ModuleMetadata } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";
import { addHours, nextFullHour } from "@/lib/records/datetime-parts";
import { MEETING_PARTICIPANT_MODULES } from "@/lib/records/meeting-participants";

export const MEETINGS_FORM_TITLE_DEFAULT = "New Meeting";
export const MEETINGS_FORM_VENUE_DEFAULT = "Client location";

/** Audit, check-in and identity fields the exported layout carries but no create form paints. */
export const MEETINGS_FORM_OMITTED_FIELDS = [
  "Meeting_Provider__s",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "Last_Activity_Time",
  "Check_In_Time",
  "Check_In_By",
  "Check_In_Comment",
  "Check_In_Sub_Locality",
  "Check_In_City",
  "Check_In_State",
  "Check_In_Country",
  "Latitude",
  "Longitude",
  "Tag",
  "id",
] as const;

/**
 * Provisional create defaults: From is the next whole hour, To is one hour later, the venue is the
 * reference dialog's initial one and the title is its generic initial text. Host comes from the
 * session through `rules.owner`.
 */
export function buildMeetingsFormDefaults(
  _metadata?: ModuleMetadata,
  now: Date = new Date(),
): Record<string, FieldValue> {
  const start = nextFullHour(now);
  return {
    Event_Title: MEETINGS_FORM_TITLE_DEFAULT,
    Meeting_Venue__s: MEETINGS_FORM_VENUE_DEFAULT,
    All_day: false,
    Start_DateTime: start.toISOString(),
    End_DateTime: addHours(start, 1).toISOString(),
  };
}

export const meetingsFormRules: FormRules = {
  owner: "Owner",
  omitted: MEETINGS_FORM_OMITTED_FIELDS,
  defaultValues: buildMeetingsFormDefaults,
  ranges: [{ start: "Start_DateTime", end: "End_DateTime" }],
  allDay: { flag: "All_day", fields: ["Start_DateTime", "End_DateTime"] },
  participantModules: { Participants: MEETING_PARTICIPANT_MODULES },
  laterModuleFields: { Recurring_Activity: "P3" },
};
