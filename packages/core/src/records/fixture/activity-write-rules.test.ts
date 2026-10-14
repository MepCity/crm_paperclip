import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { MeetingParticipant } from "../activity-types";
import type { FieldValue } from "../contract";
import {
  callsRecordServiceContractModule as calls,
  eventsRecordServiceContractModule as events,
  leadsRecordServiceContractModule as leads,
  tasksRecordServiceContractModule as tasks,
} from "../contract-suite-module";
import { createFixtureRecordService } from "./index";

const instant = new Date("2026-01-15T12:00:00.000Z");
const make = (now = () => instant) =>
  createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "activity-rules",
      orgName: "Activity Rules",
      userId: "member",
      role: "admin",
    },
    { now },
  );
const guest: MeetingParticipant = {
  type: "email",
  id: null,
  name: "Guest",
  email: "guest@example.test",
};
const error = (field: string, reason = "invalid") => ({
  name: "ValidationError",
  code: "validation",
  reason,
  fieldErrors: { [field]: [expect.any(String)] },
});

describe("Activities write rules", () => {
  it("sets and preserves Closed Time and clears it on reopen, including mass update", async () => {
    let now = instant;
    const service = make(() => now);
    const task = await service.create(
      "Tasks",
      tasks.buildMinimalValidInput({ Status: "Completed" }),
    );
    expect(task.fields.Closed_Time).toBe(now.toISOString());
    now = new Date(now.getTime() + 1000);
    expect(
      (await service.update("Tasks", task.id, { Subject: "Still complete" })).fields.Closed_Time,
    ).toBe(instant.toISOString());
    expect(
      (await service.update("Tasks", task.id, { Status: "Not Started" })).fields.Closed_Time,
    ).toBeNull();
    await service.massUpdate("Tasks", [task.id], { Status: "Completed" });
    expect((await service.get("Tasks", task.id)).fields.Closed_Time).toBe(now.toISOString());
    await expect(service.update("Tasks", task.id, { Closed_Time: null })).rejects.toMatchObject(
      error("Closed_Time"),
    );
    await expect(
      service.create("Tasks", tasks.buildMinimalValidInput({ Closed_Time: now.toISOString() })),
    ).rejects.toMatchObject(error("Closed_Time"));
  });
  it("rejects reversed meeting dates atomically and normalizes UTC all-day bounds", async () => {
    const service = make();
    await expect(
      service.create(
        "Events",
        events.buildMinimalValidInput({ End_DateTime: "2026-01-14T12:00:00.000Z" }),
      ),
    ).rejects.toMatchObject(error("End_DateTime"));
    const record = await service.create("Events", events.buildMinimalValidInput());
    await expect(
      service.update("Events", record.id, { End_DateTime: "2026-01-14T12:00:00.000Z" }),
    ).rejects.toMatchObject(error("End_DateTime"));
    expect((await service.get("Events", record.id)).fields.End_DateTime).toBe(
      record.fields.End_DateTime,
    );
    const allDay = await service.update("Events", record.id, { All_day: true });
    expect(allDay.fields.Start_DateTime).toBe("2026-01-15T00:00:00.000Z");
    expect(allDay.fields.End_DateTime).toBe("2026-01-15T23:59:59.000Z");
    for (const field of ["Start_DateTime", "End_DateTime"]) {
      await expect(
        service.create("Events", events.buildMinimalValidInput({ [field]: null })),
      ).rejects.toMatchObject(error(field, "mandatory"));
      await expect(service.update("Events", record.id, { [field]: null })).rejects.toMatchObject(
        error(field, "mandatory"),
      );
    }
  });
  it("accepts every participant type, strips unknown keys and detaches values", async () => {
    const service = make();
    const participants = [
      { ...guest, extra: "discard" },
      { type: "user", id: "member", name: "Member", email: null },
      { type: "lead", id: "100000000000000000", name: "Lead", email: null },
      { type: "contact", id: "300000000000000000", name: "Contact", email: null },
    ];
    const record = await service.create(
      "Events",
      events.buildMinimalValidInput({ Participants: participants }),
    );
    expect(record.fields.Participants).toEqual(
      participants.map(({ type, id, name, email }) => ({ type, id, name, email })),
    );
    if (participants[0]) participants[0].name = "Mutation";
    (record.fields.Participants as unknown[]).push(null);
    const read = await service.get("Events", record.id);
    expect(read.fields.Participants as unknown[]).toHaveLength(4);
    expect((read.fields.Participants as MeetingParticipant[])[0]?.name).toBe("Guest");
    const list = await service.list("Events", {
      viewId: "all-meetings",
      page: 1,
      perPage: 100,
      filters: { field: "id", comparator: "equal", value: record.id },
    });
    expect(list.records[0]?.fields.Participants).toEqual(read.fields.Participants);
    expect(
      (
        await service.update("Events", record.id, {
          Participants: Array.from({ length: 50 }, () => guest),
        })
      ).fields.Participants,
    ).toHaveLength(50);
  });
  it.each([
    [null],
    [{}],
    [{ type: "user", name: "Member", email: null }],
    [{ type: "email", id: null, name: "Guest" }],
    [{ ...guest, type: "other" }],
    [{ ...guest, email: null }],
    ...["user", "lead", "contact"].map((type) => [{ ...guest, type, id: null }]),
    [{ ...guest, type: "lead", id: "missing" }],
    [{ ...guest, type: "contact", id: "missing" }],
    [{ ...guest, name: null }],
    Array.from({ length: 51 }, () => guest),
  ])("rejects invalid Participants item case %# on create and update", async (...items) => {
    const service = make();
    // it.each spreads the item array into arguments.
    const participants = items as FieldValue;
    await expect(
      service.create("Events", events.buildMinimalValidInput({ Participants: participants })),
    ).rejects.toMatchObject(error("Participants"));
    const record = await service.create("Events", events.buildMinimalValidInput());
    await expect(
      service.update("Events", record.id, { Participants: participants }),
    ).rejects.toMatchObject(error("Participants"));
    expect((await service.get("Events", record.id)).fields.Participants).toBeNull();
  });
  it("rejects another organization's participant record", async () => {
    const other = make();
    const lead = await other.create(
      "Leads",
      leads.buildMinimalValidInput({ Last_Name: "Other organization" }),
    );
    await expect(
      make().create(
        "Events",
        events.buildMinimalValidInput({
          Participants: [{ type: "lead", id: lead.id, name: "Other", email: null }],
        }),
      ),
    ).rejects.toMatchObject(error("Participants"));
  });
  it("derives Overdue on reads and filters without persisting it, and retains Cancelled", async () => {
    let now = instant;
    const service = make(() => now);
    const lead = await service.create("Leads", leads.buildMinimalValidInput());
    const call = await service.create(
      "Calls",
      calls.buildMinimalValidInput({
        Outgoing_Call_Status: "Scheduled",
        Call_Start_Time: instant.toISOString(),
        Who_Id: { module: "Leads", id: lead.id },
      }),
    );
    expect(call.fields.Outgoing_Call_Status).toBe("Scheduled");
    now = new Date(instant.getTime() + 1);
    expect((await service.get("Calls", call.id)).fields.Outgoing_Call_Status).toBe("Overdue");
    const filters = {
      groupOperator: "and",
      group: [
        { field: "id", comparator: "equal", value: call.id },
        { field: "Outgoing_Call_Status", comparator: "equal", value: "Overdue" },
      ],
    } as const;
    expect(await service.count("Calls", { viewId: "all-calls", filters })).toBe(1);
    expect(
      (await service.list("Calls", { viewId: "all-calls", page: 1, perPage: 100, filters }))
        .records[0]?.fields.Outgoing_Call_Status,
    ).toBe("Overdue");
    const parent = await service.list("Leads", {
      viewId: "all-leads",
      page: 1,
      perPage: 100,
      includeActivitySummary: true,
      filters: { field: "id", comparator: "equal", value: lead.id },
    });
    expect(parent.activitySummaries?.[lead.id]).toEqual({
      kind: "call",
      activityId: call.id,
      date: instant.toISOString(),
    });
    expect(
      await service.count("Leads", {
        viewId: "all-leads",
        filters: { field: "id", comparator: "equal", value: lead.id },
        activityFilter: { choice: "without_open_activity" },
      }),
    ).toBe(0);
    now = instant;
    expect((await service.get("Calls", call.id)).fields.Outgoing_Call_Status).toBe("Scheduled");
    await service.update("Calls", call.id, { Outgoing_Call_Status: "Cancelled" });
    expect((await service.get("Calls", call.id)).fields.Outgoing_Call_Status).toBe("Cancelled");
  });
  it("derives completed call seconds and rejects invalid duration with field errors", async () => {
    const service = make();
    const call = await service.create(
      "Calls",
      calls.buildMinimalValidInput({
        Outgoing_Call_Status: "Completed",
        Call_Duration: "12:34",
        Call_Duration_in_seconds: 999,
      }),
    );
    expect(call.fields.Call_Duration_in_seconds).toBe(754);
    expect(
      (await service.update("Calls", call.id, { Call_Duration: "00:00" })).fields
        .Call_Duration_in_seconds,
    ).toBe(0);
    for (const duration of ["bad", "01:60", "1:05", "-01:00"]) {
      await expect(
        service.update("Calls", call.id, { Call_Duration: duration }),
      ).rejects.toMatchObject(error("Call_Duration"));
      await expect(
        service.create(
          "Calls",
          calls.buildMinimalValidInput({
            Outgoing_Call_Status: "Completed",
            Call_Duration: duration,
          }),
        ),
      ).rejects.toMatchObject(error("Call_Duration"));
    }
    await expect(service.update("Calls", call.id, { Call_Duration: null })).rejects.toMatchObject(
      error("Call_Duration", "mandatory"),
    );
    await expect(
      service.create(
        "Calls",
        calls.buildMinimalValidInput({ Outgoing_Call_Status: "Completed", Call_Duration: null }),
      ),
    ).rejects.toMatchObject(error("Call_Duration", "mandatory"));
  });
});
