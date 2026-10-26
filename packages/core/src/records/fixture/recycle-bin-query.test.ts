import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type { RecycleBinEntry, RecycleBinQuery } from "../recycle-bin";
import { createFixtureRecordService } from ".";

function setup() {
  const ctx: OrgContext = {
    orgId: randomUUID(),
    orgSlug: "test",
    orgName: "Test",
    userId: "Operator.Alpha",
    role: "admin",
  };
  let instant = "2026-10-16T00:00:00Z";
  const service = createFixtureRecordService(ctx, { now: () => new Date(instant) });
  return {
    ctx,
    service,
    async remove(at: string, actor = ctx.userId, name = "Query target") {
      instant = at;
      const writer = createFixtureRecordService(
        { ...ctx, userId: actor },
        { now: () => new Date(instant) },
      );
      const row = await writer.create("Leads", { Last_Name: name, Company: "Example" });
      await writer.delete("Leads", [row.id]);
      return row.id;
    },
  };
}

const recordIds = (result: { entries: readonly RecycleBinEntry[] }) =>
  result.entries.map((entry) => entry.recordId);

describe("recycle bin search query contract", () => {
  it("matches actors by case-insensitive substring and retains exact equality", async () => {
    const { service, remove } = setup();
    const alpha = await remove("2026-10-16T12:00:00Z");
    const beta = await remove("2026-10-16T12:01:00Z", "Operator.Beta");
    expect(recordIds(await service.recycleBin.list({ deletedByContains: "ATOR.aLP" }))).toEqual([
      alpha,
    ]);
    expect(await service.recycleBin.list({ deletedByContains: "missing" })).toEqual({
      entries: [],
      total: 0,
    });
    expect(recordIds(await service.recycleBin.list({ deletedBy: "Operator.Beta" }))).toEqual([
      beta,
    ]);
    expect((await service.recycleBin.list({ deletedBy: "operator.beta" })).total).toBe(0);
    expect(
      (await service.recycleBin.list({ deletedBy: "Operator.Beta", deletedByContains: "Alpha" }))
        .total,
    ).toBe(0);
    expect((await service.recycleBin.list({ deletedByContains: "" })).total).toBe(2);
  });

  it("uses UTC day boundaries including offset instants, before paging and counting", async () => {
    const { service, remove } = setup();
    await remove("2026-10-16T02:59:59.999+03:00");
    const first = await remove("2026-10-16T03:00:00+03:00");
    const last = await remove("2026-10-16T23:59:59.999Z");
    await remove("2026-10-17T03:00:00+03:00");
    const query: RecycleBinQuery = {
      deletedOn: { date: "2026-10-16" },
      deletedByContains: "ALPHA",
      module: "Leads",
      name: "query",
      perPage: 1,
    };
    const page1 = await service.recycleBin.list(query);
    expect(page1.total).toBe(2);
    expect(recordIds(page1)).toEqual([last]);
    const page2 = await service.recycleBin.list({ ...query, page: 2 });
    expect(page2.total).toBe(2);
    expect(recordIds(page2)).toEqual([first]);
    expect(await service.recycleBin.list({ ...query, page: 3 })).toEqual({ entries: [], total: 2 });
  });

  it("matches exactly one UTC minute with inclusive start and exclusive end", async () => {
    const { service, remove } = setup();
    await remove("2026-10-16T12:33:59.999Z");
    const start = await remove("2026-10-16T15:34:00+03:00");
    const end = await remove("2026-10-16T12:34:59.999Z");
    await remove("2026-10-16T12:35:00Z");
    expect(
      recordIds(
        await service.recycleBin.list({ deletedOn: { date: "2026-10-16", time: "12:34" } }),
      ),
    ).toEqual([end, start]);
    expect(
      (await service.recycleBin.list({ deletedOn: { date: "2026-10-15", time: "12:34" } })).total,
    ).toBe(0);
  });

  it("accepts leap days and the first and last minute of a day", async () => {
    const { service, remove } = setup();
    const first = await remove("2024-02-29T00:00:00Z");
    const last = await remove("2024-02-29T23:59:59.999Z");
    expect(
      recordIds(
        await service.recycleBin.list({ deletedOn: { date: "2024-02-29", time: "00:00" } }),
      ),
    ).toEqual([first]);
    expect(
      recordIds(
        await service.recycleBin.list({ deletedOn: { date: "2024-02-29", time: "23:59" } }),
      ),
    ).toEqual([last]);
  });

  it.each([
    null,
    "2026-10-16",
    [],
    {},
    { date: null },
    { date: 20261016 },
    { date: "" },
    { date: "16.10.2026" },
    { date: "2026-2-01" },
    { date: "2026-02-29" },
    { date: "2024-02-30" },
    { date: "2026-04-31" },
    { date: "2026-00-01" },
    { date: "2026-13-01" },
    { date: "2026-10-00" },
    ...["", "24:00", "12:60", "1:00", "12:00:00", "01:00 AM", " 12:00", null, 1200].map((time) => ({
      date: "2026-10-16",
      time,
    })),
  ])("rejects invalid deletedOn input %j even with an empty bin", async (deletedOn) => {
    const { service } = setup();
    await expect(service.recycleBin.list({ deletedOn } as RecycleBinQuery)).rejects.toMatchObject({
      code: "validation",
      fieldErrors: { deletedOn: expect.any(Array) },
    });
  });

  it("rejects non-string actor substrings", async () => {
    const { service } = setup();
    await expect(
      service.recycleBin.list({ deletedByContains: 42 } as unknown as RecycleBinQuery),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("preserves tenant and member visibility before filtered totals and pagination", async () => {
    const a = setup();
    const b = setup();
    const own = await a.remove("2026-10-16T12:00:00Z");
    await a.remove("2026-10-16T12:01:00Z", "Operator.Beta");
    await b.remove("2026-10-16T12:02:00Z");
    const query: RecycleBinQuery = {
      deletedByContains: "Operator",
      deletedOn: { date: "2026-10-16", time: "12:00" },
      perPage: 1,
    };
    expect(recordIds(await a.service.recycleBin.list(query))).toEqual([own]);
    expect(await b.service.recycleBin.list(query)).toEqual({ entries: [], total: 0 });
    const member = createFixtureRecordService(
      { ...a.ctx, role: "member" },
      { now: () => new Date("2026-10-16T12:02:00Z") },
    );
    const visible = await member.recycleBin.list({ ...query, deletedOn: { date: "2026-10-16" } });
    expect(visible.total).toBe(1);
    expect(recordIds(visible)).toEqual([own]);
    expect((await member.recycleBin.list({ ...query, deletedByContains: "Beta" })).total).toBe(0);
  });
});
