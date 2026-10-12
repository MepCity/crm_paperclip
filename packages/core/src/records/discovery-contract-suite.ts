import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RecordLockedError,
  ValidationError,
} from "../errors";
import type { OrgContext } from "../tenancy/types";
import type { RecordInput, RecordService } from "./contract";

type Factory = (ctx: OrgContext, options?: { now?: () => Date }) => RecordService;
export function describeDiscoveryContract(label: string, factory: Factory) {
  const context = (): OrgContext => ({
    orgId: randomUUID(),
    orgSlug: "discovery-test",
    orgName: "Discovery Test",
    userId: "test-user",
    role: "admin",
  });
  const make = () => factory(context());
  describe(`${label} search and duplicate contract`, () => {
    it("rule 1: trims edges, requires three characters and preserves internal spaces", async () => {
      const service = make();
      const record = await service.create("Contacts", { Last_Name: "Space  Sample" });
      for (const text of ["", "  ab  "])
        await expect(service.search({ text })).rejects.toBeInstanceOf(ValidationError);
      expect(
        (await service.search({ text: "  space  sample  " }))[0]?.records.map((row) => row.id),
      ).toContain(record.id);
      expect(await service.search({ text: "space sample" })).toEqual([]);
    });
    it("rules 2–3: searches supported values and lookup names; name scope excludes other fields", async () => {
      const service = make();
      const target = await service.create("Contacts", { Last_Name: "Lookup Marker" });
      const record = await service.create("Contacts", {
        Last_Name: "Search Sample",
        Phone: "555901234",
        Email: "marker@example.test",
        Mailing_Latitude: 123.456,
        Reporting_To: { module: "Contacts", id: target.id },
      });
      for (const text of ["555901", "MARKER@", "123.4", "lookup marker"]) {
        const groups = await service.search({ text, modules: ["Contacts"] });
        expect(groups[0]?.records.map((row) => row.id)).toContain(record.id);
      }
      expect(await service.search({ text: "555901", scope: "nameOrTags" })).toEqual([]);
      expect((await service.search({ text: "search sample", scope: "nameOrTags" }))[0]?.total).toBe(
        1,
      );
    });
    it("rule 4: groups, filters, sorts, pages and projects independently without leaking tenants", async () => {
      const service = make();
      for (const module of ["Leads", "Contacts"])
        for (const First_Name of ["Alpha", "Beta", "Gamma"])
          await service.create(module, {
            Last_Name: "Grouped Marker",
            First_Name,
            ...(module === "Leads" ? { Company: "Test Company" } : {}),
          });
      const query = {
        text: "grouped marker",
        perPage: 1,
        page: 2,
        sort: { field: "First_Name", order: "asc" as const },
        fields: ["First_Name"],
      };
      const groups = await service.search(query);
      expect(groups.map((group) => group.module).sort()).toEqual(["Contacts", "Leads"]);
      for (const group of groups) {
        expect(group.total).toBe(3);
        expect(group.records).toHaveLength(1);
        expect(group.records[0]?.fields).toEqual({ First_Name: "Beta" });
      }
      expect(
        (
          await service.search({
            text: query.text,
            modules: ["Contacts"],
            filters: { field: "First_Name", comparator: "equal", value: "Alpha" },
          })
        )[0]?.total,
      ).toBe(1);
      expect(await make().search({ text: query.text })).toEqual([]);
      expect((await service.search({ ...query, page: 10 }))[0]?.records).toEqual([]);
    });
    it("rule 5: rejects invalid sets, foreign module, foreign organization and missing IDs atomically", async () => {
      const service = make();
      const master = await service.create("Contacts", { Last_Name: "Master" });
      const duplicate = await service.create("Contacts", { Last_Name: "Duplicate" });
      const lead = await service.create("Leads", {
        Last_Name: "Other Module",
        Company: "Test Company",
      });
      for (const duplicateIds of [[], [master.id], [duplicate.id, duplicate.id], ["a", "b", "c"]])
        await expect(
          service.merge("Contacts", { masterId: master.id, duplicateIds, values: {} }),
        ).rejects.toBeInstanceOf(ValidationError);
      // Fixture IDs are tenant-local; make the foreign ID absent in this tenant.
      const foreignService = make();
      await expect(
        foreignService.merge("Contacts", {
          masterId: master.id,
          duplicateIds: [duplicate.id],
          values: {},
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
      for (const id of [lead.id, "missing"])
        await expect(
          service.merge("Contacts", { masterId: master.id, duplicateIds: [id], values: {} }),
        ).rejects.toBeInstanceOf(NotFoundError);
      expect((await service.get("Contacts", duplicate.id)).id).toBe(duplicate.id);
    });
    it("rules 6–8: retains identity, chosen fields, oldest attribution and transfers references", async () => {
      const ctx = context();
      let now = new Date("2026-01-01T00:00:00Z");
      const service = factory(ctx, { now: () => now });
      const duplicate = await service.create("Contacts", { Last_Name: "Older", Phone: "555123" });
      now = new Date("2026-02-01T00:00:00Z");
      const caller = factory({ ...ctx, userId: "second-user" }, { now: () => now });
      const master = await caller.create("Contacts", { Last_Name: "Master", Title: "Retained" });
      const related = await service.create("Contacts", {
        Last_Name: "Related",
        Reporting_To: { module: "Contacts", id: duplicate.id },
      });
      for (const values of [
        { Created_By: "other" },
        { Created_Time: now.toISOString() },
        { id: "other" },
        { Locked__s: true },
      ] as RecordInput[])
        await expect(
          caller.merge("Contacts", { masterId: master.id, duplicateIds: [duplicate.id], values }),
        ).rejects.toBeInstanceOf(ValidationError);
      now = new Date("2026-03-01T00:00:00Z");
      const merged = await caller.merge("Contacts", {
        masterId: master.id,
        duplicateIds: [duplicate.id],
        values: { Last_Name: "Final", Phone: duplicate.fields.Phone ?? null },
      });
      expect(merged.id).toBe(master.id);
      expect(merged.fields).toMatchObject({
        Full_Name: "Final",
        Title: "Retained",
        Phone: "555123",
        Created_By: ctx.userId,
        Created_Time: duplicate.fields.Created_Time,
        Modified_By: "second-user",
        Modified_Time: now.toISOString(),
      });
      await expect(service.get("Contacts", duplicate.id)).rejects.toBeInstanceOf(NotFoundError);
      expect((await service.get("Contacts", related.id)).fields.Reporting_To).toEqual({
        module: "Contacts",
        id: master.id,
        name: "Final",
      });
    });
    it("rule 9: allows removed unique values, rejects surviving collisions without writes", async () => {
      const service = make();
      const master = await service.create("Contacts", { Last_Name: "Master" });
      const duplicate = await service.create("Contacts", {
        Last_Name: "Duplicate",
        Email: "removed@example.test",
      });
      await service.create("Contacts", { Last_Name: "Survivor", Email: "survivor@example.test" });
      await expect(
        service.merge("Contacts", {
          masterId: master.id,
          duplicateIds: [duplicate.id],
          values: { Email: "SURVIVOR@example.test" },
        }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect((await service.get("Contacts", master.id)).fields.Email).toBeNull();
      expect((await service.get("Contacts", duplicate.id)).fields.Email).toBe(
        "removed@example.test",
      );
      expect(
        (
          await service.merge("Contacts", {
            masterId: master.id,
            duplicateIds: [duplicate.id],
            values: { Email: "removed@example.test" },
          })
        ).fields.Email,
      ).toBe("removed@example.test");
    });
    it("rule 10: applies the existing update/delete lock permission to every record", async () => {
      const service = make();
      const view = (await service.listViews("Contacts")).find((view) => view.criteria === null);
      const rows = await service.list("Contacts", {
        viewId: view?.id ?? "",
        page: 1,
        perPage: 100,
      });
      const locked = rows.records.find((row) => row.fields.Locked__s === true);
      expect(locked).toBeDefined();
      const writable = await service.create("Contacts", { Last_Name: "Writable" });
      for (const [masterId, duplicateIds] of [
        [writable.id, [locked?.id ?? ""]],
        [locked?.id ?? "", [writable.id]],
      ] as const)
        await expect(
          service.merge("Contacts", { masterId, duplicateIds, values: {} }),
        ).rejects.toBeInstanceOf(RecordLockedError);
      expect((await service.get("Contacts", writable.id)).id).toBe(writable.id);
    });
    it("rule 11: matches 1–3 nonempty case-insensitive fields with all semantics", async () => {
      const service = make();
      for (const fields of [
        [],
        ["Last_Name", "Phone", "Title", "Department"],
        ["unknown"],
        ["Phone", "Phone"],
      ])
        await expect(service.findDuplicateGroups("Contacts", fields)).rejects.toBeInstanceOf(
          ValidationError,
        );
      const first = await service.create("Contacts", {
        Last_Name: "Grouping Marker",
        Phone: "ABC",
        Title: "one",
      });
      const second = await service.create("Contacts", {
        Last_Name: "grouping marker",
        Phone: "abc",
        Title: "ONE",
      });
      await service.create("Contacts", {
        Last_Name: "Grouping Marker",
        Phone: "different",
        Title: "one",
      });
      await service.create("Contacts", { Last_Name: "Grouping Marker", Title: "one" });
      for (const fields of [
        ["Last_Name", "Phone"],
        ["Last_Name", "Phone", "Title"],
      ]) {
        const groups = await service.findDuplicateGroups("Contacts", fields);
        expect(groups).toHaveLength(1);
        expect(groups[0]?.records.map((record) => record.id)).toEqual([first.id, second.id]);
      }
    });
    it("rules 12–13: fills blanks, keeps latest master and returns conflicts/large groups untouched", async () => {
      const ctx = context();
      let now = new Date("2026-01-01T00:00:00Z");
      const service = factory(ctx, { now: () => now });
      const older = await service.create("Contacts", {
        Last_Name: "Automatic Marker",
        Title: "Filled",
      });
      now = new Date("2026-02-01T00:00:00Z");
      const newer = await service.create("Contacts", { Last_Name: "Automatic Marker" });
      for (const Title of ["A", "B"])
        await service.create("Contacts", { Last_Name: "Conflicting Marker", Title });
      for (let i = 0; i < 4; i++) await service.create("Contacts", { Last_Name: "Large Marker" });
      const groups = await service.findDuplicateGroups("Contacts", ["Last_Name"]);
      expect(
        groups.find((group) => group.records.some((row) => row.id === older.id))?.conflictFields,
      ).toEqual([]);
      expect(
        groups.find((group) => group.records[0]?.fields.Last_Name === "Conflicting Marker")
          ?.conflictFields,
      ).toEqual(["Title"]);
      const result = await service.deduplicate("Contacts", ["Last_Name"]);
      expect(result.mergedGroups).toBe(1);
      expect(result.removedRecords).toBe(1);
      expect(result.conflicts).toHaveLength(2);
      expect((await service.get("Contacts", newer.id)).fields.Title).toBe("Filled");
      await expect(service.get("Contacts", older.id)).rejects.toBeInstanceOf(NotFoundError);
      for (const group of result.conflicts)
        for (const record of group.records)
          expect((await service.get("Contacts", record.id)).id).toBe(record.id);
    });
    it("rules 5, 6, 12–13: merges a three-record group and retains the master's nonempty spelling", async () => {
      const ctx = context();
      let now = new Date("2026-01-01T00:00:00Z");
      const service = factory(ctx, { now: () => now });
      const first = await service.create("Contacts", {
        Last_Name: "Triple Marker",
        Title: "SENIOR",
      });
      const second = await service.create("Contacts", { Last_Name: "Triple Marker" });
      now = new Date("2026-02-01T00:00:00Z");
      const master = await service.create("Contacts", {
        Last_Name: "Triple Marker",
        Title: "Senior",
      });
      const result = await service.deduplicate("Contacts", ["Last_Name"]);
      expect(result).toEqual({ mergedGroups: 1, removedRecords: 2, conflicts: [] });
      expect((await service.get("Contacts", master.id)).fields.Title).toBe("Senior");
      for (const row of [first, second])
        await expect(service.get("Contacts", row.id)).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        service.search({ text: "marker", modules: ["constructor"] }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
    it("rules 6–8: a lookup on the master that pointed at a duplicate is nulled, not self-pointed", async () => {
      const service = make();
      const duplicate = await service.create("Contacts", { Last_Name: "Self Marker" });
      const survivor = await service.create("Contacts", { Last_Name: "Self Marker Survivor" });
      const master = await service.create("Contacts", {
        Last_Name: "Self Marker Master",
        Reporting_To: { module: "Contacts", id: duplicate.id },
      });
      const related = await service.create("Contacts", {
        Last_Name: "Self Marker Related",
        Reporting_To: { module: "Contacts", id: duplicate.id },
      });
      const merged = await service.merge("Contacts", {
        masterId: master.id,
        duplicateIds: [duplicate.id],
        values: {},
      });
      expect(merged.fields.Reporting_To).toBeNull();
      expect((await service.get("Contacts", related.id)).fields.Reporting_To).toMatchObject({
        module: "Contacts",
        id: master.id,
      });
      const explicit = await service.merge("Contacts", {
        masterId: related.id,
        duplicateIds: [survivor.id],
        values: { Reporting_To: { module: "Contacts", id: master.id } },
      });
      expect(explicit.fields.Reporting_To).toMatchObject({ module: "Contacts", id: master.id });
    });
    it("rules 6, 8, 12–13: the automatic merge blanks a master pointer at its own duplicate", async () => {
      const ctx = context();
      let now = new Date("2026-01-01T00:00:00Z");
      const service = factory(ctx, { now: () => now });
      const duplicate = await service.create("Contacts", { Last_Name: "Auto Self Marker" });
      now = new Date("2026-02-01T00:00:00Z");
      const master = await service.create("Contacts", {
        Last_Name: "auto self marker",
        Reporting_To: { module: "Contacts", id: duplicate.id },
      });
      const result = await service.deduplicate("Contacts", ["Last_Name"]);
      expect(result.mergedGroups).toBe(1);
      expect(result.removedRecords).toBe(1);
      expect(result.conflicts).toEqual([]);
      expect((await service.get("Contacts", master.id)).fields.Reporting_To).toBeNull();
    });
    it("rules 12–13: a rejected group stays untouched and the run keeps merging later groups", async () => {
      const service = make();
      const view = (await service.listViews("Contacts")).find(
        (candidate) => candidate.criteria === null,
      );
      const rows = await service.list("Contacts", {
        viewId: view?.id ?? "",
        page: 1,
        perPage: 100,
      });
      const locked = rows.records.find((record) => record.fields.Locked__s === true);
      expect(locked).toBeDefined();
      const twin = await service.create("Contacts", {
        Last_Name: String(locked?.fields.Last_Name),
      });
      await service.create("Contacts", { Last_Name: "Deferred Marker" });
      await service.create("Contacts", { Last_Name: "Deferred Marker" });
      const groups = await service.findDuplicateGroups("Contacts", ["Last_Name"]);
      const pair = groups.find((group) =>
        group.records.some((record) => record.id === (locked?.id ?? "")),
      );
      expect(pair?.conflictFields).toEqual([]);
      const result = await service.deduplicate("Contacts", ["Last_Name"]);
      expect(result.mergedGroups).toBe(1);
      expect(result.removedRecords).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]?.records.map((record) => record.id).sort()).toEqual(
        [locked?.id, twin.id].sort(),
      );
      expect((await service.get("Contacts", twin.id)).id).toBe(twin.id);
      expect((await service.get("Contacts", locked?.id ?? "")).id).toBe(locked?.id);
    });
    it("rule 14: only existing administrators may deduplicate", async () => {
      const service = factory({ ...context(), role: "member" });
      await expect(service.deduplicate("Contacts", ["Last_Name"])).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });
    it("rule 15: shares the per-module lock across service instances and releases it", async () => {
      const ctx = context();
      const first = factory(ctx);
      const second = factory(ctx);
      await first.create("Contacts", { Last_Name: "Concurrent Marker" });
      await first.create("Contacts", { Last_Name: "Concurrent Marker" });
      const results = await Promise.allSettled([
        first.deduplicate("Contacts", ["Last_Name"]),
        second.deduplicate("Contacts", ["Last_Name"]),
      ]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(results.find((result) => result.status === "rejected")).toMatchObject({
        reason: expect.any(ConflictError),
      });
      await expect(second.deduplicate("Contacts", ["Last_Name"])).resolves.toMatchObject({
        mergedGroups: 0,
      });
      await expect(first.deduplicate("Contacts", [])).rejects.toBeInstanceOf(ValidationError);
      await expect(second.deduplicate("Contacts", ["Last_Name"])).resolves.toBeDefined();
    });
  });
}
