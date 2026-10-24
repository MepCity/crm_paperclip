import { expect, test } from "vitest";
import {
  buildCallsFormDefaults,
  CALLS_EDIT_INTENTS,
  callsFormDynamicState,
  isCallRecordMode,
} from "./calls-form-rules";
import { callField, callMetadata } from "./test-metadata";

test("create defaults are Outbound and Scheduled", () => {
  expect(buildCallsFormDefaults()).toEqual({
    Call_Type: "Outbound",
    Outgoing_Call_Status: "Scheduled",
  });
  const metadata = callMetadata([
    callField("Call_Type", { picklist: [{ displayValue: "Outbound", storedValue: "Outbound" }] }),
  ]);
  expect(buildCallsFormDefaults(metadata).Call_Type).toBe("Outbound");
});

test("a scheduled outbound call stays in scheduling mode", () => {
  const values = { Call_Type: "Outbound", Outgoing_Call_Status: "Scheduled" };
  expect(isCallRecordMode(values)).toBe(false);
  const state = callsFormDynamicState(values);
  expect(state.hidden).toEqual(expect.arrayContaining(["Call_Duration", "Call_Result"]));
  expect(state.hidden).not.toContain("Reminder");
  expect(state.hiddenSections).toContain("Outcome Of Outgoing Call");
});

test("Inbound and Completed switch to record mode with a required duration", () => {
  for (const values of [
    { Call_Type: "Inbound", Outgoing_Call_Status: "Scheduled" },
    { Call_Type: "Outbound", Outgoing_Call_Status: "Completed" },
  ]) {
    expect(isCallRecordMode(values)).toBe(true);
    const state = callsFormDynamicState(values);
    expect(state.hidden).toContain("Reminder");
    expect(state.hidden).not.toContain("Call_Duration");
    expect(state.hidden).not.toContain("Call_Result");
    expect(state.required?.Call_Duration).toBe(true);
    expect(state.hiddenSections).toEqual([]);
  }
});

test("Missed + Scheduled is record mode without a duration", () => {
  const state = callsFormDynamicState({ Call_Type: "Missed", Outgoing_Call_Status: "Scheduled" });
  expect(state.hidden).toEqual(expect.arrayContaining(["Reminder", "Call_Duration"]));
  expect(state.required?.Call_Duration).toBe(false);
});

test("record action intents open Edit on the start time or with Completed set", () => {
  expect(CALLS_EDIT_INTENTS.reschedule).toEqual({ focus: "Call_Start_Time" });
  expect(CALLS_EDIT_INTENTS.complete?.set).toEqual({ Outgoing_Call_Status: "Completed" });
});

test("duration state matches the service matrix for every type × status", () => {
  for (const type of ["Outbound", "Inbound", "Missed"]) {
    for (const status of ["Scheduled", "Completed", "Overdue", "Cancelled"]) {
      const values = { Call_Type: type, Outgoing_Call_Status: status };
      const required = type === "Inbound" || status === "Completed";
      const state = callsFormDynamicState(values);
      expect(state.hidden?.includes("Call_Duration")).toBe(!required);
      expect(Boolean(state.required?.Call_Duration)).toBe(required);
    }
  }
});
