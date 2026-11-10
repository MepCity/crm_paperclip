import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import type { RecordService } from "../records";
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

  describe("Delays computation", () => {
    const base = new Date("2026-11-10T10:00:00.000Z");

    it("computes 0 delay", async () => {
      const { computeDueAt } = await import("./delays");
      expect(computeDueAt(base, { amount: 0, unit: "minutes" }).getTime()).toBe(base.getTime());
    });

    it("computes minutes delay", async () => {
      const { computeDueAt } = await import("./delays");
      const due = computeDueAt(base, { amount: 30, unit: "minutes" });
      expect(due.toISOString()).toBe("2026-11-10T10:30:00.000Z");
    });

    it("computes hours delay", async () => {
      const { computeDueAt } = await import("./delays");
      const due = computeDueAt(base, { amount: 5, unit: "hours" });
      expect(due.toISOString()).toBe("2026-11-10T15:00:00.000Z");
    });

    it("computes days delay in org timezone", async () => {
      const { computeDueAt } = await import("./delays");
      const due = computeDueAt(base, { amount: 2, unit: "days" }, "Europe/Istanbul");
      expect(due.toISOString()).toBe("2026-11-12T10:00:00.000Z");
    });
  });

  describe("Exit rules evaluation", () => {
    it("matches field_condition exit rule", async () => {
      const { evaluateExitRules } = await import("./exit-rules");
      const matched = await evaluateExitRules(
        [
          {
            id: "exit-cond",
            kind: "field_condition",
            condition: {
              kind: "criteria",
              criteria: {
                field: "Lead_Status",
                comparator: "equal",
                value: "Qualified",
              },
            },
          },
        ],
        {
          record: {
            id: "lead-1",
            fields: { Lead_Status: "Qualified" },
          },
          orgId: "org-1",
          recordModule: "Leads",
          recordId: "lead-1",
          enrollmentCreatedAt: new Date("2026-11-10T00:00:00.000Z"),
        },
      );
      expect(matched?.id).toBe("exit-cond");
    });

    it("does not match field_condition if condition does not meet", async () => {
      const { evaluateExitRules } = await import("./exit-rules");
      const matched = await evaluateExitRules(
        [
          {
            id: "exit-cond",
            kind: "field_condition",
            condition: {
              kind: "criteria",
              criteria: {
                field: "Lead_Status",
                comparator: "equal",
                value: "Qualified",
              },
            },
          },
        ],
        {
          record: {
            id: "lead-1",
            fields: { Lead_Status: "Attempted to Contact" },
          },
          orgId: "org-1",
          recordModule: "Leads",
          recordId: "lead-1",
          enrollmentCreatedAt: new Date("2026-11-10T00:00:00.000Z"),
        },
      );
      expect(matched).toBeNull();
    });

    it("matches reply exit rule when matching incoming message exists", async () => {
      const { evaluateExitRules } = await import("./exit-rules");
      const fakeMailRepo = {
        read: async () => ({
          mailboxes: [],
          threads: [],
          messages: [
            {
              organizationId: "org-1",
              id: "msg-reply",
              mailboxId: "mb-1",
              threadId: "th-1",
              providerMessageKey: "pm-1",
              messageIdHeader: "<reply@prospect.com>",
              inReplyTo: "<cadence@example.com>",
              references: [],
              subject: "Re: Quick question",
              from: [{ address: "lead@prospect.com" }],
              to: [{ address: "rep@example.com" }],
              cc: [],
              bcc: [],
              sentAt: "2026-11-10T12:00:00.000Z",
              receivedAt: "2026-11-10T12:05:00.000Z",
              folder: "inbox" as const,
              summary: "Yes, I am interested.",
              bodyRef: null,
              sharedByOwner: true,
            },
          ],
          attachments: [],
          links: [
            {
              organizationId: "org-1",
              messageId: "msg-reply",
              module: "leads" as const,
              recordId: "lead-1",
              source: "auto" as const,
              ambiguous: false,
            },
          ],
          outbox: [],
        }),
        createMailbox: async () => {
          throw new Error("unimplemented");
        },
      };

      const matched = await evaluateExitRules([{ id: "exit-reply", kind: "reply" }], {
        record: {
          id: "lead-1",
          fields: { Email: "lead@prospect.com" },
        },
        orgId: "org-1",
        recordModule: "Leads",
        recordId: "lead-1",
        enrollmentCreatedAt: new Date("2026-11-10T10:00:00.000Z"),
        mailRepository: fakeMailRepo,
      });

      expect(matched?.id).toBe("exit-reply");
    });

    it("matches meeting_booked exit rule when meeting is scheduled", async () => {
      const { evaluateExitRules } = await import("./exit-rules");
      const fakeRecordService = {
        list: async (module: string) => {
          if (module === "Events") {
            return {
              records: [
                {
                  id: "ev-1",
                  fields: {
                    Subject: "Intro Call",
                    Who_Id: { module: "Leads", id: "lead-1" },
                  },
                },
              ],
            };
          }
          return { records: [], total: 0 };
        },
      } as unknown as Pick<RecordService, "list">;

      const matched = await evaluateExitRules([{ id: "exit-meeting", kind: "meeting_booked" }], {
        record: {
          id: "lead-1",
          fields: {},
        },
        orgId: "org-1",
        recordModule: "Leads",
        recordId: "lead-1",
        enrollmentCreatedAt: new Date("2026-11-10T10:00:00.000Z"),
        recordService: fakeRecordService,
      });

      expect(matched?.id).toBe("exit-meeting");
    });
  });

  describe("Enrollment schemas", () => {
    it("validates single record enrollment input", async () => {
      const { enrollRecordSchema } = await import("./types");
      const valid = enrollRecordSchema.safeParse({
        cadenceId: "018f3a2b-1111-7000-8000-000000000001",
        recordModule: "Leads",
        recordId: "rec-123",
      });
      expect(valid.success).toBe(true);

      const invalidModule = enrollRecordSchema.safeParse({
        cadenceId: "018f3a2b-1111-7000-8000-000000000001",
        recordModule: "Vendors",
        recordId: "rec-123",
      });
      expect(invalidModule.success).toBe(false);
    });

    it("validates mass enrollment input", async () => {
      const { enrollRecordsSchema } = await import("./types");
      const valid = enrollRecordsSchema.safeParse({
        cadenceId: "018f3a2b-1111-7000-8000-000000000001",
        recordModule: "Contacts",
        recordIds: ["c-1", "c-2", "c-3"],
      });
      expect(valid.success).toBe(true);

      const emptyIds = enrollRecordsSchema.safeParse({
        cadenceId: "018f3a2b-1111-7000-8000-000000000001",
        recordModule: "Contacts",
        recordIds: [],
      });
      expect(emptyIds.success).toBe(false);
    });
  });

  describe("Job catalog and definitions (ADR 0019 §6, ADR 0013 §3)", () => {
    it("creates cadence job catalog and validates payloads", async () => {
      const {
        createCadenceJobCatalog,
        cadenceStepJobDefinition,
        cadenceSweepJobDefinition,
        CADENCE_STEP_JOB_KIND,
        CADENCE_SWEEP_JOB_KIND,
      } = await import("./worker");

      expect(cadenceStepJobDefinition.kind).toBe(CADENCE_STEP_JOB_KIND);
      expect(cadenceStepJobDefinition.retrySafe).toBe(false);
      expect(cadenceSweepJobDefinition.kind).toBe(CADENCE_SWEEP_JOB_KIND);
      expect(cadenceSweepJobDefinition.retrySafe).toBe(true);

      const catalog = createCadenceJobCatalog();
      expect(catalog.definition(CADENCE_STEP_JOB_KIND, 1)).toBeDefined();
      expect(catalog.definition(CADENCE_SWEEP_JOB_KIND, 1)).toBeDefined();

      // Valid step payload
      const stepPayload = catalog.validate(CADENCE_STEP_JOB_KIND, 1, {
        enrollmentId: "enr-123",
        stepId: "step-456",
        cadenceGeneration: "1",
      });
      expect(stepPayload).toEqual({
        enrollmentId: "enr-123",
        stepId: "step-456",
        cadenceGeneration: "1",
      });

      // Valid sweep payload
      const sweepPayload = catalog.validate(CADENCE_SWEEP_JOB_KIND, 1, {});
      expect(sweepPayload).toEqual({});

      // Rejects invalid payload
      expect(() =>
        catalog.validate(CADENCE_STEP_JOB_KIND, 1, {
          enrollmentId: "enr-123",
          // missing stepId and cadenceGeneration
        }),
      ).toThrow();
    });
  });
});
