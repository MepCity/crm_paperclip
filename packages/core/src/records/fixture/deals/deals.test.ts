import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../../../errors";
import type { Criteria, RecordInput } from "../../contract";
import { describeRecordServiceContract } from "../../contract-suite";
import { dealsRecordServiceContractModule } from "../../contract-suite-module";
import { createFixtureRecordService } from "../index";
import { matches } from "../query";
import { dealsMetadata } from "./metadata";
import { dealsPicklists } from "./picklists";
import { generateFixtureDeals } from "./seed";
import { dealsViews } from "./views";

const make = () =>
  createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "deal-tests",
    orgName: "Deal Tests",
    userId: "deal-member",
    role: "admin",
  });
const input = (extra: RecordInput = {}): RecordInput => ({
  Deal_Name: "Example Deal",
  Stage: "Qualification",
  Closing_Date: "2026-12-15",
  Account_Name: { module: "Accounts", id: "500000000000000000" },
  ...extra,
});
describeRecordServiceContract(
  "fixture",
  createFixtureRecordService,
  dealsRecordServiceContractModule,
);

describe("Deals export and fixture", () => {
  it("matches the sanitized export field, picklist, stage and layout tables", () => {
    const exported = JSON.parse(
      readFileSync(new URL("./export-expectations.json", import.meta.url), "utf8"),
    );
    expect(dealsMetadata.fields).toEqual(exported.fields);
    expect(dealsMetadata.layout).toEqual(exported.layout);
    expect(dealsViews.map(({ name, columns, sort }) => ({ name, columns, sort }))).toEqual(
      exported.views,
    );
    expect(dealsMetadata.fields).toHaveLength(29);
    expect(dealsPicklists.Stage).toHaveLength(9);
    expect(dealsPicklists.Stage?.[3]).toMatchObject({
      displayValue: "Identify Decision Makers",
      storedValue: "Id. Decision Makers",
    });
    for (const [name, options] of Object.entries(dealsPicklists)) {
      if (name !== "Stage")
        for (const option of options) expect(option).not.toHaveProperty("stage");
    }
  });
  it("publishes all exported views and keeps unknown modules missing", async () => {
    const service = make();
    expect((await service.listViews("Deals")).map((view) => view.name)).toEqual([
      "All Deals",
      "All Locked Deals",
      "Closing Next Month",
      "Closing This Month",
      "My Deals",
      "My Deals Closing This Month",
      "New Last Week",
      "New This Week",
      "Recently Created Deals",
      "Recently Modified Deals",
      "Unread Deals",
    ]);
    for (const view of dealsViews) {
      expect(view.sort).toBeNull();
      await expect(
        service.list("Deals", { viewId: view.id, page: 1, perPage: 100 }),
      ).resolves.toBeDefined();
    }
    await expect(service.getModule("MissingModule")).rejects.toBeInstanceOf(NotFoundError);
  });
  it.each(["Deal_Name", "Stage", "Closing_Date", "Account_Name"])(
    "requires %s on creation",
    async (field) => {
      const values = { ...input() };
      delete values[field];
      await expect(make().create("Deals", values)).rejects.toBeInstanceOf(ValidationError);
    },
  );
  it("preserves required fields during a partial update", async () => {
    const service = make();
    const deal = await service.create("Deals", input());
    const updated = await service.update("Deals", deal.id, { Next_Step: "Call back" });
    expect(updated.fields.Closing_Date).toBe(deal.fields.Closing_Date);
    expect(updated.fields.Account_Name).toEqual(deal.fields.Account_Name);
    expect(updated.fields.Next_Step).toBe("Call back");
  });
  it.each([
    ["Last_Activity_Time", "2026-12-15T12:00:00Z"],
    ["Lead_Conversion_Time", 12],
    ["Sales_Cycle_Duration", 30],
    ["Overall_Sales_Duration", 42],
    ["Stage_Modified_Time", "2026-12-15T12:00:00Z"],
  ] as const)("rejects writes to read-only %s on create and update", async (field, value) => {
    const service = make();
    expect(dealsMetadata.fields.find((definition) => definition.apiName === field)?.readOnly).toBe(
      true,
    );
    await expect(service.create("Deals", input({ [field]: value }))).rejects.toBeInstanceOf(
      ValidationError,
    );
    const deal = await service.create("Deals", input());
    await expect(service.update("Deals", deal.id, { [field]: value })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect((await service.get("Deals", deal.id)).fields[field]).toEqual(deal.fields[field]);
  });
  it("keeps Owner writable for a tenant member", async () => {
    const service = make();
    expect(dealsMetadata.fields.find((field) => field.apiName === "Owner")?.readOnly).toBe(false);
    const deal = await service.create("Deals", input({ Owner: "deal-member" }));
    expect(deal.fields.Owner).toBe("deal-member");
    expect((await service.update("Deals", deal.id, { Owner: "deal-member" })).fields.Owner).toBe(
      "deal-member",
    );
    await expect(
      service.update("Deals", deal.id, { Owner: "missing-member" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
  it.each([
    ["Account_Name", "Accounts", "Account_Name"],
    ["Contact_Name", "Contacts", "Full_Name"],
  ] as const)("validates, names and safely resolves %s", async (field, module, displayField) => {
    const service = make();
    const target = (
      await service.list(module, {
        viewId: module === "Accounts" ? "all-accounts" : "all-contacts",
        page: 1,
        perPage: 10,
      })
    ).records[0];
    expect(target).toBeDefined();
    if (!target) throw new Error("Missing fixture target");
    await expect(
      service.create("Deals", input({ [field]: { module, id: "missing" } })),
    ).rejects.toBeInstanceOf(ValidationError);
    const deal = await service.create(
      "Deals",
      input({ [field]: { module, id: target.id, name: "Caller label" } }),
    );
    expect(deal.fields[field]).toEqual({
      module,
      id: target.id,
      name: target.fields[displayField],
    });
    await expect(
      service.update("Deals", deal.id, { [field]: { module, id: "missing" } }),
    ).rejects.toBeInstanceOf(ValidationError);
    await service.delete(module, [target.id]);
    expect((await service.get("Deals", deal.id)).fields[field]).toBeNull();
    const listed = await service.list("Deals", {
      viewId: "all-deals",
      page: 1,
      perPage: 100,
      filters: { field: "id", comparator: "equal", value: deal.id },
    });
    expect(listed.records[0]?.fields[field]).toBeNull();
  });
  it.each([
    ["Account_Name", "Accounts", "500000000000000000"],
    ["Contact_Name", "Contacts", "300000000000000000"],
  ] as const)("lists and counts related deals for %s", async (field, _module, id) => {
    const service = make();
    const filters: Criteria = { field, comparator: "equal", value: id };
    const result = await service.list("Deals", {
      viewId: "all-deals",
      page: 1,
      perPage: 100,
      filters,
    });
    expect(result.records).toHaveLength(2);
    expect(await service.count("Deals", { viewId: "all-deals", filters })).toBe(2);
    expect(
      await service.count("Deals", {
        viewId: "all-deals",
        filters: {
          field: "Account_Name",
          comparator: "equal",
          value: "500000000000000249",
        },
      }),
    ).toBe(0);
  });
  it("keeps unregistered campaign references and applies changed-stage probability", async () => {
    const service = make();
    const campaign = { module: "Campaigns", id: "synthetic-campaign", name: "Synthetic campaign" };
    const deal = await service.create(
      "Deals",
      input({ Campaign_Source: campaign, Probability: 17 }),
    );
    expect(deal.fields.Campaign_Source).toEqual(campaign);
    expect(
      (await service.update("Deals", deal.id, { Stage: "Closed Won" })).fields.Probability,
    ).toBe(100);
  });
  it("seeds deterministic records covering all stages and registered references", async () => {
    const now = new Date("2026-01-15T12:00:00Z");
    const seed = generateFixtureDeals(68, now);
    expect(seed).toEqual(generateFixtureDeals(68, now));
    expect(seed).toHaveLength(250);
    expect(new Set(seed.map((row) => row.fields.Stage))).toEqual(
      new Set(dealsPicklists.Stage?.map((option) => option.storedValue)),
    );
    const service = make();
    for (const row of seed.slice(0, 125)) {
      for (const field of ["Account_Name", "Contact_Name"]) {
        const ref = row.fields[field];
        if (
          !ref ||
          typeof ref !== "object" ||
          !("module" in ref) ||
          typeof ref.module !== "string" ||
          typeof ref.id !== "string"
        )
          throw new Error("Missing reference");
        await expect(service.get(ref.module, ref.id)).resolves.toBeDefined();
      }
    }
  });
  it("selects the next calendar month across the year boundary", () => {
    const criteria = dealsViews.find((view) => view.id === "closing-next-month")?.criteria;
    if (!criteria) throw new Error("Missing criteria");
    const fields = new Map(dealsMetadata.fields.map((field) => [field.apiName, field]));
    const runtime = { userId: "member", now: new Date("2026-12-15T12:00:00Z") };
    for (const [date, expected] of [
      ["2026-12-31", false],
      ["2027-01-01", true],
      ["2027-01-31", true],
      ["2027-02-01", false],
    ] as const) {
      expect(
        matches({ id: "synthetic", fields: { Closing_Date: date } }, criteria, runtime, fields),
      ).toBe(expected);
    }
  });
});
