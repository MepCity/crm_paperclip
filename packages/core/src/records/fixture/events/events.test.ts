import { createHash, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../errors";
import type { Comparator, Criteria, FieldValue, RecordInput } from "../../contract";
import { describeRecordServiceContract } from "../../contract-suite";
import { eventsRecordServiceContractModule } from "../../contract-suite-module";
import { fieldValueKey, matchesGlobalSearch } from "../discovery";
import { createFixtureRecordService } from "../index";
import { matches, validateCriteria } from "../query";
import { acceptsFieldValue } from "../validation";
import { eventsMetadata, eventsWhatTargets, eventsWhoTargets } from "./metadata";
import { generateFixtureEvents } from "./seed";
import { eventsViews } from "./views";

const now = new Date("2026-01-15T12:00:00.000Z");
const make = (clock = () => now) =>
  createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "event-tests",
      orgName: "Event Tests",
      userId: "event-member",
      role: "admin",
    },
    { now: clock },
  );
const input = (extra: RecordInput = {}) =>
  eventsRecordServiceContractModule.buildMinimalValidInput(extra);
const query = { viewId: "all-meetings", page: 1, perPage: 100 };
const fields = new Map(eventsMetadata.fields.map((field) => [field.apiName, field]));
describeRecordServiceContract(
  "fixture Events",
  createFixtureRecordService,
  eventsRecordServiceContractModule,
);

describe("Events", () => {
  it("matches the exported API/type/length/flag table and picklist order", () => {
    const table = eventsMetadata.fields.map((f) => [
      f.apiName,
      f.dataType,
      f.maxLength,
      f.required,
      f.readOnly,
      f.unique,
      f.massUpdate,
      [f.views.view, f.views.create, f.views.edit, f.views.quickCreate],
    ]);
    // Digest of the sanitized 34-row source table, including independent surface flags.
    expect(createHash("sha256").update(JSON.stringify(table)).digest("hex")).toBe(
      "0e34764527edc274249cf0be13ae58e948882d7d37c00b93a505c9b1912baecd",
    );
    expect(
      eventsMetadata.fields
        .find((f) => f.apiName === "Meeting_Venue__s")
        ?.picklist?.map((o) => [o.displayValue, o.storedValue]),
    ).toEqual([
      ["In-office", "In-office"],
      ["Client location", "Client location"],
      ["Online", "Online"],
    ]);
    expect(eventsMetadata.layout.map((s) => [s.label, s.columnCount, s.columns])).toEqual([
      [
        "Meeting Information",
        1,
        [
          [
            "Event_Title",
            "Meeting_Venue__s",
            "Venue",
            "Meeting_Provider__s",
            "All_day",
            "Start_DateTime",
            "End_DateTime",
            "Owner",
            "Participants",
            "Who_Id",
            "Created_By",
            "Recurring_Activity",
            "Modified_By",
            "Created_Time",
            "Modified_Time",
            "Remind_Participants",
            "Last_Activity_Time",
            "What_Id",
          ],
        ],
      ],
      [
        "Meeting Additional Information",
        1,
        [
          [
            "Description",
            "Remind_At",
            "Check_In_Time",
            "Check_In_By",
            "Check_In_Comment",
            "Check_In_Sub_Locality",
            "Check_In_City",
            "Check_In_State",
            "Check_In_Country",
            "Latitude",
            "Longitude",
            "ZIP_Code",
            "Check_In_Address",
            "Check_In_Status",
            "Tag",
            "id",
          ],
        ],
      ],
    ]);
  });
  it("publishes metadata, exact array opt-ins and all source views", async () => {
    const service = make();
    const meta = await service.getModule("Events");
    expect(meta.fields).toHaveLength(34);
    expect(meta.fields.filter((f) => f.acceptsJsonArray).map((f) => f.apiName)).toEqual([
      "Remind_At",
      "Participants",
      "Remind_Participants",
    ]);
    expect(meta.fields.find((f) => f.apiName === "Participants")?.dataType).toBe("bigint");
    expect(meta.fields.find((f) => f.apiName === "Meeting_Provider__s")?.picklist).toEqual([]);
    expect(eventsWhoTargets).toEqual(["Contacts", "Leads"]);
    expect(eventsWhatTargets).toContain("Accounts");
    const views = await service.listViews("Events");
    expect(views).toEqual(eventsViews);
    expect(views).toHaveLength(11);
    for (const view of views) {
      if (view.criteria && view.id !== "my-meetings") validateCriteria(view.criteria, fields);
      expect(view.sort).toBeNull();
      await service.list("Events", { ...query, viewId: view.id });
    }
    expect(views.find((v) => v.id === "my-meetings")?.criteria).toEqual({
      field: "Host_or_Participant",
      comparator: "equal",
      value: { token: "CURRENTUSER" },
    });
    expect(await service.count("Events", { viewId: "my-meetings" })).toBe(250);
    expect((await service.list("Events", query)).sort).toEqual({ field: "id", order: "desc" });
  });
  it.each(["Event_Title", "Meeting_Venue__s", "Start_DateTime", "End_DateTime"])(
    "requires %s",
    async (field) => {
      await expect(make().create("Events", input({ [field]: null }))).rejects.toBeInstanceOf(
        ValidationError,
      );
    },
  );
  it.each(["Remind_At", "Remind_Participants"])(
    "copies opaque %s on create, update, get and list",
    async (field) => {
      const service = make();
      const value = [{ arbitrary: [null, true, 2, { text: "Synthetic" }] }];
      const expected = structuredClone(value);
      const record = await service.create("Events", input({ [field]: value }));
      value.push({ arbitrary: [] });
      (record.fields[field] as unknown[]).push("read mutation");
      expect((await service.get("Events", record.id)).fields[field]).toEqual(expected);
      expect(
        (
          await service.list("Events", {
            ...query,
            filters: { field: "id", comparator: "equal", value: record.id },
          })
        ).records[0]?.fields[field],
      ).toEqual(expected);
      expect((await service.update("Events", record.id, { [field]: [] })).fields[field]).toEqual(
        [],
      );
      for (const invalid of [{}, "array", [Infinity], [undefined], new Date(), [new Date()]])
        await expect(
          service.update("Events", record.id, { [field]: invalid as FieldValue }),
        ).rejects.toBeInstanceOf(ValidationError);
      const cycle: unknown[] = [];
      cycle.push(cycle);
      await expect(
        service.update("Events", record.id, { [field]: cycle as FieldValue }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        service.list("Events", {
          ...query,
          filters: { field, comparator: "is_empty", value: null },
        }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        service.count("Events", {
          viewId: query.viewId,
          filters: { field, comparator: "equal", value: [] },
        }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        service.list("Events", { ...query, sort: { field, order: "asc" } }),
      ).rejects.toBeInstanceOf(ValidationError);
    },
  );
  it("compares typed participants with significant array order", () => {
    const field = fields.get("Participants");
    if (!field) throw new Error("Missing field");
    const guest = { type: "email", id: null, name: "Guest", email: "guest@example.test" };
    const member = { type: "user", id: "member", name: "Member", email: null };
    expect(fieldValueKey([guest], field)).toBe(
      fieldValueKey([{ email: guest.email, name: guest.name, id: null, type: "email" }], field),
    );
    expect(fieldValueKey([guest], field)).not.toBe(
      fieldValueKey([{ ...guest, name: "Other" }], field),
    );
    expect(fieldValueKey([guest, member], field)).not.toBe(fieldValueKey([member, guest], field));
  });
  it("keeps opaque arrays out of global search and distinguishes public duplicate conflicts", async () => {
    expect(
      matchesGlobalSearch(
        {
          id: "1",
          fields: {
            Participants: [
              { type: "email", id: null, name: "opaque-needle", email: "guest@example.test" },
            ],
          },
        },
        eventsMetadata.fields,
        "opaque-needle",
      ),
    ).toBe(false);
    const service = make();
    const marker = "Deep equality marker";
    await service.create(
      "Events",
      input({
        Venue: marker,
        Participants: [{ type: "email", id: null, name: "Guest", email: "guest@example.test" }],
      }),
    );
    const second = await service.create(
      "Events",
      input({
        Venue: marker,
        Participants: [{ email: "guest@example.test", name: "Guest", id: null, type: "email" }],
      }),
    );
    let groups = await service.findDuplicateGroups("Events", ["Venue"]);
    let group = groups.find((g) => g.records.some((r) => r.id === second.id));
    expect(group?.conflictFields).not.toContain("Participants");
    await service.update("Events", second.id, {
      Participants: [{ type: "email", id: null, name: "Other", email: "guest@example.test" }],
    });
    groups = await service.findDuplicateGroups("Events", ["Venue"]);
    group = groups.find((g) => g.records.some((r) => r.id === second.id));
    expect(group?.conflictFields).toContain("Participants");
  });
  it("rejects arrays on Tag and other unmarked fields", async () => {
    const tag = fields.get("Tag");
    if (!tag) throw new Error("Missing Tag");
    expect(acceptsFieldValue(tag, [])).toBe(false);
    await expect(make().create("Events", input({ Tag: [] }))).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(make().create("Events", input({ Venue: [] }))).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
  it.each(["Leads", "Contacts", "Accounts", "Deals"])(
    "lists/counts direct meetings for %s",
    async (module) => {
      const service = make();
      const field = ["Leads", "Contacts"].includes(module) ? "Who_Id" : "What_Id";
      const id = {
        Leads: "100000000000000000",
        Contacts: "300000000000000000",
        Accounts: "500000000000000000",
        Deals: "700000000000000000",
      }[module];
      if (!id) throw new Error("Missing target");
      const filters: Criteria = { field, comparator: "equal", value: { module, id } };
      const expected = generateFixtureEvents(68, now).filter((record) => {
        const ref = record.fields[field];
        return (
          ref &&
          typeof ref === "object" &&
          "module" in ref &&
          ref.module === module &&
          ref.id === id
        );
      });
      const list = await service.list("Events", { ...query, filters });
      expect(list.records.map((r) => r.id).sort()).toEqual(expected.map((r) => r.id).sort());
      expect(expected.length).toBeGreaterThan(1);
      expect(await service.count("Events", { viewId: query.viewId, filters })).toBe(
        expected.length,
      );
      expect(
        await service.count("Events", {
          viewId: query.viewId,
          filters: { field, comparator: "equal", value: { module, id: "missing" } },
        }),
      ).toBe(0);
      const created = await service.create(
        "Events",
        input({ [field]: { module, id, name: "Spoof" } }),
      );
      expect(created.fields[field]).toMatchObject({ module, id });
      expect(created.fields[field]).not.toMatchObject({ name: "Spoof" });
      await expect(
        service.update("Events", created.id, { [field]: { module, id: "missing" } }),
      ).rejects.toBeInstanceOf(ValidationError);
      await service.delete(module, [id]);
      expect((await service.get("Events", created.id)).fields[field]).toBeNull();
    },
  );
  it("rejects disallowed reference targets and preserves allowed unregistered targets", async () => {
    const service = make();
    for (const field of ["Who_Id", "What_Id"])
      await expect(
        service.create("Events", input({ [field]: { module: "Events", id: "missing" } })),
      ).rejects.toBeInstanceOf(ValidationError);
    const ref = { module: "Vendors", id: "synthetic-vendor", name: "Synthetic Vendor" };
    expect((await service.create("Events", input({ What_Id: ref }))).fields.What_Id).toEqual(ref);
  });
  it("has deterministic all-day/timed, past/future and empty/populated arrays", () => {
    const seed = generateFixtureEvents(68, now);
    expect(seed).toEqual(generateFixtureEvents(68, now));
    expect(seed).toHaveLength(250);
    for (const value of [true, false])
      expect(seed.some((r) => r.fields.All_day === value)).toBe(true);
    expect(seed.some((r) => String(r.fields.End_DateTime) < now.toISOString())).toBe(true);
    expect(seed.some((r) => String(r.fields.Start_DateTime) > now.toISOString())).toBe(true);
  });
});

describe("CURRENTTIME", () => {
  const token = { token: "CURRENTTIME" } as const;
  it.each(["less_than", "less_equal", "greater_than", "greater_equal"] as const)(
    "evaluates exact millisecond %s boundaries",
    (comparator) => {
      const criterion: Criteria = { field: "End_DateTime", comparator, value: token };
      validateCriteria(criterion, fields);
      for (const delta of [-1, 0, 1]) {
        const record = {
          id: "1",
          fields: { End_DateTime: new Date(now.getTime() + delta).toISOString() },
        };
        const expected =
          comparator === "less_than"
            ? delta < 0
            : comparator === "less_equal"
              ? delta <= 0
              : comparator === "greater_than"
                ? delta > 0
                : delta >= 0;
        expect(matches(record, criterion, { now, userId: "member" }, fields)).toBe(expected);
      }
      for (const value of [null, "invalid", ""])
        expect(
          matches(
            { id: "1", fields: { End_DateTime: value } },
            criterion,
            { now, userId: "member" },
            fields,
          ),
        ).toBe(false);
    },
  );
  it("rejects CURRENTTIME on a date-only field", () => {
    const field = fields.get("Start_DateTime");
    if (!field) throw new Error("Missing datetime");
    const dateFields = new Map([
      ["Date", { ...field, apiName: "Date", dataType: "date" as const }],
    ]);
    expect(() =>
      validateCriteria({ field: "Date", comparator: "less_than", value: token }, dateFields),
    ).toThrow(ValidationError);
  });
  it("rejects unsupported fields and comparators", () => {
    for (const field of ["Event_Title", "All_day", "Participants"])
      expect(() =>
        validateCriteria({ field, comparator: "less_than", value: token }, fields),
      ).toThrow(ValidationError);
    for (const comparator of [
      "equal",
      "not_equal",
      "contains",
      "between",
      "is_empty",
    ] as Comparator[])
      expect(() =>
        validateCriteria({ field: "End_DateTime", comparator, value: token }, fields),
      ).toThrow(ValidationError);
  });
  it("resolves the adapter clock on every query and partitions four exported views", async () => {
    let clock = now;
    const service = make(() => clock);
    const record = await service.create("Events", input());
    const filters: Criteria = { field: "id", comparator: "equal", value: record.id };
    for (const [completed, upcoming] of [
      ["completed-meetings", "upcoming-meetings"],
      ["my-completed-meetings", "my-upcoming-meetings"],
    ]) {
      if (!completed || !upcoming) throw new Error("Missing view");
      expect(await service.count("Events", { viewId: completed, filters })).toBe(0);
      expect(await service.count("Events", { viewId: upcoming, filters })).toBe(1);
    }
    clock = new Date("2026-01-15T13:00:00.001Z");
    expect(await service.count("Events", { viewId: "completed-meetings", filters })).toBe(1);
    expect(await service.count("Events", { viewId: "upcoming-meetings", filters })).toBe(0);
  });
});
