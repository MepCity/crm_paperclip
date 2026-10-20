import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../../errors";
import { createFixtureRecordService } from "./index";

const period = { from: "2026-10-01T00:00:00Z", to: "2026-10-02T00:00:00Z" };
const context = () => ({
  orgId: randomUUID(),
  orgSlug: "related-history",
  orgName: "Synthetic",
  userId: "user",
  role: "admin" as const,
});
describe("system filter related history", () => {
  it("evaluates child create, update, delete and reparent events", async () => {
    let time = period.from;
    const service = createFixtureRecordService(context(), { now: () => new Date(time) });
    const a = await service.create("Leads", { Last_Name: "Parent", Company: "Synthetic" });
    const b = await service.create("Leads", { Last_Name: "Other", Company: "Synthetic" });
    time = "2026-10-01T12:00:00Z";
    const task = await service.create("Tasks", {
      Subject: "Synthetic task",
      Who_Id: { module: "Leads", id: a.id },
    });
    const count = (action: "added" | "updated" | "deleted") =>
      service.count("Leads", {
        viewId: "all-leads",
        systemFilters: { relatedRecordsAction: { module: "Tasks", action, period } },
      });
    expect(await count("added")).toBe(1);
    expect(await count("updated")).toBe(0);
    await service.update("Tasks", task.id, { Subject: "Changed task" });
    expect(await count("updated")).toBe(1);
    await service.update("Tasks", task.id, { Who_Id: { module: "Leads", id: b.id } });
    expect(await count("added")).toBe(2);
    expect(await count("deleted")).toBe(1);
    await service.delete("Tasks", [task.id]);
    expect(await count("deleted")).toBe(2);
  });
  it("suppresses deleted notes and never exposes unreadable parents", async () => {
    const ctx = context();
    const service = createFixtureRecordService(ctx, { now: () => new Date(period.from) });
    const parent = await service.create("Leads", { Last_Name: "Parent", Company: "Synthetic" });
    const note = await service.create("Notes", {
      Parent_Id: { module: "Leads", id: parent.id },
      Note_Content: "Synthetic",
    });
    const query = {
      viewId: "all-leads",
      systemFilters: { relatedRecordsAction: { module: "Notes", action: "added", period } },
    } as const;
    expect(await service.count("Leads", query)).toBe(1);
    const denied = createFixtureRecordService(ctx, {
      canReadRecord: (_module, id) => id !== parent.id,
    });
    expect(await denied.count("Leads", query)).toBe(0);
    await service.delete("Notes", [note.id]);
    expect(await service.count("Leads", query)).toBe(0);
  });
  it("records attachments only after publication and rolls back failed history appends", async () => {
    const ctx = context();
    const options = { now: () => new Date(period.from) };
    const service = createFixtureRecordService(ctx, options);
    const parent = await service.create("Leads", { Last_Name: "Parent", Company: "Synthetic" });
    const attachment = await service.create("Attachments", {
      Parent_Id: { module: "Leads", id: parent.id },
      File_Name: "example.pdf",
      Size: "12",
    });
    const count = (action: "added" | "deleted") =>
      service.count("Leads", {
        viewId: "all-leads",
        systemFilters: { relatedRecordsAction: { module: "Attachments", action, period } },
      });
    const data = {
      storageKey: "opaque-key",
      checksum: "synthetic-checksum",
      mediaType: "application/pdf",
    };
    expect(await count("added")).toBe(0);
    const fail = createFixtureRecordService(ctx, {
      ...options,
      beforeHistoryAppend: () => {
        throw new Error("append failed");
      },
    });
    expect(() => fail.attachmentLifecycle.publish(attachment.id, data)).toThrow("append failed");
    expect(service.attachmentLifecycle.isReady(attachment.id)).toBe(false);
    expect(await count("added")).toBe(0);
    service.attachmentLifecycle.publish(attachment.id, data);
    expect(await count("added")).toBe(1);
    expect(await count("deleted")).toBe(0);
    await service.delete("Attachments", [attachment.id]);
    expect(await count("deleted")).toBe(1);
  });
  it("moves a note's original event with its parent during merge", async () => {
    const ctx = context();
    const service = createFixtureRecordService(ctx, { now: () => new Date(period.from) });
    const master = await service.create("Leads", { Last_Name: "Master", Company: "Synthetic" });
    const other = await service.create("Leads", { Last_Name: "Other", Company: "Synthetic" });
    await service.create("Notes", {
      Parent_Id: { module: "Leads", id: other.id },
      Note_Content: "Synthetic",
    });
    await service.merge("Leads", { masterId: master.id, duplicateIds: [other.id], values: {} });
    const page = await service.list("Leads", {
      viewId: "all-leads",
      page: 1,
      perPage: 10,
      systemFilters: { relatedRecordsAction: { module: "Notes", action: "added", period } },
    });
    expect(page.records.map((r) => r.id)).toEqual([master.id]);
  });
  it("projects live note content without storing bodies or hiding the existing timeline row", async () => {
    const ctx = context();
    const service = createFixtureRecordService(ctx, {
      now: () => new Date(period.from),
      beforeHistoryAppend: (events) => {
        for (const event of events.filter((e) => e.kind === "note_added"))
          expect(event.payload).toBeNull();
      },
    });
    const parent = await service.create("Leads", { Last_Name: "Parent", Company: "Synthetic" });
    const note = await service.create("Notes", {
      Parent_Id: { module: "Leads", id: parent.id },
      Note_Content: "Original note",
      Note_Title: "Original title",
    });
    const first = (await service.history.list("Leads", parent.id, { perPage: 25 })).events.find(
      (e) => e.kind === "note_added",
    );
    expect(first).toMatchObject({
      subject: { name: "Original title" },
      payload: { body: "Original note" },
    });
    await service.update("Notes", note.id, {
      Note_Content: "Edited note",
      Note_Title: "Edited title",
    });
    const next = (await service.history.list("Leads", parent.id, { perPage: 25 })).events.filter(
      (e) => e.kind === "note_added",
    );
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      id: first?.id,
      occurredAt: first?.occurredAt,
      subject: { name: "Edited title" },
      payload: { body: "Edited note" },
    });
    const hidden = createFixtureRecordService(ctx, {
      canReadField: (module) => module !== "Notes",
    });
    expect(
      (await hidden.history.list("Leads", parent.id, { perPage: 25 })).events.find(
        (e) => e.kind === "note_added",
      ),
    ).toMatchObject({ payload: { body: "" } });
  });
  it("treats an empty system filter as absent", async () => {
    const ctx = context();
    const service = createFixtureRecordService(ctx, { canReadRecord: () => false });
    const count = await service.count("Leads", { viewId: "all-leads" });
    expect(await service.count("Leads", { viewId: "all-leads", systemFilters: {} })).toBe(count);
  });
  it("validates live organization membership and registered related modules", async () => {
    const ctx = context();
    let members = [ctx.userId];
    const service = createFixtureRecordService(ctx, { listMemberIds: async () => members });
    const query = {
      viewId: "all-leads",
      systemFilters: { touched: { actorIds: [ctx.userId], period } },
    };
    expect(await service.count("Leads", query)).toBe(0);
    members = [];
    await expect(service.count("Leads", query)).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.count("Campaigns", {
        viewId: "all-campaigns",
        systemFilters: { relatedRecordsAction: { module: "Tasks", action: "added", period } },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
