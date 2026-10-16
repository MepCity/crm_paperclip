import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type { RecordData, RecordService } from "./contract";
import type { RecordServiceContractModuleDefinition } from "./contract-suite-module";
import type { RecordHistoryService } from "./history";

/** Shared behavioral contract; the HTTP adapter can supply its own paired factories. */
export function describeRecordHistoryContract(
  name: string,
  makeRecords: (ctx: OrgContext) => RecordService | Promise<RecordService>,
  makeHistory: (ctx: OrgContext) => RecordHistoryService | Promise<RecordHistoryService>,
  module: RecordServiceContractModuleDefinition,
): void {
  describe(`${name}: ${module.apiName} record history contract`, () => {
    let ctx: OrgContext;
    let records: RecordService;
    let history: RecordHistoryService;
    let record: RecordData;
    const api = module.apiName;
    const field = module.filterMarker.field;
    beforeEach(async () => {
      ctx = {
        orgId: randomUUID(),
        orgSlug: "history-contract",
        orgName: "Contract Organization",
        userId: "history-user",
        role: "admin",
      };
      records = await makeRecords(ctx);
      history = await makeHistory(ctx);
      record = await records.create(api, module.buildMinimalValidInput());
    });
    it("emits one creation without seed or initial field dumps and isolates tenants", async () => {
      const page = await history.list(api, record.id, { perPage: 25 });
      expect(page.events).toHaveLength(1);
      expect(page.events[0]).toMatchObject({
        kind: "record_created",
        schemaVersion: 1,
        changes: [],
        actor: { id: ctx.userId },
      });
      const views = await records.listViews(api);
      const defaultView = views.find((view) => view.isDefault);
      if (defaultView) {
        const seeded = (
          await records.list(api, { viewId: defaultView.id, perPage: 10, page: 1 })
        ).records.find((row) => row.id !== record.id);
        if (seeded)
          expect((await history.list(api, seeded.id, { perPage: 25 })).events).toEqual([]);
      }
      const foreign = await makeHistory({ ...ctx, orgId: randomUUID() });
      // Fixture IDs can repeat across tenants: an overlapping ID must still have no foreign events.
      try {
        expect((await foreign.list(api, record.id, { perPage: 25 })).events).toEqual([]);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
    it("groups changes in metadata order, ignores no-op saves and audit fields", async () => {
      const moduleMetadata = await records.getModule(api);
      const secondField = moduleMetadata.fields.find(
        (candidate) =>
          candidate.apiName !== field &&
          !candidate.readOnly &&
          ["text", "textarea"].includes(candidate.dataType),
      );
      if (!secondField)
        throw new Error("A second editable text field is required by the history contract.");
      await records.update(api, record.id, {
        [field]: module.filterMarker.updated,
        [secondField.apiName]: "Grouped history change",
      });
      const first = await history.list(api, record.id, { perPage: 25 });
      expect(first.events).toHaveLength(2);
      const event = first.events[0];
      if (!event) throw new Error("Missing update event");
      expect(event.kind).toBe("fields_updated");
      expect(event.changes.length).toBeGreaterThanOrEqual(2);
      expect(event.changes.find((change) => change.apiName === secondField.apiName)?.new).toBe(
        "Grouped history change",
      );
      expect(event.changes.find((change) => change.apiName === field)?.new).toEqual(
        module.filterMarker.updated,
      );
      expect(
        event.changes.some((change) => ["Modified_Time", "Modified_By"].includes(change.apiName)),
      ).toBe(false);
      const metadata = await records.getModule(api);
      const order = event.changes.map((change) =>
        metadata.fields.findIndex((f) => f.apiName === change.apiName),
      );
      expect(order).toEqual([...order].sort((a, b) => a - b));
      await records.update(api, record.id, { [field]: module.filterMarker.updated });
      expect((await history.list(api, record.id, { perPage: 25 })).events).toEqual(first.events);
    });
    it("leaves history and records unchanged after rejected validation and batch targets", async () => {
      const before = await history.list(api, record.id, { perPage: 25 });
      await expect(
        records.update(api, record.id, { Unknown_History_Field: "bad" }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        records.changeOwner(api, [record.id, "missing-history-target"], ctx.userId),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(await records.get(api, record.id)).toEqual(record);
      expect(await history.list(api, record.id, { perPage: 25 })).toEqual(before);
    });
    it("pins a cursor snapshot, binds scope, and validates page sizes", async () => {
      for (let i = 0; i < 3; i++) await records.update(api, record.id, { [field]: `History ${i}` });
      const first = await history.list(api, record.id, { perPage: 2 });
      expect(first.moreRecords).toBe(true);
      expect(first.nextPageToken).toBeTruthy();
      await records.update(api, record.id, { [field]: "History after cursor" });
      const second = await history.list(api, record.id, {
        perPage: 2,
        pageToken: first.nextPageToken,
      });
      expect(second.events).toHaveLength(2);
      expect(second.moreRecords).toBe(false);
      expect(new Set([...first.events, ...second.events].map((event) => event.id)).size).toBe(4);
      for (const query of [
        { perPage: 3, pageToken: first.nextPageToken },
        { perPage: 25, pageToken: "bad" },
        { perPage: 0 },
        { perPage: 201 },
      ])
        await expect(history.list(api, record.id, query)).rejects.toBeInstanceOf(ValidationError);
      const other = await makeHistory({ ...ctx, userId: "another-history-user" });
      await expect(
        other.list(api, record.id, { perPage: 2, pageToken: first.nextPageToken }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
    it("combines module, actor, time and source filters with exclusive upper bound", async () => {
      const created = (await history.list(api, record.id, { perPage: 25 })).events[0];
      if (!created) throw new Error("Missing creation event");
      const query = {
        perPage: 25,
        modules: [api],
        actorId: ctx.userId,
        sources: ["manual" as const],
        from: created.occurredAt,
        to: new Date(Date.parse(created.occurredAt) + 1000).toISOString(),
      };
      expect((await history.list(api, record.id, query)).events).toHaveLength(1);
      expect(
        (await history.list(api, record.id, { ...query, actorId: "absent-user" })).events,
      ).toEqual([]);
      expect(
        (
          await history.list(api, record.id, {
            ...query,
            from: new Date(Date.parse(created.occurredAt) - 1000).toISOString(),
            to: created.occurredAt,
          })
        ).events,
      ).toEqual([]);
      await records.delete(api, [record.id]);
      await expect(history.list(api, record.id, { perPage: 25 })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
}
