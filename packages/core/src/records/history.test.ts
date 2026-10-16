import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NotFoundError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import { describeRecordHistoryContract } from "./contract-suite";
import * as definitions from "./contract-suite-module";
import { createFixtureRecordHistoryService, createFixtureRecordService } from "./fixture";
import { fixtureHistoryReader } from "./fixture/history-read";
import { fixtureHistoryStore } from "./fixture/history-store";
import { fixtureModules } from "./fixture/registry";
import type { RecordHistoryEvent } from "./history";

const context = (): OrgContext => ({
  orgId: randomUUID(),
  orgSlug: "history-test",
  orgName: "History Test",
  userId: "history-user",
  role: "admin",
});
for (const definition of Object.values(definitions)) {
  describeRecordHistoryContract(
    "fixture",
    createFixtureRecordService,
    createFixtureRecordHistoryService,
    definition,
  );
}
const input = (name = "History Person") => ({ Last_Name: name, Company: "History Company" });
describe("fixture atomic history", () => {
  it("rolls back records, IDs, cascades and history on append failure", async () => {
    const ctx = context();
    const records = createFixtureRecordService(ctx);
    const a = await records.create("Leads", input());
    const b = await records.create("Leads", input("Second Person"));
    const before = await records.history.list("Leads", a.id, { perPage: 25 });
    createFixtureRecordService({ ...ctx, userId: "new-owner" });
    const fail = createFixtureRecordService(ctx, {
      beforeHistoryAppend: () => {
        throw new Error("append failed");
      },
    });
    for (const write of [
      () => fail.create("Leads", input()),
      () => fail.update("Leads", a.id, { Company: "Changed" }),
      () => fail.massUpdate("Leads", [a.id, b.id], { Company: "Changed" }),
      () => fail.changeOwner("Leads", [a.id, b.id], "new-owner"),
      () => fail.delete("Leads", [a.id]),
      () => fail.merge("Leads", { masterId: a.id, duplicateIds: [b.id], values: {} }),
    ]) {
      await expect(write()).rejects.toThrow("append failed");
      expect(await records.get("Leads", a.id)).toEqual(a);
      expect(await records.get("Leads", b.id)).toEqual(b);
      expect(await records.history.list("Leads", a.id, { perPage: 25 })).toEqual(before);
    }
    const next = await records.create("Leads", input());
    expect(BigInt(next.id)).toBe(BigInt(b.id) + 1n);
  });
  it("rolls back a hook that mutates other module records then throws", async () => {
    const records = createFixtureRecordService(context());
    const a = await records.create("Leads", input());
    const bundle = fixtureModules.Leads;
    if (!bundle) throw new Error("Missing module");
    const original = bundle.afterWrite;
    const contacts = await records.list("Contacts", {
      viewId: (await records.listViews("Contacts"))[0]?.id ?? "",
      page: 1,
      perPage: 10,
    });
    bundle.afterWrite = (record, previous, ctx) => {
      original?.(record, previous, ctx);
      ctx.moduleStore("Contacts").records.clear();
      throw new Error("hook failed");
    };
    try {
      await expect(records.update("Leads", a.id, { Company: "Changed" })).rejects.toThrow(
        "hook failed",
      );
      expect(await records.get("Leads", a.id)).toEqual(a);
      expect(
        await records.list("Contacts", {
          viewId: (await records.listViews("Contacts"))[0]?.id ?? "",
          page: 1,
          perPage: 10,
        }),
      ).toEqual(contacts);
      expect((await records.history.list("Leads", a.id, { perPage: 25 })).events).toHaveLength(1);
    } finally {
      bundle.afterWrite = original;
    }
  });
  it("redacts current field and lookup permissions, refills pages and rechecks parent access", async () => {
    const ctx = context();
    const records = createFixtureRecordService(ctx);
    const record = await records.create("Leads", input());
    await records.update("Leads", record.id, { Company: "Private Company" });
    await records.update("Leads", record.id, { Phone: "5550101" });
    let hidden = false;
    let readable = true;
    const history = createFixtureRecordHistoryService(ctx, {
      canReadField: (_, field) => !hidden || field !== "Company",
      canReadRecord: () => readable,
    });
    const page = await history.list("Leads", record.id, { perPage: 1 });
    hidden = true;
    const next = await history.list("Leads", record.id, {
      perPage: 1,
      pageToken: page.nextPageToken,
    });
    expect(next.events[0]?.kind).toBe("record_created");
    expect(next.moreRecords).toBe(false);
    expect(JSON.stringify(next)).not.toContain("Private Company");
    readable = false;
    await expect(
      history.list("Leads", record.id, { perPage: 1, pageToken: "bad" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
  it("correlates owner/mass batches and merge while preserving typed null diffs", async () => {
    const ctx = context();
    const records = createFixtureRecordService(ctx);
    const a = await records.create("Leads", input());
    const b = await records.create("Leads", input("Second Person"));
    createFixtureRecordService({ ...ctx, userId: "second-owner" });
    await records.changeOwner("Leads", [a.id, b.id], "second-owner");
    const first = (await records.history.list("Leads", a.id, { perPage: 25 })).events[0];
    const second = (await records.history.list("Leads", b.id, { perPage: 25 })).events[0];
    expect(first?.operationId).toBe(second?.operationId);
    expect(first?.sequence).toBe(second?.sequence);
    expect(first?.ordinal).not.toBe(second?.ordinal);
    expect(first?.changes).toEqual([
      expect.objectContaining({ apiName: "Owner", old: ctx.userId, new: "second-owner" }),
    ]);
    await records.massUpdate("Leads", [a.id, b.id], { Company: null });
    expect((await records.history.list("Leads", a.id, { perPage: 25 })).events[0]?.changes).toEqual(
      [expect.objectContaining({ apiName: "Company", new: null, newDisplay: null })],
    );
    await records.merge("Leads", {
      masterId: a.id,
      duplicateIds: [b.id],
      values: { Company: "Merged Company" },
    });
    expect((await records.history.list("Leads", a.id, { perPage: 25 })).events[0]).toMatchObject({
      kind: "records_merged",
      mechanism: "merge",
      changes: [expect.objectContaining({ apiName: "Company", old: null, new: "Merged Company" })],
    });
    await expect(records.history.list("Leads", b.id, { perPage: 25 })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
  it("snapshots lookup display names, hides inaccessible targets and ignores display-only rename", async () => {
    const ctx = context();
    const records = createFixtureRecordService(ctx);
    const account = await records.create("Accounts", { Account_Name: "Original Account" });
    const contact = await records.create("Contacts", { Last_Name: "Example Contact" });
    await records.update("Contacts", contact.id, {
      Account_Name: { module: "Accounts", id: account.id },
    });
    const before = await records.history.list("Contacts", contact.id, { perPage: 25 });
    expect(before.events[0]?.changes[0]).toMatchObject({
      apiName: "Account_Name",
      newDisplay: "Original Account",
      new: { module: "Accounts", id: account.id, name: "Original Account" },
    });
    await records.update("Accounts", account.id, { Account_Name: "Renamed Account" });
    await records.update("Contacts", contact.id, {
      Account_Name: { module: "Accounts", id: account.id, name: "Renamed Account" },
    });
    expect((await records.history.list("Contacts", contact.id, { perPage: 25 })).events).toEqual(
      before.events,
    );
    const restricted = createFixtureRecordHistoryService(ctx, {
      canReadRecord: (module) => module !== "Accounts",
    });
    const page = await restricted.list("Contacts", contact.id, { perPage: 25 });
    expect(page.events.map((event) => event.kind)).toEqual(["record_created"]);
    expect(JSON.stringify(page)).not.toContain(account.id);
  });
  it("filters offset ISO bounds by instants and preserves source/actor snapshots", async () => {
    const ctx = context();
    const records = createFixtureRecordService(ctx, {
      now: () => new Date("2026-10-15T21:00:00Z"),
      source: "import",
      actorName: "Original Actor",
    });
    const a = await records.create("Leads", input());
    const page = await records.history.list("Leads", a.id, {
      perPage: 25,
      from: "2026-10-16T00:00:00+03:00",
      to: "2026-10-17T00:00:00+03:00",
      sources: ["import"],
    });
    expect(page.events).toHaveLength(1);
    expect(page.events[0]?.actor.name).toBe("Original Actor");
    expect(
      (await records.history.list("Leads", a.id, { perPage: 25, sources: ["api"] })).events,
    ).toEqual([]);
  });
  it("deduplicates identical internal appends and rejects conflicting batches atomically", async () => {
    const records = createFixtureRecordService(context());
    const record = await records.create("Leads", input());
    const event = (await records.history.list("Leads", record.id, { perPage: 25 })).events[0];
    if (!event) throw new Error("Missing event");
    const events = new Map<string, RecordHistoryEvent>();
    const store = fixtureHistoryStore(events);
    store.appendBatch([event, event]);
    store.appendBatch([structuredClone(event)]);
    expect(events.size).toBe(1);
    const fresh = { ...event, id: "fresh-event", operationId: "fresh-operation" };
    expect(() =>
      store.appendBatch([fresh, { ...event, actor: { id: "other-user", name: "Other User" } }]),
    ).toThrow("Conflicting history event");
    expect(events.size).toBe(1);
  });
  it("orders equal-time commits and rejects changed filters/streams without exposing cursor data", async () => {
    const records = createFixtureRecordService(context(), {
      now: () => new Date("2026-10-16T00:00:00Z"),
    });
    const a = await records.create("Leads", input());
    const b = await records.create("Leads", input("Second Person"));
    await records.update("Leads", a.id, { Company: "First" });
    await records.update("Leads", a.id, { Company: "Second" });
    const all = await records.history.list("Leads", a.id, { perPage: 25 });
    expect(new Set(all.events.map((event) => event.occurredAt)).size).toBe(1);
    expect(all.events.map((event) => event.sequence)).toEqual(
      [...all.events].map((event) => event.sequence).sort((a, b) => b - a),
    );
    const page = await records.history.list("Leads", a.id, { perPage: 1 });
    expect(page.nextPageToken).not.toContain("Second");
    await expect(
      records.history.list("Leads", b.id, { perPage: 1, pageToken: page.nextPageToken }),
    ).rejects.toThrow();
    await expect(
      records.history.list("Leads", a.id, {
        perPage: 1,
        pageToken: page.nextPageToken,
        sources: ["api"],
      }),
    ).rejects.toThrow();
  });
  it("continues a cursor after the anchor event has been purged", async () => {
    const ctx = context();
    const records = createFixtureRecordService(ctx);
    const record = await records.create("Leads", input());
    const original = (await records.history.list("Leads", record.id, { perPage: 25 })).events[0];
    if (!original) throw new Error("Missing event");
    const events = new Map(
      [1, 2, 3].map((sequence) => [
        String(sequence),
        { ...original, sequence, id: String(sequence) },
      ]),
    );
    const history = fixtureHistoryReader(
      ctx,
      () => fixtureHistoryStore(events),
      () => 3,
      () => {},
      () => true,
      {},
      new Map(),
    );
    const first = await history.list("Leads", record.id, { perPage: 1 });
    events.delete("3");
    const second = await history.list("Leads", record.id, {
      perPage: 1,
      pageToken: first.nextPageToken,
    });
    expect(second.events[0]?.id).toBe("2");
    expect(second.moreRecords).toBe(true);
  });
});
