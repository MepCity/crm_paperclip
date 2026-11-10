import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "../database";
import { ConflictError, NotFoundError } from "../errors";
import { createTestOrganization } from "../testing";
import { createCadenceService } from "./service";
import type { CadenceExitRule, CadenceStep } from "./types";

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
});
