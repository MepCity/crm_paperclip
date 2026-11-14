import { randomUUID } from "node:crypto";
import { describe, expect, it, type Mock, vi } from "vitest";
import { buildAccessSnapshot, standardPermissions } from "../access";
import { ForbiddenError, NotFoundError, RecordLockedForApprovalError } from "../errors";
import { createFixtureRecordService } from "./fixture";
import { type RecordWriteObserver, WriteObserverFailure } from "./write-observer";

const ctx = () => ({
  orgId: randomUUID(),
  orgSlug: "observer-test",
  orgName: "Observer",
  userId: "observer-user",
  role: "admin" as const,
});
const lead = { Last_Name: "Observed", Company: "Observer Co" };

function observer(overrides: Partial<RecordWriteObserver> = {}) {
  return {
    assertEditable: vi.fn(async () => {}),
    afterWrite: vi.fn(async () => {}),
    ...overrides,
  } as RecordWriteObserver & { assertEditable: Mock; afterWrite: Mock };
}

describe("record write observer", () => {
  it("sees user creates and edits with the previous record", async () => {
    const spy = observer();
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const created = await records.create("Leads", lead);
    expect(spy.afterWrite).toHaveBeenCalledWith(
      expect.objectContaining({ module: "Leads", kind: "create", previous: undefined }),
    );
    await records.update("Leads", created.id, { Company: "Changed Co" });
    const event = spy.afterWrite.mock.calls.at(-1)?.at(0) as never as {
      kind: string;
      previous: { fields: { Company: string } };
      record: { fields: { Company: string } };
    };
    expect(event.kind).toBe("edit");
    expect(event.previous.fields.Company).toBe("Observer Co");
    expect(event.record.fields.Company).toBe("Changed Co");
  });

  it("ignores imports, which carry source times", async () => {
    const spy = observer();
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    await records.create("Leads", lead, { sourceTimes: { createdTime: "2020-01-01T00:00:00Z" } });
    expect(spy.afterWrite).not.toHaveBeenCalled();
  });

  it("never fails the user's write when the observer throws", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const spy = observer({
      afterWrite: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const created = await records.create("Leads", lead);
    expect((await records.get("Leads", created.id)).id).toBe(created.id);
    quiet.mockRestore();
  });

  it("lets the lock refuse update, mass update, owner change and delete before writing", async () => {
    const spy = observer({
      assertEditable: vi.fn(async () => {
        throw new RecordLockedForApprovalError();
      }),
    });
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const { id } = await records.create("Leads", lead);
    await expect(records.update("Leads", id, { Company: "X" })).rejects.toBeInstanceOf(
      RecordLockedForApprovalError,
    );
    await expect(records.changeOwner("Leads", [id], "observer-user")).rejects.toBeInstanceOf(
      RecordLockedForApprovalError,
    );
    await expect(records.delete("Leads", [id])).rejects.toBeInstanceOf(
      RecordLockedForApprovalError,
    );
    expect(spy.assertEditable).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "delete", ids: [id] }),
    );
    expect((await records.get("Leads", id)).fields.Company).toBe("Observer Co");
  });

  it("undoes a create and rethrows when a fail-closed observer refuses it", async () => {
    const spy = observer({
      afterWrite: vi.fn(async () => {
        throw new WriteObserverFailure("approval down", new Error("NUL byte"));
      }),
    });
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const before = await records.list("Leads", { viewId: "all-leads", page: 1, perPage: 100 });
    await expect(records.create("Leads", lead)).rejects.toBeInstanceOf(WriteObserverFailure);
    const after = await records.list("Leads", { viewId: "all-leads", page: 1, perPage: 100 });
    expect(after.records.map((record) => record.id)).toEqual(
      before.records.map((record) => record.id),
    );
  });

  it("undoes an edit, a mass update and an owner change refused by a fail-closed observer", async () => {
    let refuse = false;
    const spy = observer({
      afterWrite: vi.fn(async () => {
        if (refuse) throw new WriteObserverFailure("approval down");
      }),
    });
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const { id } = await records.create("Leads", lead);
    refuse = true;
    await expect(records.update("Leads", id, { Company: "Changed" })).rejects.toBeInstanceOf(
      WriteObserverFailure,
    );
    await expect(
      records.massUpdate("Leads", [id], { Lead_Status: "Contacted" }),
    ).rejects.toBeInstanceOf(WriteObserverFailure);
    await expect(records.changeOwner("Leads", [id], "observer-user")).rejects.toBeInstanceOf(
      WriteObserverFailure,
    );
    const stored = await records.get("Leads", id);
    expect(stored.fields.Company).toBe("Observer Co");
    expect(stored.fields.Lead_Status).not.toBe("Contacted");
  });

  it("keeps a write that committed while a refused one waited, and reverts only its own row", async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let hold = true;
    const spy = observer({
      afterWrite: vi.fn(async (event) => {
        if (hold && event.kind === "edit") {
          hold = false;
          await gate;
          throw new WriteObserverFailure("approval down");
        }
      }),
    });
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const first = await records.create("Leads", lead);
    const second = await records.create("Leads", { ...lead, Last_Name: "Second" });
    const refused = records.update("Leads", first.id, { Company: "Refused Co" });
    await vi.waitFor(() => expect(hold).toBe(false));
    await records.update("Leads", second.id, { Company: "Kept Co" });
    release();
    await expect(refused).rejects.toBeInstanceOf(WriteObserverFailure);
    expect((await records.get("Leads", first.id)).fields.Company).toBe("Observer Co");
    expect((await records.get("Leads", second.id)).fields.Company).toBe("Kept Co");
  });

  it("keeps the bin entry of a delete that committed while a refused merge waited", async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let hold = false;
    let held = false;
    const spy = observer({
      afterWrite: vi.fn(async (event) => {
        if (hold && event.kind === "edit") {
          hold = false;
          held = true;
          await gate;
          throw new WriteObserverFailure("approval down");
        }
      }),
    });
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const master = await records.create("Leads", lead);
    const duplicate = await records.create("Leads", { ...lead, Last_Name: "Duplicate" });
    const other = await records.create("Leads", { ...lead, Last_Name: "Other" });
    hold = true;
    const refused = records.merge("Leads", {
      masterId: master.id,
      duplicateIds: [duplicate.id],
      values: {},
    });
    await vi.waitFor(() => expect(held).toBe(true));
    await records.delete("Leads", [other.id]);
    release();
    await expect(refused).rejects.toBeInstanceOf(WriteObserverFailure);
    const bin = (await records.recycleBin.list()).entries;
    expect(bin.map((entry) => entry.recordId)).toEqual([other.id]);
    await expect(records.get("Leads", other.id)).rejects.toBeInstanceOf(NotFoundError);
    expect((await records.get("Leads", duplicate.id)).id).toBe(duplicate.id);
  });

  it("checks the approval lock on merge and publishes the master edit; duplicates go to the bin", async () => {
    const spy = observer();
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const master = await records.create("Leads", lead);
    const duplicate = await records.create("Leads", { ...lead, Last_Name: "Duplicate" });
    spy.afterWrite.mockClear();
    await records.merge("Leads", {
      masterId: master.id,
      duplicateIds: [duplicate.id],
      values: {},
    });
    expect(spy.assertEditable).toHaveBeenCalledWith(
      expect.objectContaining({ module: "Leads", ids: [master.id], operation: "update" }),
    );
    expect(spy.assertEditable).toHaveBeenCalledWith(
      expect.objectContaining({ module: "Leads", ids: [duplicate.id], operation: "delete" }),
    );
    expect(spy.afterWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        module: "Leads",
        kind: "edit",
        record: expect.objectContaining({ id: master.id }),
      }),
    );
    const bin = (await records.recycleBin.list()).entries;
    expect(bin.map((entry) => entry.recordId)).toEqual([duplicate.id]);
    await expect(records.get("Leads", duplicate.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses a merge of a locked duplicate and skips that group when deduplicating", async () => {
    const locked = new Set<string>();
    const spy = observer({
      assertEditable: vi.fn(async ({ ids }: { ids: readonly string[] }) => {
        if (ids.some((id) => locked.has(id))) throw new RecordLockedForApprovalError();
      }),
    });
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const company = `Dedupe ${randomUUID()}`;
    const master = await records.create("Leads", { ...lead, Company: company });
    const duplicate = await records.create("Leads", { ...lead, Company: company });
    locked.add(duplicate.id);
    await expect(
      records.merge("Leads", { masterId: master.id, duplicateIds: [duplicate.id], values: {} }),
    ).rejects.toBeInstanceOf(RecordLockedForApprovalError);
    const result = await records.deduplicate("Leads", ["Company"]);
    expect(result.conflicts.some((group) => group.records.some((r) => r.id === duplicate.id))).toBe(
      true,
    );
    expect((await records.get("Leads", duplicate.id)).id).toBe(duplicate.id);
  });

  it("checks the approval lock on conversion and publishes the lead edit and created records", async () => {
    const spy = observer();
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const created = await records.create("Leads", lead);
    spy.afterWrite.mockClear();
    const result = await records.convertLead(created.id, {
      contact: { create: { Last_Name: "Converted" } },
    });
    expect(spy.assertEditable).toHaveBeenCalledWith(
      expect.objectContaining({ module: "Leads", ids: [created.id], operation: "update" }),
    );
    const events = spy.afterWrite.mock.calls.map(
      ([event]) => [event.module, event.kind, event.record.id] as const,
    );
    expect(events).toContainEqual(["Leads", "edit", created.id]);
    expect(events).toContainEqual(["Contacts", "create", result.contactId]);
  });

  it("refuses a locked conversion and leaves the lead unconverted", async () => {
    const spy = observer({
      assertEditable: vi.fn(async () => {
        throw new RecordLockedForApprovalError();
      }),
    });
    const records = createFixtureRecordService(ctx(), { writeObserver: spy });
    const created = await records.create("Leads", lead);
    await expect(
      records.convertLead(created.id, { contact: { create: { Last_Name: "Converted" } } }),
    ).rejects.toBeInstanceOf(RecordLockedForApprovalError);
    expect((await records.get("Leads", created.id)).fields.Converted__s).not.toBe(true);
  });

  it("refuses a parent delete while a child activity is approval-locked", async () => {
    const context = ctx();
    let lockedTask = "";
    const spy = observer({
      assertEditable: vi.fn(async ({ module, ids }: { module: string; ids: readonly string[] }) => {
        if (module === "Tasks" && ids.includes(lockedTask))
          throw new RecordLockedForApprovalError();
      }),
    });
    const records = createFixtureRecordService(context, { writeObserver: spy });
    const parent = await records.create("Leads", lead);
    lockedTask = (
      await records.create("Tasks", {
        Subject: "Locked child",
        Who_Id: { module: "Leads", id: parent.id },
      })
    ).id;
    await expect(records.delete("Leads", [parent.id])).rejects.toBeInstanceOf(
      RecordLockedForApprovalError,
    );
    expect((await records.get("Leads", parent.id)).id).toBe(parent.id);
    expect((await records.get("Tasks", lockedTask)).id).toBe(lockedTask);
  });
});

describe("parent delete cascade rights", () => {
  it("refuses the delete when the profile cannot delete the related activities", async () => {
    const orgId = randomUUID();
    const permissions = standardPermissions();
    const modules = permissions.modules as Record<string, Record<string, boolean>>;
    modules.Tasks = { ...(modules.Tasks ?? {}), delete: false };
    const snapshot = buildAccessSnapshot({
      orgId,
      userId: "cascade-user",
      version: 1,
      profile: { id: "p", kind: "standard", permissions },
      fieldRows: [],
      roles: [{ id: "ceo", name: "CEO", parentRoleId: null, shareWithPeers: false }],
      members: [{ userId: "cascade-user", roleId: "ceo", profileId: "p" }],
      groupMembers: [],
      defaults: [],
      rules: [],
    });
    const records = createFixtureRecordService(
      { orgId, orgSlug: "cascade", orgName: "Cascade", userId: "cascade-user", role: "member" },
      { access: async () => snapshot },
    );
    const parent = await records.create("Leads", lead);
    const task = await records.create("Tasks", {
      Subject: "Child",
      Who_Id: { module: "Leads", id: parent.id },
    });
    await expect(records.delete("Leads", [parent.id])).rejects.toBeInstanceOf(ForbiddenError);
    expect((await records.get("Leads", parent.id)).id).toBe(parent.id);
    expect((await records.get("Tasks", task.id)).id).toBe(task.id);
    const lone = await records.create("Leads", { ...lead, Last_Name: "Alone" });
    await records.delete("Leads", [lone.id]);
    await expect(records.get("Leads", lone.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
