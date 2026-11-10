import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import type { AccessSnapshot } from "../access/types";
import { getDb } from "../database";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { fence, InMemoryJobQueue } from "../jobs";
import type { MailRepository } from "../mail";
import type { RecordService } from "../records";
import { createFixtureRecordService } from "../records/fixture";
import { createTestOrganization } from "../testing";
import { createCadenceService } from "./service";
import type { CadenceExitRule, CadenceStep } from "./types";
import {
  CADENCE_STEP_JOB_KIND,
  CADENCE_STEP_JOB_VERSION,
  createCadenceJobCatalog,
  createCadenceStepHandler,
  executeCadenceStep,
  sweepAudienceCustomViews,
  sweepDueEnrollments,
} from "./worker";

describe("cadences backend integration", () => {
  it("manages full lifecycle, unique name, filters, and publish/supersede immutability", async () => {
    const { ctx: ctxA } = await createTestOrganization();
    const { ctx: ctxB } = await createTestOrganization();
    const service = createCadenceService();
    const db = getDb();

    // 1. Create a Cadence for Leads
    const cadence = await service.createCadence(ctxA, {
      name: "Outreach Cadence",
      module: "Leads",
      description: "Initial prospect sequence",
      audience: { kind: "manual" },
    });

    expect(cadence.name).toBe("Outreach Cadence");
    expect(cadence.module).toBe("Leads");
    expect(cadence.status).toBe("draft");
    expect(cadence.draftVersion).not.toBeNull();
    expect(cadence.draftVersion?.number).toBe(1);
    expect(cadence.draftVersion?.state).toBe("draft");
    expect(cadence.draftVersion?.steps).toHaveLength(0);
    expect(cadence.publishedVersion).toBeNull();
    expect(cadence.recordCount).toBe(0);

    // 2. Case-insensitive unique name within same organization
    await expect(
      service.createCadence(ctxA, {
        name: "outreach cadence",
        module: "Contacts",
      }),
    ).rejects.toThrowError(ConflictError);

    // Different organization can use the same name
    const cadenceB = await service.createCadence(ctxB, {
      name: "Outreach Cadence",
      module: "Contacts",
    });
    expect(cadenceB.id).not.toBe(cadence.id);

    // 3. Update draft version: add 3 steps and exit rules
    const steps: CadenceStep[] = [
      {
        id: "step-1",
        kind: "email",
        delay: { amount: 0, unit: "minutes" },
        templateId: "tpl-welcome",
        name: "Welcome Email",
      },
      {
        id: "step-2",
        kind: "task",
        delay: { amount: 1, unit: "days" },
        subject: "Review Lead Profile",
        priority: "High",
        dueOffsetDays: 1,
      },
      {
        id: "step-3",
        kind: "call",
        delay: { amount: 3, unit: "days" },
        subject: "Follow-up Phone Call",
        callType: "Outbound",
      },
    ];

    const exitRules: CadenceExitRule[] = [
      { id: "exit-1", kind: "reply" },
      { id: "exit-2", kind: "meeting_booked" },
    ];

    const updated = await service.updateCadenceDraft(ctxA, cadence.id, {
      description: "Updated sequence description",
      steps,
      exitRules,
    });

    expect(updated.draftVersion?.steps).toHaveLength(3);
    expect(updated.draftVersion?.exitRules).toHaveLength(2);
    expect(updated.description).toBe("Updated sequence description");

    // 4. Publish version 1
    const published = await service.publish(ctxA, cadence.id);
    expect(published.status).toBe("active");
    expect(published.draftVersion).toBeNull();
    expect(published.publishedVersion).not.toBeNull();
    expect(published.publishedVersion?.number).toBe(1);
    expect(published.publishedVersion?.state).toBe("published");
    expect(published.publishedVersion?.publishedBy).toBe(ctxA.userId);
    expect(published.publishedVersion?.steps).toHaveLength(3);

    const v1Id = published.publishedVersion?.id;
    if (!v1Id) throw new Error("Expected published version ID");

    // Verify v1 in database
    const [v1Row] = await db
      .select()
      .from(schema.cadenceVersions)
      .where(
        and(
          eq(schema.cadenceVersions.organizationId, ctxA.orgId),
          eq(schema.cadenceVersions.id, v1Id),
        ),
      );
    expect(v1Row).toBeDefined();
    if (!v1Row) throw new Error("Expected v1Row");
    expect(v1Row.state).toBe("published");
    const v1OriginalSteps = v1Row.steps;

    // 5. Immutability: Editing after publish opens a NEW draft (version 2)
    // The published version row (v1) is NEVER updated
    const draft2Cadence = await service.updateCadenceDraft(ctxA, cadence.id, {
      steps: [
        ...steps,
        {
          id: "step-4",
          kind: "call",
          delay: { amount: 5, unit: "days" },
          subject: "Final Check-in Call",
          callType: "Outbound",
        },
      ],
    });

    expect(draft2Cadence.draftVersion).not.toBeNull();
    expect(draft2Cadence.draftVersion?.number).toBe(2);
    expect(draft2Cadence.draftVersion?.state).toBe("draft");
    expect(draft2Cadence.publishedVersion?.id).toBe(v1Id);

    // Assert v1 row in DB was NOT changed
    const [v1RowAfterDraft2] = await db
      .select()
      .from(schema.cadenceVersions)
      .where(
        and(
          eq(schema.cadenceVersions.organizationId, ctxA.orgId),
          eq(schema.cadenceVersions.id, v1Id),
        ),
      );
    expect(v1RowAfterDraft2).toBeDefined();
    if (!v1RowAfterDraft2) throw new Error("Expected v1RowAfterDraft2");
    expect(v1RowAfterDraft2.state).toBe("published");
    expect(v1RowAfterDraft2.steps).toEqual(v1OriginalSteps);

    // 6. Publish version 2:
    // v1 is atomically marked superseded; v2 becomes published
    const republished = await service.publish(ctxA, cadence.id);
    expect(republished.draftVersion).toBeNull();
    expect(republished.publishedVersion?.number).toBe(2);
    expect(republished.publishedVersion?.state).toBe("published");

    // Verify v1 is now superseded and its steps were NEVER updated
    const [v1RowFinal] = await db
      .select()
      .from(schema.cadenceVersions)
      .where(
        and(
          eq(schema.cadenceVersions.organizationId, ctxA.orgId),
          eq(schema.cadenceVersions.id, v1Id),
        ),
      );
    expect(v1RowFinal).toBeDefined();
    if (!v1RowFinal) throw new Error("Expected v1RowFinal");
    expect(v1RowFinal.state).toBe("superseded");
    expect(v1RowFinal.steps).toEqual(v1OriginalSteps);

    // 7. Activate / Deactivate
    const deactivated = await service.deactivateCadence(ctxA, cadence.id);
    expect(deactivated.status).toBe("inactive");

    const reactivated = await service.activateCadence(ctxA, cadence.id);
    expect(reactivated.status).toBe("active");

    // 8. Filters & Search in listCadences
    // Create a second cadence in Org A for Deals
    await service.createCadence(ctxA, {
      name: "Deals Closing Push",
      module: "Deals",
      audience: { kind: "manual" },
    });

    const allList = await service.listCadences(ctxA);
    expect(allList).toHaveLength(2);

    const searchFiltered = await service.listCadences(ctxA, { search: "Outreach" });
    expect(searchFiltered).toHaveLength(1);
    expect(searchFiltered[0]?.name).toBe("Outreach Cadence");

    const moduleFiltered = await service.listCadences(ctxA, { module: "Deals" });
    expect(moduleFiltered).toHaveLength(1);
    expect(moduleFiltered[0]?.module).toBe("Deals");

    const statusFiltered = await service.listCadences(ctxA, { status: "active" });
    expect(statusFiltered).toHaveLength(1);
    expect(statusFiltered[0]?.status).toBe("active");

    // 9. Delete Cadence
    await service.deleteCadence(ctxA, cadence.id);
    await expect(service.getCadence(ctxA, cadence.id)).rejects.toThrowError(NotFoundError);

    // Check versions were cascade deleted
    const leftoverVersions = await db
      .select()
      .from(schema.cadenceVersions)
      .where(
        and(
          eq(schema.cadenceVersions.organizationId, ctxA.orgId),
          eq(schema.cadenceVersions.cadenceId, cadence.id),
        ),
      );
    expect(leftoverVersions).toHaveLength(0);
  });

  it("enforces tenant isolation: Org B cannot see or manipulate Org A cadences", async () => {
    const { ctx: ctxA } = await createTestOrganization();
    const { ctx: ctxB } = await createTestOrganization();
    const service = createCadenceService();

    const cadenceA = await service.createCadence(ctxA, {
      name: "Secret Sequence A",
      module: "Contacts",
    });

    // Org B cannot fetch Org A's cadence
    await expect(service.getCadence(ctxB, cadenceA.id)).rejects.toThrowError(NotFoundError);

    // Org B cannot update Org A's cadence
    await expect(
      service.updateCadenceDraft(ctxB, cadenceA.id, { description: "Hacked" }),
    ).rejects.toThrowError(NotFoundError);

    // Org B cannot publish Org A's cadence
    await expect(service.publishCadence(ctxB, cadenceA.id)).rejects.toThrowError(NotFoundError);

    // Org B cannot delete Org A's cadence
    await expect(service.deleteCadence(ctxB, cadenceA.id)).rejects.toThrowError(NotFoundError);

    // Org B list does not contain Org A's cadence
    const listB = await service.listCadences(ctxB);
    expect(listB.find((c) => c.id === cadenceA.id)).toBeUndefined();
  });

  it("escapes %, _, and \\ in list search (CTO item 1)", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();

    await service.createCadence(ctx, {
      name: "100% Guaranteed Close",
      module: "Deals",
    });
    await service.createCadence(ctx, {
      name: "Regular Sequence",
      module: "Deals",
    });

    // Searching for "%" should match only the literal "%"
    const percentMatches = await service.listCadences(ctx, { search: "%" });
    expect(percentMatches).toHaveLength(1);
    expect(percentMatches[0]?.name).toBe("100% Guaranteed Close");

    // Searching for "_" should not match regular names if not present
    const underscoreMatches = await service.listCadences(ctx, { search: "_" });
    expect(underscoreMatches).toHaveLength(0);
  });

  it("blocks cadence deletion when enrollments exist (CTO item 2)", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();

    const cadence = await service.createCadence(ctx, {
      name: "Enrollment Delete Test",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-1",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "Test Task",
          priority: "Normal",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    // Enroll a lead
    await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: "lead-del-1",
    });

    // Deleting cadence with enrollment throws ConflictError
    await expect(service.deleteCadence(ctx, cadence.id)).rejects.toThrowError(ConflictError);
  });

  it("handles enrollment lifecycle, unique non-final rule, pause, resume, unenroll and record deletion", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();

    const cadence = await service.createCadence(ctx, {
      name: "Lead Lifecycle Sequence",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "s1",
          kind: "task",
          delay: { amount: 1, unit: "hours" },
          subject: "Intro Task",
          priority: "Normal",
          dueOffsetDays: 0,
        },
        {
          id: "s2",
          kind: "call",
          delay: { amount: 2, unit: "days" },
          subject: "Follow-up Call",
          callType: "Outbound",
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    // 1. Enroll record
    const enrollment = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: "lead-lifecycle-1",
    });

    expect(enrollment.state).toBe("active");
    expect(enrollment.generation).toBe(1);
    expect(enrollment.nextStepId).toBe("s1");
    expect(enrollment.nextDueAt).not.toBeNull();

    // 2. Second enrollment for the same record while active fails (unique non-final)
    await expect(
      service.enrollRecord(ctx, {
        cadenceId: cadence.id,
        recordModule: "Leads",
        recordId: "lead-lifecycle-1",
      }),
    ).rejects.toThrowError(ConflictError);

    // 3. Pause enrollment (bumps generation)
    const paused = await service.pauseEnrollment(ctx, enrollment.id);
    expect(paused.state).toBe("paused");
    expect(paused.generation).toBe(2);

    // Pausing again fails
    await expect(service.pauseEnrollment(ctx, enrollment.id)).rejects.toThrowError(ConflictError);

    // Still cannot re-enroll while paused
    await expect(
      service.enrollRecord(ctx, {
        cadenceId: cadence.id,
        recordModule: "Leads",
        recordId: "lead-lifecycle-1",
      }),
    ).rejects.toThrowError(ConflictError);

    // 4. Resume enrollment (bumps generation)
    const resumed = await service.resumeEnrollment(ctx, enrollment.id);
    expect(resumed.state).toBe("active");
    expect(resumed.generation).toBe(3);

    // 5. Unenroll record (bumps generation)
    const exited = await service.unenrollRecord(ctx, enrollment.id, "customer_requested");
    expect(exited.state).toBe("exited");
    expect(exited.reason).toBe("customer_requested");
    expect(exited.generation).toBe(4);
    expect(exited.nextStepId).toBeNull();

    // 6. After unenroll (final state), re-enrollment is permitted (creates a new row)
    const reEnrolled = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: "lead-lifecycle-1",
    });
    expect(reEnrolled.id).not.toBe(enrollment.id);
    expect(reEnrolled.state).toBe("active");
    expect(reEnrolled.generation).toBe(1);

    // 7. Mass enrollment
    const massResult = await service.enrollRecords(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordIds: ["lead-lifecycle-1", "lead-mass-2", "lead-mass-3"],
    });
    // lead-lifecycle-1 was already active, so skippedCount: 1, enrolled: 2
    expect(massResult.skippedCount).toBe(1);
    expect(massResult.enrolled).toHaveLength(2);

    // 8. Record deletion exits active enrollments
    await service.handleRecordDeleted(ctx, "Leads", "lead-mass-2");
    const mass2Enrollments = await service.listEnrollments(ctx, {
      cadenceId: cadence.id,
      recordId: "lead-mass-2",
    });
    expect(mass2Enrollments[0]?.state).toBe("exited");
    expect(mass2Enrollments[0]?.reason).toBe("record_deleted");
  });

  it("executes due steps with task creation, actor lost access skip, and exit rule priority", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const lead = await records.create("Leads", {
      First_Name: "Alice",
      Last_Name: "Wonder",
      Company: "Acme",
      Email: "alice@example.com",
      Lead_Status: "Contacted",
    });

    const cadence = await service.createCadence(ctx, {
      name: "Step Execution Cadence",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-t1",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "Call Alice",
          priority: "High",
          dueOffsetDays: 1,
        },
        {
          id: "step-c2",
          kind: "call",
          delay: { amount: 1, unit: "days" },
          subject: "Follow up with Alice",
          callType: "Outbound",
        },
      ],
      exitRules: [
        {
          id: "exit-won",
          kind: "field_condition",
          condition: {
            kind: "criteria",
            criteria: {
              field: "Lead_Status",
              comparator: "equal",
              value: "Lost Lead",
            },
          },
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    const enrollment = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead.id,
    });

    // 1. Execute first step (task)
    const result1 = await executeCadenceStep(ctx, {
      enrollmentId: enrollment.id,
      stepId: "step-t1",
      generation: enrollment.generation,
      deps: { recordService: records },
    });

    expect(result1.status).toBe("completed");

    // Verify task record was created
    const createdTasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 10 });
    const cadenceTask = createdTasks.records.find((t) => t.fields.Subject === "Call Alice");
    expect(cadenceTask).toBeDefined();
    expect(cadenceTask?.fields.Who_Id).toMatchObject({ module: "Leads", id: lead.id });

    // Verify step run recorded
    const runs = await service.listStepRuns(ctx, enrollment.id);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.stepId).toBe("step-t1");
    expect(runs[0]?.outcome).toBe("completed");

    // Verify enrollment advanced to step-c2
    const currentEnrollment = await service.getEnrollment(ctx, enrollment.id);
    expect(currentEnrollment.nextStepId).toBe("step-c2");
    expect(currentEnrollment.nextDueAt).not.toBeNull();

    // 2. Test exit rule win: update lead to Lost Lead
    await records.update("Leads", lead.id, { Lead_Status: "Lost Lead" });

    // Attempt to execute step 2 -> Exit rule wins and exits enrollment before step is run!
    const result2 = await executeCadenceStep(ctx, {
      enrollmentId: enrollment.id,
      stepId: "step-c2",
      generation: currentEnrollment.generation,
      deps: { recordService: records },
    });

    expect(result2.status).toBe("exited");
    if (result2.status === "exited") {
      expect(result2.rule).toBe("field_condition");
    }

    const exitedEnrollment = await service.getEnrollment(ctx, enrollment.id);
    expect(exitedEnrollment.state).toBe("exited");
    expect(exitedEnrollment.reason).toBe("exit_rule:field_condition");

    // 3. Test actor_lost_access skip: create another lead & enrollment
    const lead2 = await records.create("Leads", {
      First_Name: "Bob",
      Last_Name: "Builder",
      Company: "BobCo",
      Lead_Status: "Contacted",
    });
    const enroll2 = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead2.id,
    });

    // Provide an access snapshot provider where user does not have task create permission
    const fakeSnapshotProvider = async () =>
      ({
        userId: ctx.userId,
        profileKind: "standard",
        permissions: {
          modules: { Tasks: { view: true, create: false, edit: false, delete: false } },
          admin: { modifyAllRecords: [], viewAllRecords: [] },
          tools: { enrollInCadence: ["Leads"] },
        },
        fieldAccess: new Map(),
        ownerLevels: new Map(),
        defaults: new Map(),
      }) as unknown as AccessSnapshot;

    const skipResult = await executeCadenceStep(ctx, {
      enrollmentId: enroll2.id,
      stepId: "step-t1",
      generation: enroll2.generation,
      deps: { recordService: records, accessSnapshotProvider: fakeSnapshotProvider },
    });

    expect(skipResult.status).toBe("skipped");
    if (skipResult.status === "skipped") {
      expect(skipResult.reason).toBe("actor_lost_access");
    }

    const runs2 = await service.listStepRuns(ctx, enroll2.id);
    expect(runs2[0]?.outcome).toBe("skipped");
    expect(runs2[0]?.outcomeReason).toBe("actor_lost_access");
  });

  describe("races with two transactions and idempotency (ADR 0019 §8)", () => {
    it("pause vs due step: pause wins and due step aborts", async () => {
      const { ctx } = await createTestOrganization();
      const service = createCadenceService();
      const records = createFixtureRecordService(ctx);

      const lead = await records.create("Leads", {
        First_Name: "Race1",
        Last_Name: "Pause",
        Company: "Races",
      });

      const cadence = await service.createCadence(ctx, {
        name: "Pause Race Cadence",
        module: "Leads",
      });
      await service.updateCadenceDraft(ctx, cadence.id, {
        steps: [
          {
            id: "step-pr",
            kind: "task",
            delay: { amount: 0, unit: "minutes" },
            subject: "Race Task",
            priority: "Normal",
            dueOffsetDays: 0,
          },
        ],
      });
      await service.publish(ctx, cadence.id);

      const enrollment = await service.enrollRecord(ctx, {
        cadenceId: cadence.id,
        recordModule: "Leads",
        recordId: lead.id,
      });

      // Transaction 1: Pause enrollment
      await service.pauseEnrollment(ctx, enrollment.id);

      // Transaction 2: Due step worker attempts to run with previous generation (or finds paused state)
      const res = await executeCadenceStep(ctx, {
        enrollmentId: enrollment.id,
        stepId: "step-pr",
        generation: 1, // original generation before pause
        deps: { recordService: records },
      });

      expect(res.status).toBe("aborted");
      // No task created
      const tasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 10 });
      expect(tasks.records.filter((t) => t.fields.Subject === "Race Task")).toHaveLength(0);
    });

    it("exit vs due step: exit wins and due step aborts", async () => {
      const { ctx } = await createTestOrganization();
      const service = createCadenceService();
      const records = createFixtureRecordService(ctx);

      const lead = await records.create("Leads", {
        First_Name: "Race2",
        Last_Name: "Exit",
        Company: "Races",
      });

      const cadence = await service.createCadence(ctx, {
        name: "Exit Race Cadence",
        module: "Leads",
      });
      await service.updateCadenceDraft(ctx, cadence.id, {
        steps: [
          {
            id: "step-ex",
            kind: "task",
            delay: { amount: 0, unit: "minutes" },
            subject: "Exit Race Task",
            priority: "Normal",
            dueOffsetDays: 0,
          },
        ],
      });
      await service.publish(ctx, cadence.id);

      const enrollment = await service.enrollRecord(ctx, {
        cadenceId: cadence.id,
        recordModule: "Leads",
        recordId: lead.id,
      });

      // Transaction 1: Unenroll record
      await service.unenrollRecord(ctx, enrollment.id);

      // Transaction 2: Worker attempts step
      const res = await executeCadenceStep(ctx, {
        enrollmentId: enrollment.id,
        stepId: "step-ex",
        generation: 1,
        deps: { recordService: records },
      });

      expect(res.status).toBe("aborted");
      const tasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 10 });
      expect(tasks.records.filter((t) => t.fields.Subject === "Exit Race Task")).toHaveLength(0);
    });

    it("republish vs due step: republish changing steps stops active enrollments", async () => {
      const { ctx } = await createTestOrganization();
      const service = createCadenceService();
      const records = createFixtureRecordService(ctx);

      const lead = await records.create("Leads", {
        First_Name: "Race3",
        Last_Name: "Republish",
        Company: "Races",
      });

      const cadence = await service.createCadence(ctx, {
        name: "Republish Race Cadence",
        module: "Leads",
      });
      await service.updateCadenceDraft(ctx, cadence.id, {
        steps: [
          {
            id: "step-orig",
            kind: "task",
            delay: { amount: 0, unit: "minutes" },
            subject: "Original Task",
            priority: "Normal",
            dueOffsetDays: 0,
          },
        ],
      });
      await service.publish(ctx, cadence.id);

      const enrollment = await service.enrollRecord(ctx, {
        cadenceId: cadence.id,
        recordModule: "Leads",
        recordId: lead.id,
      });

      // Transaction 1: Update draft with new steps and republish
      await service.updateCadenceDraft(ctx, cadence.id, {
        steps: [
          {
            id: "step-new",
            kind: "task",
            delay: { amount: 0, unit: "minutes" },
            subject: "New Modified Task",
            priority: "Normal",
            dueOffsetDays: 0,
          },
        ],
      });
      await service.publish(ctx, cadence.id);

      // Verify enrollment was stopped
      const stopped = await service.getEnrollment(ctx, enrollment.id);
      expect(stopped.state).toBe("stopped");
      expect(stopped.reason).toBe("republished_steps_changed");

      // Transaction 2: Worker tries step-orig with old generation
      const res = await executeCadenceStep(ctx, {
        enrollmentId: enrollment.id,
        stepId: "step-orig",
        generation: 1,
        deps: { recordService: records },
      });

      expect(res.status).toBe("aborted");
    });

    it("deactivate vs due step: deactivate halts scheduled actions", async () => {
      const { ctx } = await createTestOrganization();
      const service = createCadenceService();
      const records = createFixtureRecordService(ctx);

      const lead = await records.create("Leads", {
        First_Name: "Race4",
        Last_Name: "Deactivate",
        Company: "Races",
      });

      const cadence = await service.createCadence(ctx, {
        name: "Deactivate Race Cadence",
        module: "Leads",
      });
      await service.updateCadenceDraft(ctx, cadence.id, {
        steps: [
          {
            id: "step-deact",
            kind: "task",
            delay: { amount: 0, unit: "minutes" },
            subject: "Deactivate Race Task",
            priority: "Normal",
            dueOffsetDays: 0,
          },
        ],
      });
      await service.publish(ctx, cadence.id);

      const enrollment = await service.enrollRecord(ctx, {
        cadenceId: cadence.id,
        recordModule: "Leads",
        recordId: lead.id,
      });

      // Transaction 1: Deactivate cadence
      await service.deactivateCadence(ctx, cadence.id);

      // Transaction 2: Worker attempts step
      const res = await executeCadenceStep(ctx, {
        enrollmentId: enrollment.id,
        stepId: "step-deact",
        generation: enrollment.generation,
        deps: { recordService: records },
      });

      expect(res.status).toBe("aborted");
      if (res.status === "aborted") {
        expect(res.reason).toBe("generation_mismatch");
      }
    });

    it("idempotency: retrying a step twice creates exactly one effect", async () => {
      const { ctx } = await createTestOrganization();
      const service = createCadenceService();
      const records = createFixtureRecordService(ctx);

      const lead = await records.create("Leads", {
        First_Name: "Idempotent",
        Last_Name: "Test",
        Company: "IdempCo",
      });

      const cadence = await service.createCadence(ctx, {
        name: "Idempotency Cadence",
        module: "Leads",
      });
      await service.updateCadenceDraft(ctx, cadence.id, {
        steps: [
          {
            id: "step-idemp",
            kind: "task",
            delay: { amount: 0, unit: "minutes" },
            subject: "Idempotent Single Task",
            priority: "Normal",
            dueOffsetDays: 0,
          },
        ],
      });
      await service.publish(ctx, cadence.id);

      const enrollment = await service.enrollRecord(ctx, {
        cadenceId: cadence.id,
        recordModule: "Leads",
        recordId: lead.id,
      });

      // First execution -> success
      const res1 = await executeCadenceStep(ctx, {
        enrollmentId: enrollment.id,
        stepId: "step-idemp",
        generation: 1,
        deps: { recordService: records },
      });
      expect(res1.status).toBe("completed");

      // Second execution with same parameters -> aborted (already executed), no duplicate task
      const res2 = await executeCadenceStep(ctx, {
        enrollmentId: enrollment.id,
        stepId: "step-idemp",
        generation: 1,
        deps: { recordService: records },
      });
      expect(res2.status).toBe("aborted");

      const allTasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 10 });
      const matchingTasks = allTasks.records.filter(
        (t) => t.fields.Subject === "Idempotent Single Task",
      );
      expect(matchingTasks).toHaveLength(1);
    });
  });

  it("sweeps custom view audience and verifies viewId within org (CTO item 3)", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const views = await records.listViews("Leads");
    const defaultView = views.find((v) => v.isDefault);
    if (!defaultView) throw new Error("Expected default view");

    // 1. Cadence with existing default view
    const cadence = await service.createCadence(ctx, {
      name: "View Audience Cadence",
      module: "Leads",
      audience: {
        kind: "custom_view",
        viewId: defaultView.id,
        enrollNewMatches: true,
      },
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-v1",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "View Sweep Task",
          priority: "Normal",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    // Create a matching lead
    await records.create("Leads", {
      First_Name: "Sweep",
      Last_Name: "Target",
      Company: "SweepCo",
    });

    const sweepResult = await sweepAudienceCustomViews(ctx, { recordService: records });
    expect(sweepResult.enrolledCount).toBeGreaterThanOrEqual(1);

    // 2. Cadence with non-existent or foreign viewId -> safely skipped
    const invalidCadence = await service.createCadence(ctx, {
      name: "Invalid View Cadence",
      module: "Leads",
      audience: {
        kind: "custom_view",
        viewId: "non-existent-view-id",
        enrollNewMatches: true,
      },
    });
    await service.updateCadenceDraft(ctx, invalidCadence.id, {
      steps: [
        {
          id: "step-inv",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "Inv Task",
          priority: "Normal",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, invalidCadence.id);

    const sweepResult2 = await sweepAudienceCustomViews(ctx, { recordService: records });
    expect(sweepResult2.enrolledCount).toBe(0);
  });

  it("enforces cadence actor module boundary and action isolation", async () => {
    const { ctx } = await createTestOrganization();

    // Create record service with cadence actor bounded to "Leads"
    const cadenceActor = {
      kind: "cadence" as const,
      id: "cadence-123",
      versionId: "version-456",
      module: "Leads",
    };

    const recordService = createFixtureRecordService(ctx, { actor: cadenceActor });

    // 1. Reading / creating in permitted module works
    const lead = await recordService.create("Leads", {
      First_Name: "Bound",
      Last_Name: "Actor",
      Company: "BoundCo",
    });
    expect(lead.id).toBeDefined();

    // 2. Reading / creating in Tasks & Calls works (permitted activity targets)
    const task = await recordService.create("Tasks", {
      Subject: "Cadence Task",
      Status: "Not Started",
      Who_Id: { module: "Leads", id: lead.id },
    });
    expect(task.id).toBeDefined();

    // 3. Accessing another module (e.g. Deals, Contacts, Accounts) is forbidden
    await expect(recordService.get("Deals", "deal-1")).rejects.toThrowError(ForbiddenError);
    await expect(recordService.create("Contacts", { Last_Name: "Forbidden" })).rejects.toThrowError(
      ForbiddenError,
    );

    // 4. Cadence actor cannot delete, convert, or merge
    await expect(recordService.delete("Leads", [lead.id])).rejects.toThrowError(ForbiddenError);
    await expect(
      recordService.convertLead(lead.id, { account: { create: { Account_Name: "Acme" } } }),
    ).rejects.toThrowError(ForbiddenError);
  });

  it("executes due cadence steps under job fence via JobQueue (ADR 0019 §6, ADR 0013 §3)", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const lead = await records.create("Leads", {
      First_Name: "JobQueue",
      Last_Name: "Lead",
      Company: "FenceCo",
    });

    const cadence = await service.createCadence(ctx, {
      name: "Job Fence Cadence",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-jf1",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "Fenced Task",
          priority: "Normal",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    const enrollment = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead.id,
    });

    // Set up queue with cadence catalog
    const queue = new InMemoryJobQueue(createCadenceJobCatalog());

    // Sweep due enrollments into queue
    const enqueuedCount = await sweepDueEnrollments(ctx, {
      jobQueue: queue,
      deps: { recordService: records },
    });
    expect(enqueuedCount).toBe(1);

    // Worker claims job
    const [claimed] = await queue.claim({ workerId: "worker-cadence", limit: 10, leaseMs: 60000 });
    expect(claimed).toBeDefined();
    if (!claimed) throw new Error("Expected claimed job");

    // Acquire fence from claimed job
    const jobFence = fence(claimed);
    expect(jobFence.organizationId).toBe(ctx.orgId);

    // Create cadence step handler and verify isCurrent
    const handler = createCadenceStepHandler({ recordService: records, jobQueue: queue });
    const isCurrent = await handler.isCurrent({
      organizationId: ctx.orgId,
      job: claimed,
      fence: jobFence,
      checkpoint: async () => {},
    });
    expect(isCurrent).toBe(true);

    // Run handler under fence
    await handler.run({
      organizationId: ctx.orgId,
      job: claimed,
      fence: jobFence,
      checkpoint: async () => {
        const renewed = await queue.renew(jobFence, 60000);
        if (!renewed) throw new Error("Fence lost");
      },
    });

    // Succeed job
    const succeeded = await queue.succeed(jobFence);
    expect(succeeded).toBe(true);

    // Verify task created
    const createdTasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 10 });
    const task = createdTasks.records.find((t) => t.fields.Subject === "Fenced Task");
    expect(task).toBeDefined();

    // Verify enrollment completed
    const updatedEnrollment = await service.getEnrollment(ctx, enrollment.id);
    expect(updatedEnrollment.state).toBe("completed");

    // Verify step run recorded
    const runs = await service.listStepRuns(ctx, enrollment.id);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.stepId).toBe("step-jf1");
    expect(runs[0]?.outcome).toBe("completed");
  });

  it("validates and enforces job fence against tenant mismatch and lost lease", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const lead = await records.create("Leads", {
      First_Name: "Foreign",
      Last_Name: "Tenant",
      Company: "FenceTenantCo",
    });

    const cadence = await service.createCadence(ctx, {
      name: "Tenant Fence Cadence",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-tf1",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "Tenant Task",
          priority: "Normal",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    const enrollment = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead.id,
    });

    // 1. Foreign tenant fence -> aborted with fence_tenant_mismatch
    const resMismatched = await executeCadenceStep(ctx, {
      enrollmentId: enrollment.id,
      stepId: "step-tf1",
      generation: enrollment.generation,
      jobFence: {
        organizationId: "other-org-id",
        id: "job-1",
        lockedBy: "worker-1",
        leaseToken: "tok-1",
      },
      deps: { recordService: records },
    });
    expect(resMismatched.status).toBe("aborted");
    if (resMismatched.status === "aborted") {
      expect(resMismatched.reason).toBe("fence_tenant_mismatch");
    }

    // 2. Lost lease fence -> aborted with fence_lease_lost
    const queue = new InMemoryJobQueue(createCadenceJobCatalog());
    await queue.enqueue(
      { organizationId: ctx.orgId },
      {
        kind: CADENCE_STEP_JOB_KIND,
        payloadVersion: CADENCE_STEP_JOB_VERSION,
        payload: {
          enrollmentId: enrollment.id,
          stepId: "step-tf1",
          cadenceGeneration: String(enrollment.generation),
        },
        idempotencyKey: "test-lost-lease",
      },
    );
    const [claimed] = await queue.claim({ workerId: "worker-1", limit: 1, leaseMs: 60000 });
    if (!claimed) throw new Error("Expected claimed job");
    const jobFence = fence(claimed);

    // Cancel job behind the worker's back to invalidate lease
    await queue.cancel(jobFence);

    const resLostLease = await executeCadenceStep(ctx, {
      enrollmentId: enrollment.id,
      stepId: "step-tf1",
      generation: enrollment.generation,
      jobFence,
      deps: { recordService: records, jobQueue: queue },
    });
    expect(resLostLease.status).toBe("aborted");
    if (resLostLease.status === "aborted") {
      expect(resLostLease.reason).toBe("fence_lease_lost");
    }
  });

  it("enforces idempotency on retried step execution: exactly one task created", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const lead = await records.create("Leads", {
      First_Name: "Idempotent",
      Last_Name: "Execution",
      Company: "RetryCo",
    });

    const cadence = await service.createCadence(ctx, {
      name: "Idempotent Cadence",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-idemp",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "Unique Idempotent Task",
          priority: "High",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    const enrollment = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead.id,
    });

    // First execution
    const firstRes = await executeCadenceStep(ctx, {
      enrollmentId: enrollment.id,
      stepId: "step-idemp",
      generation: enrollment.generation,
      deps: { recordService: records },
    });
    expect(firstRes.status).toBe("completed");

    // Second execution (simulated retry)
    const secondRes = await executeCadenceStep(ctx, {
      enrollmentId: enrollment.id,
      stepId: "step-idemp",
      generation: enrollment.generation,
      deps: { recordService: records },
    });
    // Already executed aborts or does not re-create effect
    expect(secondRes.status).toBe("aborted");

    // Verify exactly ONE task was created
    const tasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 50 });
    const matchingTasks = tasks.records.filter(
      (t) => t.fields.Subject === "Unique Idempotent Task",
    );
    expect(matchingTasks).toHaveLength(1);
  });

  it("sweepAudienceCustomViews: enrollNewMatches prevents infinite loop on completed records and only re-enrolls on new modification", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const views = await records.listViews("Leads");
    const defaultView = views.find((v) => v.isDefault);
    if (!defaultView) throw new Error("Expected default view");

    const cadence = await service.createCadence(ctx, {
      name: "Loop Guard Cadence",
      module: "Leads",
      audience: {
        kind: "custom_view",
        viewId: defaultView.id,
        enrollNewMatches: true,
      },
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-lg1",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "Loop Guard Task",
          priority: "Normal",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    const lead = await records.create("Leads", {
      First_Name: "Loop",
      Last_Name: "Target",
      Company: "LoopCo",
    });

    // Sweep 1: Lead is enrolled
    const sweep1 = await sweepAudienceCustomViews(ctx, { recordService: records });
    expect(sweep1.enrolledCount).toBeGreaterThanOrEqual(1);

    // Get enrollment and complete it
    const enrollments = await service.listEnrollments(ctx, { cadenceId: cadence.id });
    const leadEnrollment = enrollments.find((e) => e.recordId === lead.id);
    expect(leadEnrollment).toBeDefined();
    if (!leadEnrollment) throw new Error("Expected lead enrollment");

    await executeCadenceStep(ctx, {
      enrollmentId: leadEnrollment.id,
      stepId: "step-lg1",
      generation: leadEnrollment.generation,
      deps: { recordService: records },
    });

    const completed = await service.getEnrollment(ctx, leadEnrollment.id);
    expect(completed.state).toBe("completed");

    // Sweep 2: Lead is still in the view, but has NOT been modified since completion.
    // Must NOT be re-enrolled (finding 4: no infinite loop!)
    const sweep2 = await sweepAudienceCustomViews(ctx, { recordService: records });
    expect(sweep2.enrolledCount).toBe(0);

    // Now update lead with a new modification time (new match)
    await new Promise((r) => setTimeout(r, 50));
    await records.update(
      "Leads",
      lead.id,
      { Lead_Status: "Contacted" },
      { sourceTimes: { modifiedTime: new Date(Date.now() + 1000).toISOString() } },
    );

    // Sweep 3: Modified lead newly matches the view -> successfully re-enrolled!
    const sweep3 = await sweepAudienceCustomViews(ctx, { recordService: records });
    expect(sweep3.enrolledCount).toBe(1);

    const reEnrollments = await service.listEnrollments(ctx, { cadenceId: cadence.id });
    const leadActiveEnrollments = reEnrollments.filter(
      (e) => e.recordId === lead.id && e.state === "active",
    );
    expect(leadActiveEnrollments).toHaveLength(1);
  });

  it("re-enrollment creates a second task and does not silently drop effects", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const lead = await records.create("Leads", {
      First_Name: "ReEnroll",
      Last_Name: "Target",
      Company: "ReEnrollCo",
    });

    const cadence = await service.createCadence(ctx, {
      name: "Re-enroll Task Cadence",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-t1",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "First Follow Up",
          priority: "Normal",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    // 1. First enrollment
    const enroll1 = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead.id,
    });
    const res1 = await executeCadenceStep(ctx, {
      enrollmentId: enroll1.id,
      stepId: "step-t1",
      generation: enroll1.generation,
      deps: { recordService: records },
    });
    expect(res1.status).toBe("completed");

    // Exit the first enrollment
    await service.unenrollRecord(ctx, enroll1.id);

    // 2. Re-enrollment
    const enroll2 = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead.id,
    });
    expect(enroll2.id).not.toBe(enroll1.id);

    const res2 = await executeCadenceStep(ctx, {
      enrollmentId: enroll2.id,
      stepId: "step-t1",
      generation: enroll2.generation,
      deps: { recordService: records },
    });
    expect(res2.status).toBe("completed");

    // Verify TWO tasks were created
    const tasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 50 });
    const matchingTasks = tasks.records.filter((t) => t.fields.Subject === "First Follow Up");
    expect(matchingTasks).toHaveLength(2);
    // Verify Description does NOT contain internal cadence key
    expect(matchingTasks[0]?.fields.Description).toBeFalsy();
    expect(matchingTasks[1]?.fields.Description).toBeFalsy();
  });

  it("manually created task with identical subject does not block cadence task creation", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const lead = await records.create("Leads", {
      First_Name: "Manual",
      Last_Name: "Collision",
      Company: "CollideCo",
    });

    // Manually create a task on this lead
    await records.create("Tasks", {
      Subject: "Quarterly Checkin",
      Status: "Not Started",
      Priority: "High",
      Who_Id: { module: "Leads", id: lead.id },
    });

    const cadence = await service.createCadence(ctx, {
      name: "Checkin Cadence",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-checkin",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "Quarterly Checkin",
          priority: "Normal",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    const enrollment = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead.id,
    });

    const res = await executeCadenceStep(ctx, {
      enrollmentId: enrollment.id,
      stepId: "step-checkin",
      generation: enrollment.generation,
      deps: { recordService: records },
    });
    expect(res.status).toBe("completed");

    // Both tasks exist
    const tasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 50 });
    const checkinTasks = tasks.records.filter((t) => t.fields.Subject === "Quarterly Checkin");
    expect(checkinTasks).toHaveLength(2);
  });

  it("transient errors roll back transaction and rethrow, while ForbiddenError skips with actor_lost_access", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const lead = await records.create("Leads", {
      First_Name: "Error",
      Last_Name: "Test",
      Company: "ErrCo",
    });

    const cadence = await service.createCadence(ctx, {
      name: "Error Cadence",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-err",
          kind: "task",
          delay: { amount: 0, unit: "minutes" },
          subject: "Error Task",
          priority: "Normal",
          dueOffsetDays: 0,
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    const enrollment = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead.id,
    });

    // 1. Transient DB/Service error -> rethrows and rolls back
    const failingRecords = {
      ...records,
      create: vi.fn().mockRejectedValue(new Error("Transient connection timeout")),
    } as unknown as RecordService;

    await expect(
      executeCadenceStep(ctx, {
        enrollmentId: enrollment.id,
        stepId: "step-err",
        generation: enrollment.generation,
        deps: { recordService: failingRecords },
      }),
    ).rejects.toThrow("Transient connection timeout");

    // Verify enrollment has NOT advanced and no step run was recorded
    const freshEnrollment = await service.getEnrollment(ctx, enrollment.id);
    expect(freshEnrollment.nextStepId).toBe("step-err");
    expect(freshEnrollment.state).toBe("active");
    const runs = await service.listStepRuns(ctx, enrollment.id);
    expect(runs).toHaveLength(0);

    // 2. ForbiddenError -> skipped with actor_lost_access
    const forbiddenRecords = {
      ...records,
      create: vi.fn().mockRejectedValue(new ForbiddenError("Permission denied")),
    } as unknown as RecordService;

    const skipResult = await executeCadenceStep(ctx, {
      enrollmentId: enrollment.id,
      stepId: "step-err",
      generation: enrollment.generation,
      deps: { recordService: forbiddenRecords },
    });

    expect(skipResult.status).toBe("skipped");
    if (skipResult.status === "skipped") {
      expect(skipResult.reason).toBe("actor_lost_access");
    }

    const runsAfterForbidden = await service.listStepRuns(ctx, enrollment.id);
    expect(runsAfterForbidden).toHaveLength(1);
    expect(runsAfterForbidden[0]?.outcome).toBe("skipped");
    expect(runsAfterForbidden[0]?.outcomeReason).toBe("actor_lost_access");
  });

  it("email step uses connected mailbox address without fake fallback, and skips if no address available", async () => {
    const { ctx } = await createTestOrganization();
    const service = createCadenceService();
    const records = createFixtureRecordService(ctx);

    const lead = await records.create("Leads", {
      First_Name: "Email",
      Last_Name: "Recipient",
      Company: "MailCo",
      Email: "recipient@example.com",
    });

    const cadence = await service.createCadence(ctx, {
      name: "Mail Cadence",
      module: "Leads",
    });
    await service.updateCadenceDraft(ctx, cadence.id, {
      steps: [
        {
          id: "step-email",
          kind: "email",
          delay: { amount: 0, unit: "minutes" },
          name: "Welcome Email",
        },
      ],
    });
    await service.publish(ctx, cadence.id);

    const enrollment = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead.id,
    });

    // Case A: Mailbox with real address
    const { createInMemoryMailRepository, createMailJobCatalog } = await import("../mail");
    const repoWithMailbox = createInMemoryMailRepository();
    await repoWithMailbox.createMailbox({
      organizationId: ctx.orgId,
      id: "sender@example.com",
      ownerUserId: ctx.userId,
      provider: "google",
      status: "connected",
      credentialRef: "cred-1",
      lastSyncAt: null,
      lastError: null,
    });

    const composedCalls: unknown[] = [];
    const outboxOptions = {
      repository: repoWithMailbox,
      queue: new InMemoryJobQueue(createMailJobCatalog()),
      sender: {
        send: vi.fn().mockImplementation(async (req) => {
          composedCalls.push(req);
          return { status: "accepted", providerMessageId: "prov-1" };
        }),
      },
      recordAddressLookup: { findByAddress: async () => [] },
      canReadRecord: () => true,
    };

    const resA = await executeCadenceStep(ctx, {
      enrollmentId: enrollment.id,
      stepId: "step-email",
      generation: enrollment.generation,
      deps: { recordService: records, outboxOptions },
    });
    expect(resA.status).toBe("completed");

    // Case B: Mailbox without any address and user in DB without email -> skips with missing_mailbox_address
    const lead2 = await records.create("Leads", {
      First_Name: "NoMailbox",
      Last_Name: "Recipient",
      Company: "MailCo",
      Email: "recipient2@example.com",
    });
    const enroll2 = await service.enrollRecord(ctx, {
      cadenceId: cadence.id,
      recordModule: "Leads",
      recordId: lead2.id,
    });

    const opaqueMailboxRepo = {
      read: vi.fn().mockResolvedValue({
        mailboxes: [
          {
            id: "opaque-mailbox-id",
            ownerUserId: ctx.userId,
            status: "connected",
          },
        ],
      }),
    };

    const db = getDb();
    const originalUser = await db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, ctx.userId));

    await db
      .update(schema.users)
      .set({ email: "invalid-email-without-at" })
      .where(eq(schema.users.id, ctx.userId));

    try {
      const resB = await executeCadenceStep(ctx, {
        enrollmentId: enroll2.id,
        stepId: "step-email",
        generation: enroll2.generation,
        deps: {
          recordService: records,
          mailRepository: opaqueMailboxRepo as unknown as MailRepository,
          outboxOptions,
        },
      });

      expect(resB.status).toBe("skipped");
      if (resB.status === "skipped") {
        expect(resB.reason).toBe("missing_mailbox_address");
      }
    } finally {
      if (originalUser[0]?.email) {
        await db
          .update(schema.users)
          .set({ email: originalUser[0].email })
          .where(eq(schema.users.id, ctx.userId));
      }
    }
  });
});
