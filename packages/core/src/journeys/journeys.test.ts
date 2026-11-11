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

  describe("delays calculation (computeDueAt)", () => {
    it("handles immediate timing", async () => {
      const { computeDueAt } = await import("./delays");
      const now = new Date("2026-11-10T12:00:00Z");
      expect(computeDueAt(now, "immediate").toISOString()).toBe(now.toISOString());
      expect(computeDueAt(now, { type: "immediate" }).toISOString()).toBe(now.toISOString());
    });

    it("handles minutes, hours, days delays", async () => {
      const { computeDueAt } = await import("./delays");
      const now = new Date("2026-11-10T12:00:00Z");
      const in15Min = computeDueAt(now, { amount: 15, unit: "minutes" });
      expect(in15Min.toISOString()).toBe("2026-11-10T12:15:00.000Z");

      const in2Hours = computeDueAt(now, { amount: 2, unit: "hours" });
      expect(in2Hours.toISOString()).toBe("2026-11-10T14:00:00.000Z");

      const in3Days = computeDueAt(now, { amount: 3, unit: "days" });
      expect(in3Days.toISOString()).toBe("2026-11-13T12:00:00.000Z");
    });
  });

  describe("transition criteria evaluation (pass/fail)", () => {
    it("evaluates criteria pass and fail correctly", async () => {
      const { evaluateJourneyCriteria } = await import("./worker");

      const recordPassing = {
        Rating: "Hot",
        Annual_Revenue: 100000,
        City: "Istanbul",
      };

      const recordFailing = {
        Rating: "Cold",
        Annual_Revenue: 20000,
        City: "Ankara",
      };

      const simpleCriteria = {
        field: "Rating",
        comparator: "equal" as const,
        value: "Hot",
      };

      expect(evaluateJourneyCriteria(recordPassing, simpleCriteria)).toBe(true);
      expect(evaluateJourneyCriteria(recordFailing, simpleCriteria)).toBe(false);

      const complexCriteria = {
        groupOperator: "and" as const,
        group: [
          { field: "Rating", comparator: "equal" as const, value: "Hot" },
          { field: "Annual_Revenue", comparator: "greater_equal" as const, value: 50000 },
        ],
      };

      expect(evaluateJourneyCriteria(recordPassing, complexCriteria)).toBe(true);
      expect(evaluateJourneyCriteria(recordFailing, complexCriteria)).toBe(false);

      const conditionWrapped = {
        kind: "criteria" as const,
        criteria: simpleCriteria,
      };
      expect(evaluateJourneyCriteria(recordPassing, conditionWrapped)).toBe(true);
      expect(evaluateJourneyCriteria(recordFailing, conditionWrapped)).toBe(false);

      expect(evaluateJourneyCriteria(recordPassing, { kind: "all_records" })).toBe(true);
      expect(evaluateJourneyCriteria(recordPassing, null)).toBe(true);
    });
  });

  describe("all triggers schema and parsing", () => {
    it("parses all required triggers: record_created, record_updated, webform_submitted, date_reached, deadline_missed", () => {
      expect(journeyTriggerSchema.parse("record_created")).toBe("record_created");
      expect(journeyTriggerSchema.parse({ kind: "record_created" })).toEqual({
        kind: "record_created",
      });

      expect(journeyTriggerSchema.parse("record_updated")).toBe("record_updated");
      expect(journeyTriggerSchema.parse({ kind: "record_updated" })).toEqual({
        kind: "record_updated",
      });

      expect(journeyTriggerSchema.parse({ kind: "webform_submitted", formId: "form-abc" })).toEqual(
        {
          kind: "webform_submitted",
          formId: "form-abc",
        },
      );

      expect(
        journeyTriggerSchema.parse({
          kind: "date_reached",
          field: "Closing_Date",
          offset: { amount: 2, unit: "days" },
        }),
      ).toEqual({
        kind: "date_reached",
        field: "Closing_Date",
        offset: { amount: 2, unit: "days" },
      });

      expect(journeyTriggerSchema.parse("deadline_missed")).toBe("deadline_missed");
      expect(journeyTriggerSchema.parse({ kind: "deadline_missed" })).toEqual({
        kind: "deadline_missed",
      });
    });
  });
});
