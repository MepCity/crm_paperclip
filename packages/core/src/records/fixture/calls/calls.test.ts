import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../errors";
import { type Criteria, lookupTargetModules, type RecordInput } from "../../contract";
import { describeRecordServiceContract } from "../../contract-suite";
import { callsRecordServiceContractModule } from "../../contract-suite-module";
import { createFixtureRecordService } from "../index";
import { validateCriteria } from "../query";
import { fixtureModules } from "../registry";
import { callsMetadata, callsWhatTargets, callsWhoTargets } from "./metadata";
import { callsPicklists } from "./picklists";
import { generateFixtureCalls } from "./seed";
import { callsViews } from "./views";

const now = new Date("2026-01-15T23:59:00Z");
const make = () =>
  createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "call-tests",
      orgName: "Call Tests",
      userId: "call-member",
      role: "admin",
    },
    { now: () => now },
  );
const query = { viewId: "all-calls", page: 1, perPage: 100 };
const input = (extra: RecordInput = {}) => ({
  Call_Type: "Outbound",
  Call_Start_Time: "2026-01-15T10:00:00.000Z",
  Call_Duration: "05:00",
  ...extra,
});
const fields = new Map(callsMetadata.fields.map((field) => [field.apiName, field]));

describeRecordServiceContract(
  "fixture",
  createFixtureRecordService,
  callsRecordServiceContractModule,
);

describe("Calls activity foundation", () => {
  it("lists Calls with target lists and all views valid", async () => {
    const service = make();
    const metadata = await service.getModule("Calls");
    const field = (name: string) => {
      const found = metadata.fields.find((f) => f.apiName === name);
      if (!found) throw new Error("missing field");
      return found;
    };
    expect(lookupTargetModules(field("Who_Id"))).toEqual(callsWhoTargets);
    expect(lookupTargetModules(field("What_Id"))).toEqual(callsWhatTargets);
    expect(metadata.fields).toHaveLength(26);
    expect(await service.count("Calls", { viewId: "all-calls" })).toBe(250);
    expect(await service.listViews("Calls")).toHaveLength(23);
    for (const view of callsViews) if (view.criteria) validateCriteria(view.criteria, fields);
    expect((await service.list("Calls", query)).sort).toEqual({ field: "id", order: "desc" });
  });

  it("requires Call_Type, Call_Start_Time and Call_Duration", async () => {
    const service = make();
    for (const name of ["Call_Type", "Call_Start_Time", "Call_Duration"]) {
      const rest = Object.fromEntries(Object.entries(input()).filter(([key]) => key !== name));
      await expect(service.create("Calls", rest)).rejects.toBeInstanceOf(ValidationError);
    }
    await expect(service.create("Calls", input())).resolves.toBeDefined();
  });

  it("supports list, get, create, update and delete", async () => {
    const service = make();
    const created = await service.create("Calls", input({ Subject: "Example Call" }));
    expect((await service.get("Calls", created.id)).fields.Subject).toBe("Example Call");
    const updated = await service.update("Calls", created.id, { Subject: "Renamed" });
    expect(updated.fields.Subject).toBe("Renamed");
    const filters: Criteria = { field: "id", comparator: "equal", value: created.id };
    expect((await service.list("Calls", { ...query, filters })).records).toHaveLength(1);
    await service.delete("Calls", [created.id]);
    await expect(service.get("Calls", created.id)).rejects.toBeDefined();
    expect(await service.count("Calls", { viewId: "all-calls", filters })).toBe(0);
  });

  it.each(["Who_Id", "What_Id"])("validates %s references on create and update", async (name) => {
    const service = make();
    const module = name === "Who_Id" ? "Contacts" : "Accounts";
    const target = await service.get(
      module,
      module === "Contacts" ? "300000000000000000" : "500000000000000000",
    );
    const label = target.fields[module === "Contacts" ? "Full_Name" : "Account_Name"];
    const valid = { module, id: target.id, name: "Untrusted name" };
    const call = await service.create("Calls", input({ [name]: valid }));
    expect(call.fields[name]).toEqual({ module, id: target.id, name: label });
    for (const ref of [
      { module: "Calls", id: target.id },
      { module, id: "missing" },
    ]) {
      await expect(service.create("Calls", input({ [name]: ref }))).rejects.toBeInstanceOf(
        ValidationError,
      );
      await expect(service.update("Calls", call.id, { [name]: ref })).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
    await service.delete(module, [target.id]);
    expect((await service.get("Calls", call.id)).fields[name]).toBeNull();
    const listed = await service.list("Calls", {
      ...query,
      filters: { field: "id", comparator: "equal", value: call.id },
    });
    expect(listed.records[0]?.fields[name]).toBeNull();
  });

  it("retains allowed unregistered target modules without resolution", async () => {
    const service = make();
    const ref = { module: "Vendors", id: "synthetic-vendor", name: "Synthetic Vendor" };
    const call = await service.create("Calls", input({ What_Id: ref }));
    expect(call.fields.What_Id).toEqual(ref);
  });

  it.each(["Leads", "Contacts", "Accounts", "Deals"])(
    "lists and counts direct calls for %s",
    async (module) => {
      const service = make();
      const field = module === "Leads" || module === "Contacts" ? "Who_Id" : "What_Id";
      const id = {
        Leads: "100000000000000000",
        Contacts: "300000000000000000",
        Accounts: "500000000000000000",
        Deals: "700000000000000000",
      }[module] as string;
      const filters: Criteria = { field, comparator: "equal", value: { module, id } };
      const expected = generateFixtureCalls(68, now).filter((call) => {
        const ref = call.fields[field] as { module?: string; id?: string } | null;
        return typeof ref === "object" && ref !== null && ref.module === module && ref.id === id;
      });
      const list = await service.list("Calls", { ...query, filters });
      expect(list.records.map((r) => r.id).sort()).toEqual(expected.map((r) => r.id).sort());
      expect(list.records.length).toBeGreaterThan(1);
      expect(await service.count("Calls", { viewId: "all-calls", filters })).toBe(expected.length);
      expect(
        await service.count("Calls", {
          viewId: "all-calls",
          filters: { field, comparator: "equal", value: { module, id: "no-call" } },
        }),
      ).toBe(0);
    },
  );

  it("evaluates the exported Completed, Unattended and Scheduled criteria on seed data", async () => {
    const service = make();
    const calls = generateFixtureCalls(68, now);
    const status = (call: (typeof calls)[number]) => call.fields.Outgoing_Call_Status;
    expect(await service.count("Calls", { viewId: "scheduled-calls" })).toBe(
      calls.filter((c) => status(c) === "Scheduled").length,
    );
    expect(await service.count("Calls", { viewId: "completed-calls" })).toBe(
      calls.filter((c) => status(c) !== "Scheduled" && status(c) !== "Overdue").length,
    );
    expect(await service.count("Calls", { viewId: "unattended-calls" })).toBe(
      calls.filter((c) => status(c) === "Completed" && c.fields.Call_Duration_in_seconds === 0)
        .length,
    );
  });

  it("returns at least one seed record for every exported view", async () => {
    const service = make();
    const empty: string[] = [];
    for (const view of callsViews) {
      if ((await service.count("Calls", { viewId: view.id })) === 0) empty.push(view.id);
    }
    expect(empty).toEqual([]);
  });

  it("registers a bundle with a distinct id range", () => {
    const ranges = Object.values(fixtureModules).map((bundle) => bundle.initialNextId);
    expect(new Set(ranges).size).toBe(ranges.length);
    expect(Object.keys(callsPicklists)).toHaveLength(6);
  });

  it("keeps seed id ranges disjoint across every fixture module", () => {
    const now = new Date("2026-01-15T23:59:00Z");
    const entries = Object.entries(fixtureModules).map(([name, bundle]) => ({
      name,
      next: bundle.initialNextId,
      ids: bundle.generateSeed(now).map((record) => BigInt(String(record.id))),
    }));
    const owner = new Map<bigint, string>();
    for (const { name, ids } of entries) {
      for (const id of ids) {
        expect(owner.has(id), `${name} id ${id} also used by ${owner.get(id)}`).toBe(false);
        owner.set(id, name);
      }
    }
    for (const { name, next, ids } of entries) {
      for (const id of ids) expect(id < next, `${name} seed id ${id} >= its next id`).toBe(true);
      for (const other of entries) {
        for (let offset = 0n; offset < 1000n; offset += 1n) {
          const candidate = other.next + offset;
          expect(
            owner.has(candidate),
            `${other.name} next-id window hits ${owner.get(candidate)}`,
          ).toBe(false);
        }
      }
    }
  });
});
