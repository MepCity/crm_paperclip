import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type { RecordData, RecordService, SystemFiltersValue } from "./contract";
import type { RecordServiceContractModuleDefinition } from "./contract-suite-module";

export function describeSystemFiltersContract(
  name: string,
  makeRecords: (ctx: OrgContext, now: () => Date) => RecordService | Promise<RecordService>,
  module: RecordServiceContractModuleDefinition,
): void {
  describe(`${name}: ${module.apiName} system filters`, () => {
    const api = module.apiName;
    const period = { from: "2026-10-01T00:00:00Z", to: "2026-10-02T00:00:00Z" };
    let instant: string;
    let ctx: OrgContext;
    let records: RecordService;
    let record: RecordData;
    let viewId: string;
    const query = (systemFilters: SystemFiltersValue) => ({
      viewId,
      page: 1,
      perPage: 100,
      systemFilters,
    });
    const ids = async (systemFilters: SystemFiltersValue) =>
      (await records.list(api, query(systemFilters))).records.map((r) => r.id);
    beforeEach(async () => {
      instant = period.from;
      ctx = {
        orgId: randomUUID(),
        orgSlug: "system-contract",
        orgName: "Synthetic",
        userId: "system-user",
        role: "admin",
      };
      records = await makeRecords(ctx, () => new Date(instant));
      viewId = (await records.listViews(api)).find((v) => v.isDefault)?.id ?? "";
      record = await records.create(api, module.buildMinimalValidInput());
    });
    it("matches direct creation, actor scope and half-open period boundaries", async () => {
      expect(await ids({ recordAction: { action: "created", period } })).toContain(record.id);
      expect(await ids({ recordAction: { action: "updated", period } })).not.toContain(record.id);
      expect(await ids({ touched: { period, actorIds: [] } })).toContain(record.id);
      expect(await ids({ touched: { period, actorIds: [ctx.userId] } })).toContain(record.id);
      const other = await makeRecords({ ...ctx, userId: "other-member" }, () => new Date(instant));
      expect(await ids({ touched: { period, actorIds: ["other-member"] } })).not.toContain(
        record.id,
      );
      instant = period.to;
      await other.update(api, record.id, {
        [module.filterMarker.field]: module.filterMarker.updated,
      });
      expect(await ids({ recordAction: { action: "updated", period } })).not.toContain(record.id);
      const later = { from: period.to, to: "2026-10-03T00:00:00Z" };
      expect(
        await ids({
          recordAction: { action: "updated", period: later, actorIds: ["other-member"] },
        }),
      ).toContain(record.id);
      expect(
        await ids({ recordAction: { action: "updated", period: later, actorIds: [ctx.userId] } }),
      ).not.toContain(record.id);
    });
    it("ANDs restrictions, returns the untouched complement and aligns count and summary", async () => {
      const touched = { touched: { period } };
      const untouched = { untouched: { period } };
      const all = await records.count(api, { viewId });
      expect(
        (await records.count(api, { viewId, systemFilters: touched })) +
          (await records.count(api, { viewId, systemFilters: untouched })),
      ).toBe(all);
      expect(await ids(untouched)).not.toContain(record.id);
      expect(await ids({ ...touched, ...untouched })).toEqual([]);
      const restriction = {
        ...query(touched),
        filters: {
          field: module.filterMarker.field,
          comparator: "equal",
          value: "no-match-system-marker",
        } as const,
      };
      expect((await records.list(api, restriction)).records).toEqual([]);
      expect(await records.count(api, restriction)).toBe(0);
      const result = await records.list(api, query(touched));
      expect(await records.count(api, query(touched))).toBe(result.records.length);
      const picklist = (await records.getModule(api)).fields.find((f) => f.dataType === "picklist");
      if (picklist) {
        const groups = await records.summarize(api, {
          ...query(touched),
          groupBy: picklist.apiName,
        });
        expect(groups.reduce((sum, group) => sum + group.count, 0)).toBe(result.records.length);
      }
      expect(await records.count(api, { viewId, systemFilters: {} })).toBe(all);
      for (const view of await records.listViews(api)) {
        if (!view.criteria) continue;
        const baseline = await records.list(api, { ...query({}), viewId: view.id });
        const filtered = await records.list(api, { ...query(touched), viewId: view.id });
        expect(filtered.records.map((r) => r.id)).toEqual(
          baseline.records.filter((r) => r.id === record.id).map((r) => r.id),
        );
      }
    });
    it("matches locked records and treats a missing flag as false", async () => {
      expect(await ids({ locked: { locked: false }, touched: { period } })).toContain(record.id);
      expect(await ids({ locked: { locked: true }, touched: { period } })).not.toContain(record.id);
      const locked = await ids({ locked: { locked: true } });
      expect(locked.length).toBeGreaterThan(0);
      expect(await ids({ locked: { locked: false } })).not.toEqual(expect.arrayContaining(locked));
    });
    it("matches related note additions without treating them as direct creation", async () => {
      instant = "2026-10-01T12:00:00Z";
      const notePeriod = { from: instant, to: period.to };
      const filter = {
        relatedRecordsAction: { module: "Notes", action: "added", period: notePeriod },
      } as const;
      expect(await ids(filter)).not.toContain(record.id);
      await records.create("Notes", {
        Parent_Id: { module: api, id: record.id },
        Note_Content: "Synthetic note",
      });
      expect(await ids(filter)).toContain(record.id);
      expect(await ids({ recordAction: { action: "created", period: notePeriod } })).not.toContain(
        record.id,
      );
      expect(await ids({ touched: { period: notePeriod } })).toContain(record.id);
      expect(await ids({ untouched: { period: notePeriod } })).not.toContain(record.id);
    });
    it("never matches another organization's history for overlapping fixture IDs", async () => {
      const foreign = await makeRecords({ ...ctx, orgId: randomUUID() }, () => new Date(instant));
      const foreignRecord = await foreign.create(api, module.buildMinimalValidInput());
      expect(foreignRecord.id).toBe(record.id);
      instant = "2026-10-01T12:00:00Z";
      await foreign.update(api, foreignRecord.id, {
        [module.filterMarker.field]: module.filterMarker.updated,
      });
      expect(await ids({ recordAction: { action: "updated", period } })).not.toContain(record.id);
      expect(await ids({ untouched: { period: { from: instant, to: period.to } } })).toContain(
        record.id,
      );
    });
    it("rejects context-invalid actors, related modules and conversion", async () => {
      const invalid: unknown[] = [
        { touched: { period, actorIds: ["non-member"] } },
        { relatedRecordsAction: { module: api, action: "added", period } },
        ...(api === "Leads" ? [] : [{ recordAction: { action: "converted", period } }]),
      ];
      for (const systemFilters of invalid) {
        await expect(
          records.list(api, query(systemFilters as SystemFiltersValue)),
        ).rejects.toBeInstanceOf(ValidationError);
        await expect(
          records.count(api, query(systemFilters as SystemFiltersValue)),
        ).rejects.toBeInstanceOf(ValidationError);
      }
    });
  });
}
