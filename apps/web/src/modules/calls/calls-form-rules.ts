import type { FieldValue, ModuleMetadata } from "@crm/core/records";
import type { FormDynamicState, FormRules } from "@/components/records/form/form-model";

export const CALLS_FORM_CREATE_TITLE = "Create Call";
export const CALLS_FORM_EDIT_TITLE = "Edit Call";

export const CALLS_FORM_TYPE_DEFAULT = "Outbound";
export const CALLS_FORM_STATUS_DEFAULT = "Scheduled";
export const CALLS_FORM_COMPLETED_STATUS = "Completed";
export const CALLS_FORM_CANCELLED_STATUS = "Cancelled";

/** Fields the exported layout carries but the call form never paints (`activities-form.md`). */
export const CALLS_FORM_OMITTED_FIELDS = [
  "Dialled_Number",
  "Caller_ID",
  "Voice_Recording__s",
  "Call_Duration_in_seconds",
  "Scheduled_In_CRM",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "Last_Activity_Time",
  "CTI_Entry",
  "Tag",
  "id",
] as const;

/** Create defaults: Outbound and Scheduled, Owner comes from the session. */
export function buildCallsFormDefaults(metadata?: ModuleMetadata): Record<string, FieldValue> {
  const pick = (apiName: string, fallback: string) => {
    const options = metadata?.fields.find((f) => f.apiName === apiName)?.picklist;
    return options?.find((o) => o.storedValue === fallback)?.storedValue ?? fallback;
  };
  return {
    Call_Type: pick("Call_Type", CALLS_FORM_TYPE_DEFAULT),
    Outgoing_Call_Status: pick("Outgoing_Call_Status", CALLS_FORM_STATUS_DEFAULT),
  };
}

/**
 * Interim rule: the form is in "record" mode (a call that already happened) when the type is
 * Inbound or Missed or the status is Completed. Scheduling mode paints Reminder; record mode
 * hides it and paints the outcome section; Call Duration shows for Inbound and Completed only.
 */
export function isCallRecordMode(values: Readonly<Record<string, FieldValue | undefined>>) {
  const type = values.Call_Type;
  return type === "Inbound" || type === "Missed" || values.Outgoing_Call_Status === "Completed";
}

export function callsFormDynamicState(
  values: Readonly<Record<string, FieldValue | undefined>>,
): FormDynamicState {
  const record = isCallRecordMode(values);
  const hasDuration = record && values.Call_Type !== "Missed";
  return {
    hidden: [
      ...(record ? ["Reminder"] : ["Call_Result", "Description"]),
      ...(hasDuration ? [] : ["Call_Duration"]),
    ],
    hiddenSections: record ? [] : ["Outcome Of Outgoing Call"],
    required: { Who_Id: true, Call_Type: true, Call_Start_Time: true, Call_Duration: hasDuration },
  };
}

export const callsFormRules: FormRules = {
  owner: "Owner",
  omitted: CALLS_FORM_OMITTED_FIELDS,
  omittedSections: ["Reason For Incoming Call"],
  viewOverrides: {
    Owner: { create: true, edit: true },
    Call_Type: { edit: true },
    Outgoing_Call_Status: { edit: true },
  },
  labelOverrides: { Who_Id: "Call From/To" },
  lookupLabelFields: ["Who_Id"],
  durationFields: ["Call_Duration"],
  dynamic: callsFormDynamicState,
  defaultValues: buildCallsFormDefaults,
};

/** Call Information is one column in the reference order (`activities-form.md`). */
export const CALLS_FORM_INFORMATION_COLUMNS = [
  [
    "Who_Id",
    "What_Id",
    "Call_Type",
    "Outgoing_Call_Status",
    "Call_Start_Time",
    "Call_Duration",
    "Owner",
    "Subject",
    "Reminder",
  ],
] as const;

export const CALLS_FORM_FALLBACK_COLUMNS = {
  "Call Information": CALLS_FORM_INFORMATION_COLUMNS,
  "Purpose Of Outgoing Call": [["Call_Purpose", "Call_Agenda"]],
  "Outcome Of Outgoing Call": [["Call_Result", "Description"]],
} as const;

/** Record-action edit intents (query `intent`): Reschedule Call and Mark as Completed. */
export const CALLS_EDIT_INTENTS: Readonly<
  Record<string, { set?: Readonly<Record<string, FieldValue>>; focus?: string }>
> = {
  reschedule: { focus: "Call_Start_Time" },
  complete: { set: { Outgoing_Call_Status: CALLS_FORM_COMPLETED_STATUS } },
};
