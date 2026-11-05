import { randomUUID } from "node:crypto";
import { describe, expect, it, type Mock, vi } from "vitest";
import { RecordLockedForApprovalError } from "../errors";
import { createFixtureRecordService } from "./fixture";
import type { RecordWriteObserver } from "./write-observer";

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
});
