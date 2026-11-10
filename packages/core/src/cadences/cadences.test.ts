import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import {
  cadenceCallStepSchema,
  cadenceEmailStepSchema,
  cadenceExitRuleSchema,
  cadenceStepDelaySchema,
  cadenceTaskStepSchema,
} from "./types";
import {
  validateCreateCadence,
  validateStepsForPublish,
  validateUpdateCadenceDraft,
} from "./validation";

describe("Cadence Schemas and Validation", () => {
  describe("createCadenceSchema", () => {
    it("accepts valid input with default manual audience", () => {
      const input = {
        name: "Welcome Cadence",
        module: "Leads",
      };
      const result = validateCreateCadence(input);
      expect(result.name).toBe("Welcome Cadence");
      expect(result.module).toBe("Leads");
      expect(result.audience).toEqual({ kind: "manual" });
      expect(result.description).toBe("");
    });

    it("accepts custom view audience", () => {
      const input = {
        name: "Deals Follow-up",
        module: "Deals",
        description: "Follow up on deals in closing stage",
        audience: {
          kind: "custom_view",
          viewId: "view-123",
          enrollNewMatches: true,
        },
      };
      const result = validateCreateCadence(input);
      expect(result.audience).toEqual({
        kind: "custom_view",
        viewId: "view-123",
        enrollNewMatches: true,
      });
    });

    it("rejects empty or whitespace-only name", () => {
      expect(() => validateCreateCadence({ name: "   ", module: "Leads" })).toThrowError(
        ValidationError,
      );
      expect(() => validateCreateCadence({ name: "", module: "Contacts" })).toThrowError(
        ValidationError,
      );
    });

    it("rejects unsupported modules (Quotes, Vendors, Cases, etc.)", () => {
      expect(() => validateCreateCadence({ name: "Q", module: "Quotes" })).toThrowError(
        ValidationError,
      );
      expect(() => validateCreateCadence({ name: "V", module: "Vendors" })).toThrowError(
        ValidationError,
      );
      expect(() => validateCreateCadence({ name: "C", module: "Cases" })).toThrowError(
        ValidationError,
      );
    });

    it("supports all 4 authorized modules", () => {
      for (const mod of ["Leads", "Contacts", "Accounts", "Deals"] as const) {
        const res = validateCreateCadence({ name: `Test ${mod}`, module: mod });
        expect(res.module).toBe(mod);
      }
    });
  });

  describe("updateCadenceDraftSchema", () => {
    it("validates partial updates", () => {
      const res = validateUpdateCadenceDraft({
        name: "New Name",
        description: "Updated description",
      });
      expect(res.name).toBe("New Name");
      expect(res.description).toBe("Updated description");
    });

    it("rejects empty name if provided", () => {
      expect(() => validateUpdateCadenceDraft({ name: "" })).toThrowError(ValidationError);
    });
  });

  describe("Step schemas", () => {
    it("validates delay units and non-negative amounts", () => {
      expect(cadenceStepDelaySchema.safeParse({ amount: 0, unit: "minutes" }).success).toBe(true);
      expect(cadenceStepDelaySchema.safeParse({ amount: 5, unit: "hours" }).success).toBe(true);
      expect(cadenceStepDelaySchema.safeParse({ amount: 2, unit: "days" }).success).toBe(true);
      expect(cadenceStepDelaySchema.safeParse({ amount: -1, unit: "days" }).success).toBe(false);
      expect(cadenceStepDelaySchema.safeParse({ amount: 1, unit: "months" }).success).toBe(false);
    });

    it("validates email step", () => {
      const email = {
        id: "step-1",
        kind: "email",
        delay: { amount: 1, unit: "days" },
        templateId: "tpl-456",
        name: "Intro Email",
      };
      expect(cadenceEmailStepSchema.safeParse(email).success).toBe(true);
    });

    it("validates task step with default priority and due offset", () => {
      const task = {
        id: "step-2",
        kind: "task",
        delay: { amount: 2, unit: "days" },
        subject: "Call customer",
      };
      const parsed = cadenceTaskStepSchema.parse(task);
      expect(parsed.dueOffsetDays).toBe(0);
      expect(parsed.priority).toBe("Normal");
    });

    it("validates call step with default call type", () => {
      const call = {
        id: "step-3",
        kind: "call",
        delay: { amount: 3, unit: "hours" },
        subject: "Discovery Call",
      };
      const parsed = cadenceCallStepSchema.parse(call);
      expect(parsed.callType).toBe("Outbound");
    });
  });

  describe("Exit rule schema", () => {
    it("validates on_reply and reply exit rules", () => {
      expect(cadenceExitRuleSchema.safeParse({ id: "r1", kind: "on_reply" }).success).toBe(true);
      expect(cadenceExitRuleSchema.safeParse({ id: "r2", kind: "reply" }).success).toBe(true);
    });

    it("validates meeting_booked exit rule", () => {
      expect(cadenceExitRuleSchema.safeParse({ id: "r3", kind: "meeting_booked" }).success).toBe(
        true,
      );
    });

    it("validates field_condition exit rule with ADR 0013 condition", () => {
      const rule = {
        id: "r4",
        kind: "field_condition",
        condition: {
          kind: "criteria",
          criteria: {
            field: "Lead_Status",
            comparator: "equal",
            value: "Contacted",
          },
        },
      };
      expect(cadenceExitRuleSchema.safeParse(rule).success).toBe(true);
    });
  });

  describe("validateStepsForPublish", () => {
    it("throws if steps array is empty", () => {
      expect(() => validateStepsForPublish([])).toThrowError(ValidationError);
    });

    it("passes when valid steps are provided", () => {
      expect(() =>
        validateStepsForPublish([
          {
            id: "step-1",
            kind: "email",
            delay: { amount: 0, unit: "minutes" },
            templateId: "tpl-1",
          },
        ]),
      ).not.toThrow();
    });
  });
});
