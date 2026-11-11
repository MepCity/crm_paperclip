import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "../database";
import { ConflictError, NotFoundError } from "../errors";
import { createTestOrganization } from "../testing";
import { createJourneysService } from "./service";
import type { JourneyState, JourneyTransition } from "./types";

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
});
