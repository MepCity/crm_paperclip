import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "../database";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import type { ActorRef } from "../records/contract";
import { createFixtureRecordService } from "../records/fixture";
import { createTestOrganization } from "../testing";
import { createJourneysService } from "./service";
import type { JourneyState, JourneyTransition } from "./types";
import { executeJourneyDueAction, executeJourneyTransition } from "./worker";

describe("journeys backend integration", () => {
  it("manages full lifecycle, unique name, draft updates, publish, and version immutability", async () => {
    const { ctx: ctxA } = await createTestOrganization();
    const { ctx: ctxB } = await createTestOrganization();
    const service = createJourneysService();
    const db = getDb();

    // 1. Create a Journey for Leads
    const journey = await service.createJourney(ctxA, {
      name: "Lead Qualification Journey",
      module: "Leads",
      description: "Automated qualification path",
    });

    expect(journey.name).toBe("Lead Qualification Journey");
    expect(journey.module).toBe("Leads");
    expect(journey.status).toBe("draft");
    expect(journey.draftVersion).not.toBeNull();
    expect(journey.draftVersion?.number).toBe(1);
    expect(journey.draftVersion?.state).toBe("draft");
    expect(journey.draftVersion?.states).toHaveLength(1);
    expect(journey.draftVersion?.states[0]?.isStart).toBe(true);
    expect(journey.activeVersion).toBeNull();
    expect(journey.currentRecordCount).toBe(0);

    // 2. Case-insensitive unique name within same organization
    await expect(
      service.createJourney(ctxA, {
        name: "lead qualification journey",
        module: "Contacts",
      }),
    ).rejects.toThrowError(ConflictError);

    // Different organization can use the same name
    const journeyB = await service.createJourney(ctxB, {
      name: "Lead Qualification Journey",
      module: "Contacts",
    });
    expect(journeyB.id).not.toBe(journey.id);

    // 3. Update draft version: add a second state and a transition
    const states: JourneyState[] = [
      {
        id: "state_start",
        name: "Start",
        isStart: true,
        actions: [
          {
            id: "act_email_1",
            kind: "email",
            timing: "immediate",
            templateId: "tpl-intro",
          },
        ],
        deadline: null,
      },
      {
        id: "state_engaged",
        name: "Engaged Prospect",
        isStart: false,
        actions: [
          {
            id: "act_task_1",
            kind: "task",
            timing: "immediate",
            subject: "Schedule Technical Demo",
            dueOffsetDays: 2,
            priority: "High",
          },
        ],
        deadline: {
          amount: 5,
          unit: "days",
        },
      },
    ];

    const transitions: JourneyTransition[] = [
      {
        id: "trans_1",
        from: "state_start",
        to: "state_engaged",
        trigger: "record_updated",
        criteria: null,
        actions: [],
      },
    ];

    const updated = await service.updateJourneyDraft(ctxA, journey.id, {
      description: "Updated description",
      states,
      transitions,
    });

    expect(updated.draftVersion?.states).toHaveLength(2);
    expect(updated.draftVersion?.transitions).toHaveLength(1);
    expect(updated.description).toBe("Updated description");

    // 4. Publish version 1
    const published = await service.publishJourney(ctxA, journey.id);
    expect(published.status).toBe("active");
    expect(published.draftVersion).toBeNull();
    expect(published.activeVersion).not.toBeNull();
    expect(published.activeVersion?.number).toBe(1);
    expect(published.activeVersion?.state).toBe("active");
    expect(published.activeVersion?.publishedBy).toBe(ctxA.userId);
    expect(published.activeVersion?.states).toHaveLength(2);

    const v1Id = published.activeVersion?.id;
    if (!v1Id) throw new Error("Expected active version ID");

    // Verify v1 in database
    const [v1Row] = await db
      .select()
      .from(schema.journeyVersions)
      .where(
        and(
          eq(schema.journeyVersions.organizationId, ctxA.orgId),
          eq(schema.journeyVersions.id, v1Id),
        ),
      );
    expect(v1Row).toBeDefined();
    if (!v1Row) throw new Error("Expected v1Row");
    expect(v1Row.state).toBe("active");
    const v1OriginalStates = JSON.stringify(v1Row.states);

    // 5. Immutability: Editing after publish opens a NEW draft (version 2)
    // The active version row (v1) is NEVER updated
    const statesV2: JourneyState[] = [
      ...states,
      {
        id: "state_converted",
        name: "Converted",
        isStart: false,
        actions: [],
        deadline: null,
      },
    ];

    const transitionsV2: JourneyTransition[] = [
      ...transitions,
      {
        id: "trans_2",
        from: "state_engaged",
        to: "state_converted",
        trigger: "record_updated",
        criteria: null,
        actions: [],
      },
    ];

    const draft2Journey = await service.updateJourneyDraft(ctxA, journey.id, {
      states: statesV2,
      transitions: transitionsV2,
    });

    expect(draft2Journey.draftVersion).not.toBeNull();
    expect(draft2Journey.draftVersion?.number).toBe(2);
    expect(draft2Journey.draftVersion?.state).toBe("draft");
    expect(draft2Journey.activeVersion?.id).toBe(v1Id);

    // Assert v1 row in DB was NOT changed
    const [v1RowAfterDraft2] = await db
      .select()
      .from(schema.journeyVersions)
      .where(
        and(
          eq(schema.journeyVersions.organizationId, ctxA.orgId),
          eq(schema.journeyVersions.id, v1Id),
        ),
      );
    expect(v1RowAfterDraft2?.state).toBe("active");
    expect(JSON.stringify(v1RowAfterDraft2?.states)).toBe(v1OriginalStates);

    // 6. Publish version 2: v1 becomes superseded, v2 becomes active
    const publishedV2 = await service.publishJourney(ctxA, journey.id);
    expect(publishedV2.status).toBe("active");
    expect(publishedV2.draftVersion).toBeNull();
    expect(publishedV2.activeVersion?.number).toBe(2);
    expect(publishedV2.activeVersion?.state).toBe("active");

    const [v1RowAfterPublishV2] = await db
      .select()
      .from(schema.journeyVersions)
      .where(
        and(
          eq(schema.journeyVersions.organizationId, ctxA.orgId),
          eq(schema.journeyVersions.id, v1Id),
        ),
      );
    expect(v1RowAfterPublishV2?.state).toBe("superseded");
    expect(JSON.stringify(v1RowAfterPublishV2?.states)).toBe(v1OriginalStates);

    // 7. Deactivate and Activate
    const deactivated = await service.deactivateJourney(ctxA, journey.id);
    expect(deactivated.status).toBe("inactive");

    const activated = await service.activateJourney(ctxA, journey.id);
    expect(activated.status).toBe("active");

    // 8. List with search and filtering
    const list = await service.listJourneys(ctxA, { search: "Qualification" });
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(journey.id);
    expect(list[0]?.status).toBe("active");

    const emptyList = await service.listJourneys(ctxA, { search: "NonExistent" });
    expect(emptyList).toHaveLength(0);

    // 9. Delete journey
    await service.deleteJourney(ctxA, journey.id);
    await expect(service.getJourney(ctxA, journey.id)).rejects.toThrowError(NotFoundError);
  });

  describe("scoped execution actor permissions (§3.1, ADR 0013)", () => {
    it("journey actor is restricted to journey module and activity modules", async () => {
      const { ctx } = await createTestOrganization();
      const journeyActor: ActorRef = {
        kind: "journey",
        id: "journey-123",
        versionId: "v-1",
        module: "Leads",
      };
      const recordService = createFixtureRecordService(ctx, { actor: journeyActor });

      // Allowed module (Leads): can create, read, update
      const lead = await recordService.create("Leads", {
        First_Name: "Bounded",
        Last_Name: "Actor",
        Company: "Scoped Inc",
      });
      expect(lead.id).toBeDefined();

      const readLead = await recordService.get("Leads", lead.id);
      expect(readLead.fields.Last_Name).toBe("Actor");

      const updated = await recordService.update("Leads", lead.id, { Rating: "Active" });
      expect(updated.fields.Rating).toBe("Active");

      // Allowed activity modules (Tasks, Calls)
      const task = await recordService.create("Tasks", {
        Subject: "Journey Task",
        Priority: "High",
        Status: "Not Started",
      });
      expect(task.id).toBeDefined();

      const call = await recordService.create("Calls", {
        Subject: "Journey Call",
        Call_Type: "Outbound",
        Call_Start_Time: new Date().toISOString(),
      });
      expect(call.id).toBeDefined();

      // Prohibited modules (Deals, Accounts) throw ForbiddenError
      await expect(
        recordService.create("Deals", { Deal_Name: "Disallowed Deal", Amount: 1000 }),
      ).rejects.toThrowError(ForbiddenError);

      await expect(
        recordService.create("Accounts", { Account_Name: "Disallowed Account" }),
      ).rejects.toThrowError(ForbiddenError);

      // Prohibited mutations throw ForbiddenError
      await expect(recordService.delete("Leads", [lead.id])).rejects.toThrowError(ForbiddenError);
      await expect(
        recordService.convertLead(lead.id, { deal: { create: { Deal_Name: "Deal" } } }),
      ).rejects.toThrowError(ForbiddenError);
      await expect(
        recordService.merge("Leads", { masterId: lead.id, duplicateIds: [lead.id], values: {} }),
      ).rejects.toThrowError(ForbiddenError);
      await expect(
        recordService.massUpdate("Leads", [lead.id], { Rating: "Acquired" }),
      ).rejects.toThrowError(ForbiddenError);
      await expect(recordService.changeOwner("Leads", [lead.id], ctx.userId)).rejects.toThrowError(
        ForbiddenError,
      );
    });
  });

  describe("trigger intake, criteria evaluation, and action execution", () => {
    it("handles record create, criteria pass/fail on update, actions, and webform trigger", async () => {
      const { ctx } = await createTestOrganization();
      const records = createFixtureRecordService(ctx);
      const service = createJourneysService({ recordService: records });

      // 1. Create and publish journey
      const journey = await service.createJourney(ctx, {
        name: "Qualification Pipeline",
        module: "Leads",
      });

      const states: JourneyState[] = [
        {
          id: "state_start",
          name: "Start State",
          isStart: true,
          actions: [
            {
              id: "act_task_start",
              kind: "task",
              timing: "immediate",
              subject: "Initial Follow-up",
              priority: "High",
              dueOffsetDays: 1,
            },
          ],
          deadline: null,
        },
        {
          id: "state_qualified",
          name: "Qualified State",
          isStart: false,
          actions: [
            {
              id: "act_call_qualified",
              kind: "call",
              timing: "immediate",
              subject: "Discovery Call",
              callType: "Outbound",
            },
          ],
          deadline: {
            amount: 3,
            unit: "days",
          },
        },
        {
          id: "state_won",
          name: "Won State",
          isStart: false,
          actions: [],
          deadline: null,
        },
      ];

      const transitions: JourneyTransition[] = [
        {
          id: "trans_qualify",
          from: "state_start",
          to: "state_qualified",
          trigger: "record_updated",
          criteria: {
            kind: "criteria",
            criteria: {
              field: "Annual_Revenue",
              comparator: "greater_equal",
              value: 50000,
            },
          },
          actions: [
            {
              id: "act_field_rating",
              kind: "field_update",
              timing: "immediate",
              field: "Rating",
              value: "Active",
            },
          ],
        },
        {
          id: "trans_webform",
          from: "state_qualified",
          to: "state_won",
          trigger: "webform_submitted",
          criteria: null,
          actions: [],
        },
      ];

      await service.updateJourneyDraft(ctx, journey.id, { states, transitions });
      const published = await service.publishJourney(ctx, journey.id);
      expect(published.status).toBe("active");

      // 2. Intake: Create Lead enters active journey's start state
      const lead = await records.create("Leads", {
        First_Name: "Test",
        Last_Name: "Lead1",
        Company: "Acme",
        Annual_Revenue: 10000,
        Rating: "Acquired",
      });

      await service.handleRecordEvent(ctx, {
        kind: "create",
        module: "Leads",
        record: lead,
        previous: undefined,
        label: "Test Lead1",
      });

      // Verify 1 instance created in state_start
      const instances = await service.listJourneyInstances(ctx, journey.id);
      expect(instances.instances).toHaveLength(1);
      const inst = instances.instances[0];
      expect(inst).toBeDefined();
      if (!inst) throw new Error("Expected instance");
      expect(inst.currentStateId).toBe("state_start");
      expect(inst.status).toBe("active");
      expect(inst.recordId).toBe(lead.id);

      // Verify immediate task in start state was executed
      const tasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 10 });
      expect(tasks.records.some((t) => t.fields.Subject === "Initial Follow-up")).toBe(true);

      // Verify partial unique: calling enterActiveJourneys again does NOT create duplicate
      await service.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead.id,
        record: lead,
      });
      const instancesAfterReenter = await service.listJourneyInstances(ctx, journey.id);
      expect(instancesAfterReenter.instances).toHaveLength(1);

      // 3. Criteria Fail on Edit: Annual_Revenue = 25000 < 50000
      const updatedFail = await records.update("Leads", lead.id, { Annual_Revenue: 25000 });
      await service.handleRecordEvent(ctx, {
        kind: "edit",
        module: "Leads",
        record: updatedFail,
        previous: lead,
        label: "Test Lead1",
      });

      // Instance is still in state_start
      const instAfterFail = await service.getJourneyInstance(ctx, inst.id);
      expect(instAfterFail.currentStateId).toBe("state_start");

      // Check transition runs log contains criteria_failed
      const logAfterFail = await service.getJourneyTransitionLog(ctx, inst.id);
      expect(logAfterFail).toHaveLength(1);
      expect(logAfterFail[0]?.result).toBe("criteria_failed");
      expect(logAfterFail[0]?.resultReason).toBe("criteria_not_met");

      // 4. Criteria Pass on Edit: Annual_Revenue = 60000 >= 50000
      const updatedPass = await records.update("Leads", lead.id, { Annual_Revenue: 60000 });
      await service.handleRecordEvent(ctx, {
        kind: "edit",
        module: "Leads",
        record: updatedPass,
        previous: updatedFail,
        label: "Test Lead1",
      });

      // Instance moved to state_qualified
      const instAfterPass = await service.getJourneyInstance(ctx, inst.id);
      expect(instAfterPass.currentStateId).toBe("state_qualified");
      expect(instAfterPass.deadlineAt).not.toBeNull();

      // Transition action ran: lead rating updated to Active
      const refreshedLead = await records.get("Leads", lead.id);
      expect(refreshedLead.fields.Rating).toBe("Active");

      // Target state immediate action ran: Call created
      const calls = await records.list("Calls", { viewId: "all-calls", page: 1, perPage: 10 });
      expect(calls.records.some((c) => c.fields.Subject === "Discovery Call")).toBe(true);

      // Transition log shows success
      const logAfterPass = await service.getJourneyTransitionLog(ctx, inst.id);
      expect(logAfterPass).toHaveLength(2);
      expect(logAfterPass[1]?.result).toBe("success");

      // 5. Webform trigger: webform_submitted fires trans_webform -> state_won
      await service.handleWebformSubmitted(ctx, {
        formId: "webform-abc",
        recordModule: "Leads",
        recordId: lead.id,
        record: refreshedLead,
      });

      const instAfterWebform = await service.getJourneyInstance(ctx, inst.id);
      expect(instAfterWebform.currentStateId).toBe("state_won");

      // 6. Stop instance & Re-entry after terminal state
      await service.stopJourneyInstance(ctx, inst.id);
      const stoppedInst = await service.getJourneyInstance(ctx, inst.id);
      expect(stoppedInst.status).toBe("stopped");

      // Now re-entry is permitted
      await service.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead.id,
        record: refreshedLead,
      });

      const instancesReentered = await service.listJourneyInstances(ctx, journey.id, {
        status: "active",
      });
      expect(instancesReentered.instances).toHaveLength(1);
      expect(instancesReentered.instances[0]?.id).not.toBe(inst.id);
    });
  });

  describe("actor access checks and skipped actions", () => {
    it("skips action effect with actor_lost_access if owner loses access", async () => {
      const { ctx } = await createTestOrganization();
      const records = createFixtureRecordService(ctx);
      const service = createJourneysService({ recordService: records });
      const db = getDb();

      const journey = await service.createJourney(ctx, {
        name: "Access Check Journey",
        module: "Leads",
      });

      const states: JourneyState[] = [
        {
          id: "state_start",
          name: "Start",
          isStart: true,
          actions: [
            {
              id: "act_task",
              kind: "task",
              timing: "immediate",
              subject: "Restricted Task",
              priority: "High",
              dueOffsetDays: 1,
            },
          ],
          deadline: null,
        },
      ];

      await service.updateJourneyDraft(ctx, journey.id, { states, transitions: [] });
      await service.publishJourney(ctx, journey.id);

      const lead = await records.create("Leads", {
        First_Name: "NoAccess",
        Last_Name: "User",
        Company: "Corp",
      });

      // Pass canAccess that returns false
      const customService = createJourneysService({
        recordService: records,
        canAccess: async () => false,
      });

      await customService.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead.id,
        record: lead,
      });

      // Verify due action was marked skipped with actor_lost_access
      const [dueRow] = await db
        .select()
        .from(schema.journeyDueActions)
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.actionId, "act_task"),
          ),
        );

      expect(dueRow).toBeDefined();
      expect(dueRow?.outcome).toBe("skipped");
      expect(dueRow?.outcomeReason).toBe("actor_lost_access");
    });
  });

  describe("races with two transactions and idempotency (ADR 0019 §8)", () => {
    it("Race 1: deactivate vs due action - due action ends skipped with journey_inactive or generation_mismatch", async () => {
      const { ctx } = await createTestOrganization();
      const records = createFixtureRecordService(ctx);
      const service = createJourneysService({ recordService: records });
      const db = getDb();

      const journey = await service.createJourney(ctx, {
        name: "Deactivate Race",
        module: "Leads",
      });

      const states: JourneyState[] = [
        {
          id: "state_start",
          name: "Start",
          isStart: true,
          actions: [
            {
              id: "act_delayed_task",
              kind: "task",
              timing: { amount: 1, unit: "days" },
              subject: "Delayed Task",
              priority: "High",
              dueOffsetDays: 1,
            },
          ],
          deadline: null,
        },
      ];

      await service.updateJourneyDraft(ctx, journey.id, { states, transitions: [] });
      await service.publishJourney(ctx, journey.id);

      const lead = await records.create("Leads", {
        First_Name: "Race1",
        Last_Name: "Lead",
        Company: "Acme",
      });

      await service.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead.id,
        record: lead,
      });

      const [dueRow] = await db
        .select()
        .from(schema.journeyDueActions)
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.actionId, "act_delayed_task"),
          ),
        );
      expect(dueRow).toBeDefined();
      if (!dueRow) throw new Error("Expected dueRow");

      // Tx 1: Deactivate journey (which bumps active instances generation)
      await service.deactivateJourney(ctx, journey.id);

      // Tx 2: Worker executes due action with original generation
      const res = await executeJourneyDueAction(ctx, {
        dueActionId: dueRow.id,
        instanceId: dueRow.instanceId,
        stateId: dueRow.stateId,
        actionId: dueRow.actionId,
        generation: dueRow.generation,
        deps: { recordService: records },
      });

      expect(res.status).toBe("skipped");
      if (res.status === "skipped") {
        expect(res.outcome).toBe("skipped");
        expect(["generation_mismatch", "journey_inactive"]).toContain(res.reason);
      }

      // Verify no task was created
      const tasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 10 });
      expect(tasks.records.filter((t) => t.fields.Subject === "Delayed Task")).toHaveLength(0);
    });

    it("Race 2: republish vs due action - due action with old generation ends skipped", async () => {
      const { ctx } = await createTestOrganization();
      const records = createFixtureRecordService(ctx);
      const service = createJourneysService({ recordService: records });
      const db = getDb();

      const journey = await service.createJourney(ctx, {
        name: "Republish Race",
        module: "Leads",
      });

      const states: JourneyState[] = [
        {
          id: "state_start",
          name: "Start",
          isStart: true,
          actions: [
            {
              id: "act_delayed_task",
              kind: "task",
              timing: { amount: 1, unit: "days" },
              subject: "Old Gen Task",
              priority: "High",
              dueOffsetDays: 1,
            },
          ],
          deadline: null,
        },
      ];

      await service.updateJourneyDraft(ctx, journey.id, { states, transitions: [] });
      await service.publishJourney(ctx, journey.id);

      const lead = await records.create("Leads", {
        First_Name: "Race2",
        Last_Name: "Lead",
        Company: "Acme",
      });

      await service.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead.id,
        record: lead,
      });

      const [dueRow] = await db
        .select()
        .from(schema.journeyDueActions)
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.actionId, "act_delayed_task"),
          ),
        );
      expect(dueRow).toBeDefined();
      if (!dueRow) throw new Error("Expected dueRow");

      // Tx 1: Update draft and republish (bumps active instances generation)
      await service.updateJourneyDraft(ctx, journey.id, { description: "Updated description" });
      await service.publishJourney(ctx, journey.id);

      // Tx 2: Worker executes due action with old generation
      const res = await executeJourneyDueAction(ctx, {
        dueActionId: dueRow.id,
        instanceId: dueRow.instanceId,
        stateId: dueRow.stateId,
        actionId: dueRow.actionId,
        generation: dueRow.generation, // old generation = 1
        deps: { recordService: records },
      });

      expect(res.status).toBe("skipped");
      if (res.status === "skipped") {
        expect(res.outcome).toBe("skipped");
        expect(res.reason).toBe("generation_mismatch");
      }

      const tasks = await records.list("Tasks", { viewId: "all-tasks", page: 1, perPage: 10 });
      expect(tasks.records.filter((t) => t.fields.Subject === "Old Gen Task")).toHaveLength(0);
    });

    it("Race 3: record update vs deadline - update moves instance before deadline triggers", async () => {
      const { ctx } = await createTestOrganization();
      const records = createFixtureRecordService(ctx);
      const service = createJourneysService({ recordService: records });
      const db = getDb();

      const journey = await service.createJourney(ctx, {
        name: "Deadline Race",
        module: "Leads",
      });

      const states: JourneyState[] = [
        {
          id: "state_start",
          name: "Start",
          isStart: true,
          actions: [],
          deadline: { amount: 1, unit: "days" },
        },
        {
          id: "state_advanced",
          name: "Advanced",
          isStart: false,
          actions: [],
          deadline: null,
        },
        {
          id: "state_escalated",
          name: "Escalated",
          isStart: false,
          actions: [],
          deadline: null,
        },
      ];

      const transitions: JourneyTransition[] = [
        {
          id: "trans_update",
          from: "state_start",
          to: "state_advanced",
          trigger: "record_updated",
          criteria: null,
          actions: [],
        },
        {
          id: "trans_deadline",
          from: "state_start",
          to: "state_escalated",
          trigger: "deadline_missed",
          criteria: null,
          actions: [],
        },
      ];

      await service.updateJourneyDraft(ctx, journey.id, { states, transitions });
      await service.publishJourney(ctx, journey.id);

      const lead = await records.create("Leads", {
        First_Name: "Race3",
        Last_Name: "Lead",
        Company: "Acme",
      });

      await service.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead.id,
        record: lead,
      });

      const instances = await service.listJourneyInstances(ctx, journey.id);
      const inst = instances.instances[0];
      expect(inst).toBeDefined();
      if (!inst) throw new Error("Expected instance");

      const [deadlineDueRow] = await db
        .select()
        .from(schema.journeyDueActions)
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.instanceId, inst.id),
            eq(schema.journeyDueActions.actionId, "__deadline__"),
          ),
        );
      expect(deadlineDueRow).toBeDefined();
      if (!deadlineDueRow) throw new Error("Expected deadlineDueRow");

      // Tx 1: Record update transitions instance from state_start to state_advanced
      const updatedLead = await records.update("Leads", lead.id, { Rating: "Active" });
      await service.handleRecordEvent(ctx, {
        kind: "edit",
        module: "Leads",
        record: updatedLead,
        previous: lead,
        label: "Race3 Lead",
      });

      // Verify instance is now in state_advanced
      const currentInst = await service.getJourneyInstance(ctx, inst.id);
      expect(currentInst.currentStateId).toBe("state_advanced");

      // Tx 2: Deadline action runs for state_start
      await executeJourneyDueAction(ctx, {
        dueActionId: deadlineDueRow.id,
        instanceId: inst.id,
        stateId: "state_start",
        actionId: "__deadline__",
        generation: deadlineDueRow.generation,
        deps: { recordService: records },
      });

      // Due action finishes without moving instance to state_escalated (no matching transition from state_advanced)
      const finalInst = await service.getJourneyInstance(ctx, inst.id);
      expect(finalInst.currentStateId).toBe("state_advanced");
    });

    it("Race 4: duplicate event delivery - concurrent execution produces exactly 1 run row", async () => {
      const { ctx } = await createTestOrganization();
      const records = createFixtureRecordService(ctx);
      const service = createJourneysService({ recordService: records });
      const db = getDb();

      const journey = await service.createJourney(ctx, {
        name: "Duplicate Delivery Race",
        module: "Leads",
      });

      const states: JourneyState[] = [
        {
          id: "state_start",
          name: "Start",
          isStart: true,
          actions: [],
          deadline: null,
        },
        {
          id: "state_target",
          name: "Target",
          isStart: false,
          actions: [],
          deadline: null,
        },
      ];

      const transitions: JourneyTransition[] = [
        {
          id: "trans_dup",
          from: "state_start",
          to: "state_target",
          trigger: "record_updated",
          criteria: null,
          actions: [],
        },
      ];

      await service.updateJourneyDraft(ctx, journey.id, { states, transitions });
      await service.publishJourney(ctx, journey.id);

      const lead = await records.create("Leads", {
        First_Name: "Race4",
        Last_Name: "Lead",
        Company: "Acme",
      });

      await service.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead.id,
        record: lead,
      });

      const instances = await service.listJourneyInstances(ctx, journey.id);
      const inst = instances.instances[0];
      expect(inst).toBeDefined();
      if (!inst) throw new Error("Expected instance");

      // Execute duplicate delivery concurrently with the SAME eventId
      const eventId = "dup_event_unique_123";
      const [res1, res2] = await Promise.all([
        executeJourneyTransition(ctx, {
          instanceId: inst.id,
          transitionId: "trans_dup",
          eventId,
          generation: inst.generation,
          deps: { recordService: records },
          record: lead,
        }),
        executeJourneyTransition(ctx, {
          instanceId: inst.id,
          transitionId: "trans_dup",
          eventId,
          generation: inst.generation,
          deps: { recordService: records },
          record: lead,
        }),
      ]);

      // Exactly one run row was created
      const runRows = await db
        .select()
        .from(schema.journeyTransitionRuns)
        .where(
          and(
            eq(schema.journeyTransitionRuns.organizationId, ctx.orgId),
            eq(schema.journeyTransitionRuns.instanceId, inst.id),
            eq(schema.journeyTransitionRuns.eventId, eventId),
          ),
        );
      expect(runRows).toHaveLength(1);

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain("completed");
    });
  });

  describe("journey instance list filters and transition log queries", () => {
    it("supports filtering by state, status, date range, and deadline, plus transition log", async () => {
      const { ctx } = await createTestOrganization();
      const records = createFixtureRecordService(ctx);
      const service = createJourneysService({ recordService: records });

      const journey = await service.createJourney(ctx, {
        name: "Filter Query Journey",
        module: "Leads",
      });

      const states: JourneyState[] = [
        {
          id: "state_start",
          name: "Start",
          isStart: true,
          actions: [],
          deadline: { amount: 2, unit: "days" },
        },
        {
          id: "state_next",
          name: "Next",
          isStart: false,
          actions: [],
          deadline: null,
        },
      ];

      const transitions: JourneyTransition[] = [
        {
          id: "trans_move",
          from: "state_start",
          to: "state_next",
          trigger: "record_updated",
          criteria: null,
          actions: [],
        },
      ];

      await service.updateJourneyDraft(ctx, journey.id, { states, transitions });
      await service.publishJourney(ctx, journey.id);

      const lead1 = await records.create("Leads", {
        First_Name: "L1",
        Last_Name: "One",
        Company: "C1",
      });
      const lead2 = await records.create("Leads", {
        First_Name: "L2",
        Last_Name: "Two",
        Company: "C2",
      });

      await service.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead1.id,
        record: lead1,
      });
      await service.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead2.id,
        record: lead2,
      });

      // Move lead2 to state_next
      await service.handleRecordEvent(ctx, {
        kind: "edit",
        module: "Leads",
        record: lead2,
        previous: lead2,
        label: "L2 Two",
      });

      // Stop lead1
      const inst1 = (await service.listJourneyInstances(ctx, journey.id)).instances.find(
        (i) => i.recordId === lead1.id,
      );
      expect(inst1).toBeDefined();
      if (!inst1) throw new Error("Expected inst1");
      await service.stopJourneyInstance(ctx, inst1.id);

      // Query: stateId filter
      const inNext = await service.listJourneyInstances(ctx, journey.id, { stateId: "state_next" });
      expect(inNext.instances).toHaveLength(1);
      expect(inNext.instances[0]?.recordId).toBe(lead2.id);

      // Query: status filter
      const activeOnly = await service.listJourneyInstances(ctx, journey.id, { status: "active" });
      expect(activeOnly.instances).toHaveLength(1);
      expect(activeOnly.instances[0]?.recordId).toBe(lead2.id);

      const stoppedOnly = await service.listJourneyInstances(ctx, journey.id, {
        status: "stopped",
      });
      expect(stoppedOnly.instances).toHaveLength(1);
      expect(stoppedOnly.instances[0]?.recordId).toBe(lead1.id);

      // Query: hasDeadline filter
      const withDeadline = await service.listJourneyInstances(ctx, journey.id, {
        hasDeadline: true,
      });
      expect(withDeadline.instances).toHaveLength(1);
      expect(withDeadline.instances[0]?.recordId).toBe(lead1.id);

      // Transition log for lead2
      const inst2 = (await service.listJourneyInstances(ctx, journey.id)).instances.find(
        (i) => i.recordId === lead2.id,
      );
      expect(inst2).toBeDefined();
      if (!inst2) throw new Error("Expected inst2");
      const log = await service.getJourneyTransitionLog(ctx, inst2.id);
      expect(log).toHaveLength(1);
      expect(log[0]?.transitionId).toBe("trans_move");
      expect(log[0]?.result).toBe("success");

      // Verify live currentRecordCount in listJourneys reflects 1 active instance
      const journeysList = await service.listJourneys(ctx);
      const foundJourney = journeysList.find((j) => j.id === journey.id);
      expect(foundJourney?.currentRecordCount).toBe(1);
    });

    it("aggregates report metrics (state counts, average time, transition flow) and lists record instances", async () => {
      const { ctx } = await createTestOrganization();
      const records = createFixtureRecordService(ctx);
      const service = createJourneysService({ recordService: records });

      const journey = await service.createJourney(ctx, {
        name: "Reporting Journey",
        module: "Leads",
      });

      const states: JourneyState[] = [
        {
          id: "state_start",
          name: "Start State",
          isStart: true,
          actions: [],
          deadline: null,
        },
        {
          id: "state_qualified",
          name: "Qualified State",
          isStart: false,
          actions: [],
          deadline: null,
        },
      ];

      const transitions: JourneyTransition[] = [
        {
          id: "trans_qualify",
          from: "state_start",
          to: "state_qualified",
          trigger: "record_updated",
          criteria: null,
          actions: [],
        },
      ];

      await service.updateJourneyDraft(ctx, journey.id, { states, transitions });
      await service.publishJourney(ctx, journey.id);

      const lead = await records.create("Leads", {
        First_Name: "Report",
        Last_Name: "Lead",
        Company: "Test Corp",
      });

      await service.enterActiveJourneys(ctx, {
        module: "Leads",
        recordId: lead.id,
        record: lead,
      });

      // Initially in state_start
      let recordInstances = await service.listRecordInstances(ctx, "Leads", lead.id);
      expect(recordInstances).toHaveLength(1);
      expect(recordInstances[0]?.journeyName).toBe("Reporting Journey");
      expect(recordInstances[0]?.currentStateId).toBe("state_start");
      expect(recordInstances[0]?.currentStateName).toBe("Start State");
      expect(recordInstances[0]?.status).toBe("active");

      // Verify report before transition
      let report = await service.getJourneyReport(ctx, journey.id);
      expect(report.summary.totalInstances).toBe(1);
      expect(report.summary.active).toBe(1);
      const startStateMetric = report.states.find((s) => s.id === "state_start");
      expect(startStateMetric?.currentCount).toBe(1);
      expect(startStateMetric?.totalEntered).toBe(1);
      const qualifyTransition = report.transitions.find((t) => t.id === "trans_qualify");
      expect(qualifyTransition?.count).toBe(0);

      // Execute transition
      await service.handleRecordEvent(ctx, {
        kind: "edit",
        module: "Leads",
        record: lead,
        previous: lead,
        label: "Report Lead",
      });

      // Verify record instance after transition
      recordInstances = await service.listRecordInstances(ctx, "Leads", lead.id);
      expect(recordInstances).toHaveLength(1);
      expect(recordInstances[0]?.currentStateId).toBe("state_qualified");
      expect(recordInstances[0]?.currentStateName).toBe("Qualified State");

      // Verify report after transition
      report = await service.getJourneyReport(ctx, journey.id);
      expect(report.summary.totalInstances).toBe(1);
      const qualStateMetric = report.states.find((s) => s.id === "state_qualified");
      expect(qualStateMetric?.currentCount).toBe(1);
      expect(qualStateMetric?.totalEntered).toBe(1);
      const updatedTransition = report.transitions.find((t) => t.id === "trans_qualify");
      expect(updatedTransition?.count).toBe(1);
      expect(updatedTransition?.successCount).toBe(1);
    });
  });
});
