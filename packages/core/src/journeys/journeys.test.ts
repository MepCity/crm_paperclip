import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { journeyActionSchema, journeyDeadlineSchema, journeyTriggerSchema } from "./types";
import {
  validateCreateJourney,
  validateJourneyForPublish,
  validateUpdateJourneyDraft,
} from "./validation";

describe("Journey Schemas and Validation", () => {
  describe("createJourneySchema", () => {
    it("accepts valid input", () => {
      const input = {
        name: "Enterprise Onboarding",
        module: "Deals",
        description: "Post-close onboarding journey",
      };
      const result = validateCreateJourney(input);
      expect(result.name).toBe("Enterprise Onboarding");
      expect(result.module).toBe("Deals");
      expect(result.description).toBe("Post-close onboarding journey");
    });

    it("accepts all 4 supported modules", () => {
      for (const mod of ["Leads", "Contacts", "Accounts", "Deals"] as const) {
        const res = validateCreateJourney({ name: `Journey ${mod}`, module: mod });
        expect(res.module).toBe(mod);
      }
    });

    it("rejects empty or whitespace-only name", () => {
      expect(() => validateCreateJourney({ name: "   ", module: "Leads" })).toThrowError(
        ValidationError,
      );
      expect(() => validateCreateJourney({ name: "", module: "Contacts" })).toThrowError(
        ValidationError,
      );
    });

    it("rejects unsupported modules", () => {
      expect(() => validateCreateJourney({ name: "Q", module: "Quotes" })).toThrowError(
        ValidationError,
      );
      expect(() => validateCreateJourney({ name: "C", module: "Cases" })).toThrowError(
        ValidationError,
      );
    });
  });

  describe("updateJourneyDraftSchema", () => {
    it("validates partial updates", () => {
      const result = validateUpdateJourneyDraft({
        name: "Updated Name",
        description: "New desc",
      });
      expect(result.name).toBe("Updated Name");
      expect(result.description).toBe("New desc");
    });

    it("rejects empty name update", () => {
      expect(() => validateUpdateJourneyDraft({ name: "" })).toThrowError(ValidationError);
      expect(() => validateUpdateJourneyDraft({ name: "   " })).toThrowError(ValidationError);
    });
  });

  describe("journeyActionSchema", () => {
    it("validates email action with immediate and delayed timing", () => {
      const imm = journeyActionSchema.parse({
        id: "act-1",
        kind: "email",
        timing: "immediate",
        templateId: "tmpl-100",
      });
      expect(imm.kind).toBe("email");
      expect(imm.timing).toBe("immediate");

      const delayed = journeyActionSchema.parse({
        id: "act-2",
        kind: "email",
        timing: { amount: 2, unit: "days" },
        templateId: null,
      });
      expect(delayed.kind).toBe("email");
    });

    it("validates task action", () => {
      const task = journeyActionSchema.parse({
        id: "act-task",
        kind: "task",
        subject: "Follow up with prospect",
        dueOffsetDays: 3,
        priority: "High",
        timing: "immediate",
      });
      expect(task.kind).toBe("task");
      if (task.kind === "task") {
        expect(task.subject).toBe("Follow up with prospect");
        expect(task.priority).toBe("High");
      }
    });

    it("validates call action", () => {
      const call = journeyActionSchema.parse({
        id: "act-call",
        kind: "call",
        subject: "Introductory Discovery Call",
        callType: "Outbound",
        timing: "immediate",
      });
      expect(call.kind).toBe("call");
      if (call.kind === "call") {
        expect(call.callType).toBe("Outbound");
      }
    });

    it("validates field_update action", () => {
      const update = journeyActionSchema.parse({
        id: "act-update",
        kind: "field_update",
        field: "Lead_Status",
        value: "Contacted",
        timing: "immediate",
      });
      expect(update.kind).toBe("field_update");
      if (update.kind === "field_update") {
        expect(update.field).toBe("Lead_Status");
        expect(update.value).toBe("Contacted");
      }
    });

    it("validates notify_user action", () => {
      const notify = journeyActionSchema.parse({
        id: "act-notify",
        kind: "notify_user",
        userRef: "user-123",
        message: "A new lead entered the qualification stage",
        timing: "immediate",
      });
      expect(notify.kind).toBe("notify_user");
      if (notify.kind === "notify_user") {
        expect(notify.userRef).toBe("user-123");
      }
    });
  });

  describe("journeyDeadlineSchema", () => {
    it("validates positive amounts and units", () => {
      const dl = journeyDeadlineSchema.parse({ amount: 5, unit: "hours" });
      expect(dl.amount).toBe(5);
      expect(dl.unit).toBe("hours");
    });

    it("rejects non-positive amounts or invalid units", () => {
      expect(() => journeyDeadlineSchema.parse({ amount: 0, unit: "days" })).toThrow();
      expect(() => journeyDeadlineSchema.parse({ amount: -1, unit: "days" })).toThrow();
      expect(() => journeyDeadlineSchema.parse({ amount: 5, unit: "weeks" })).toThrow();
    });
  });

  describe("journeyTriggerSchema", () => {
    it("accepts record_created and record_updated", () => {
      expect(journeyTriggerSchema.parse("record_created")).toBe("record_created");
      expect(journeyTriggerSchema.parse("record_updated")).toBe("record_updated");
      expect(journeyTriggerSchema.parse({ kind: "record_created" })).toEqual({
        kind: "record_created",
      });
    });

    it("accepts deadline_missed", () => {
      expect(journeyTriggerSchema.parse("deadline_missed")).toBe("deadline_missed");
    });

    it("accepts webform_submitted with formId", () => {
      const trigger = journeyTriggerSchema.parse({
        kind: "webform_submitted",
        formId: "wf-1",
      });
      expect(trigger).toEqual({ kind: "webform_submitted", formId: "wf-1" });
    });

    it("accepts date_reached with field and offset", () => {
      const trigger = journeyTriggerSchema.parse({
        kind: "date_reached",
        field: "Closing_Date",
        offset: { amount: -2, unit: "days" },
      });
      expect(trigger).toEqual({
        kind: "date_reached",
        field: "Closing_Date",
        offset: { amount: -2, unit: "days" },
      });
    });
  });

  describe("validateJourneyForPublish", () => {
    it("rejects empty states", () => {
      expect(() => validateJourneyForPublish([], [])).toThrowError(ValidationError);
    });

    it("rejects when no state is marked as start state", () => {
      const states = [
        { id: "s1", name: "State 1", actions: [] },
        { id: "s2", name: "State 2", actions: [] },
      ];
      try {
        validateJourneyForPublish(states, []);
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fieldErrors.startState).toBeDefined();
      }
    });

    it("rejects when more than one state is marked as start state", () => {
      const states = [
        { id: "s1", name: "State 1", isStart: true, actions: [] },
        { id: "s2", name: "State 2", isStart: true, actions: [] },
      ];
      try {
        validateJourneyForPublish(states, []);
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fieldErrors.startState).toBeDefined();
      }
    });

    it("rejects transitions pointing to or from non-existent states", () => {
      const states = [{ id: "s1", name: "Start", isStart: true, actions: [] }];
      const transitions = [
        {
          id: "t1",
          from: "s1",
          to: "nonexistent",
          trigger: "record_created" as const,
          actions: [],
        },
        {
          id: "t2",
          from: "ghost",
          to: "s1",
          trigger: "record_created" as const,
          actions: [],
        },
      ];
      try {
        validateJourneyForPublish(states, transitions);
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fieldErrors["transitions[0].to"]).toBeDefined();
        expect(ve.fieldErrors["transitions[1].from"]).toBeDefined();
      }
    });

    it("rejects unreachable non-start states", () => {
      const states = [
        { id: "s1", name: "Start State", isStart: true, actions: [] },
        { id: "s2", name: "Connected State", actions: [] },
        { id: "s3", name: "Orphan State", actions: [] },
      ];
      const transitions = [
        {
          id: "t1",
          from: "s1",
          to: "s2",
          trigger: "record_created" as const,
          actions: [],
        },
      ];
      try {
        validateJourneyForPublish(states, transitions);
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fieldErrors["states[s3]"]).toBeDefined();
      }
    });

    it("accepts valid journey with exactly one start state and fully reachable states", () => {
      const states = [
        { id: "s1", name: "Entry", isStart: true, actions: [] },
        { id: "s2", name: "Nurture", actions: [] },
        { id: "s3", name: "Qualified", actions: [] },
      ];
      const transitions = [
        {
          id: "t1",
          from: "s1",
          to: "s2",
          trigger: "record_created" as const,
          actions: [],
        },
        {
          id: "t2",
          from: "s2",
          to: "s3",
          trigger: "record_updated" as const,
          actions: [],
        },
      ];
      expect(() => validateJourneyForPublish(states, transitions)).not.toThrow();
    });
  });
});
