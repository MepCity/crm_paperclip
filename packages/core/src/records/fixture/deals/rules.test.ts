import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ForbiddenError, ValidationError } from "../../../errors";
import type { RecordInput } from "../../contract";
import { createFixtureRecordService } from "../index";
import { dealsMetadata } from "./metadata";
import { dealsPicklists } from "./picklists";

function setup() {
  let now = new Date("2026-01-15T23:55:00Z");
  const service = createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "rules",
      orgName: "Rules",
      userId: "rules-user",
      role: "admin",
    },
    { now: () => now },
  );
  const create = (extra: RecordInput = {}) =>
    service.create("Deals", {
      Deal_Name: "Rule example",
      Account_Name: { module: "Accounts", id: "500000000000000000" },
      Closing_Date: "2026-12-15",
      Stage: "Qualification",
      ...extra,
    });
  const history = (id: string) =>
    service.list("DealHistory", {
      viewId: "all-deal-history",
      page: 1,
      perPage: 100,
      filters: { field: "Potential_Name", comparator: "equal", value: id },
    });
  return {
    service,
    create,
    history,
    advance: (value: string) => {
      now = new Date(value);
    },
  };
}

describe("Deals stage rules", () => {
  it("defaults stage probability, preserves explicit probability and derives revenue on every write", async () => {
    const { service, create } = setup();
    const deal = await create({ Amount: 123.45 });
    expect(deal.fields).toMatchObject({ Probability: 10, Expected_Revenue: 12.35 });
    expect(
      (await service.update("Deals", deal.id, { Stage: "Needs Analysis" })).fields,
    ).toMatchObject({ Probability: 20, Expected_Revenue: 24.69 });
    expect(
      (await service.update("Deals", deal.id, { Stage: "Closed Won", Probability: 37 })).fields,
    ).toMatchObject({ Probability: 37, Expected_Revenue: 45.68 });
    expect(
      (await service.update("Deals", deal.id, { Stage: "Closed Won" })).fields.Probability,
    ).toBe(37);
    expect(
      (await service.update("Deals", deal.id, { Probability: 50 })).fields.Expected_Revenue,
    ).toBe(61.73);
    expect(
      (await service.update("Deals", deal.id, { Amount: null })).fields.Expected_Revenue,
    ).toBeNull();
    expect((await create({ Stage: "Closed Won", Probability: 0 })).fields.Probability).toBe(0);
    expect((await create()).fields.Expected_Revenue).toBeNull();
    expect((await create({ Amount: 1.005, Probability: 100 })).fields.Expected_Revenue).toBe(1.01);
    for (const Probability of [-1, 101, 1.5]) {
      await expect(create({ Probability })).rejects.toBeInstanceOf(ValidationError);
      await expect(service.update("Deals", deal.id, { Probability })).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
    expect((await create({ Probability: null })).fields.Probability).toBe(10);
    expect(
      (await service.update("Deals", deal.id, { Stage: "Needs Analysis", Probability: null }))
        .fields,
    ).toMatchObject({ Stage: "Needs Analysis", Probability: 20 });
    expect((await service.update("Deals", deal.id, { Probability: null })).fields.Probability).toBe(
      20,
    );
    await expect(create({ Expected_Revenue: 12 })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.update("Deals", deal.id, { Expected_Revenue: 12 })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
  it("accepts loss reasons only for either lost category and clears them when reopening", async () => {
    const { service, create } = setup();
    expect(
      (await create({ Stage: "Qualification", Reason_For_Loss__s: null })).fields
        .Reason_For_Loss__s,
    ).toBeNull();
    await expect(create({ Reason_For_Loss__s: "Price" })).rejects.toBeInstanceOf(ValidationError);
    const deal = await create({ Stage: "Closed Lost", Reason_For_Loss__s: "Price" });
    expect(
      (
        await service.update("Deals", deal.id, {
          Stage: "Closed Lost to Competition",
          Reason_For_Loss__s: "Competition",
        })
      ).fields.Reason_For_Loss__s,
    ).toBe("Competition");
    expect(
      (
        await service.update("Deals", deal.id, {
          Stage: "Qualification",
          Reason_For_Loss__s: null,
        })
      ).fields.Reason_For_Loss__s,
    ).toBeNull();
    expect(
      (await service.update("Deals", deal.id, { Stage: "Qualification" })).fields
        .Reason_For_Loss__s,
    ).toBeNull();
    await expect(
      service.update("Deals", deal.id, { Reason_For_Loss__s: "Price" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(
      (await service.update("Deals", deal.id, { Stage: "Closed Lost" })).fields.Reason_For_Loss__s,
    ).toBeNull();
  });
  it("snapshots transitions, uses UTC calendar days, skips unchanged stages and cascades deletion", async () => {
    const { service, create, history, advance } = setup();
    const deal = await create({ Amount: 1000 });
    expect((await history(deal.id)).records).toHaveLength(1);
    advance("2026-01-16T00:05:00Z");
    const changed = await service.update("Deals", deal.id, {
      Stage: "Needs Analysis",
      Amount: 2000,
      Closing_Date: "2027-01-01",
    });
    expect(changed.fields.Stage_Modified_Time).toBe("2026-01-16T00:05:00.000Z");
    const rows = (await history(deal.id)).records;
    expect(rows).toHaveLength(2);
    expect(rows[0]?.fields).toMatchObject({
      Stage: "Needs Analysis",
      Amount: 2000,
      Probability: 20,
      Expected_Revenue: 400,
      Closing_Date: "2027-01-01",
      Modified_By: "rules-user",
      Modified_Time: "2026-01-16T00:05:00.000Z",
      Moved_To__s: null,
      Stage_Duration_Calendar_Days: null,
    });
    expect(rows[1]?.fields).toMatchObject({
      Stage: "Qualification",
      Amount: 1000,
      Probability: 10,
      Expected_Revenue: 100,
      Moved_To__s: "Needs Analysis",
      Stage_Duration_Calendar_Days: 1,
    });
    advance("2026-01-17T12:00:00Z");
    const same = await service.update("Deals", deal.id, {
      Stage: "Needs Analysis",
      Probability: 33,
    });
    expect(same.fields.Stage_Modified_Time).toBe(changed.fields.Stage_Modified_Time);
    expect((await history(deal.id)).records).toHaveLength(2);
    await service.delete("Deals", [deal.id]);
    expect((await history(deal.id)).records).toHaveLength(0);
  });
  it("changes probability and histories in mass updates and validates the whole batch before writing", async () => {
    const { service, create, history } = setup();
    const a = await create({ Amount: 100 });
    const b = await create({ Stage: "Closed Lost", Reason_For_Loss__s: "Price" });
    await expect(
      service.massUpdate("Deals", [a.id, b.id], { Reason_For_Loss__s: "Price" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect((await service.get("Deals", a.id)).fields.Reason_For_Loss__s).toBeNull();
    await service.massUpdate("Deals", [a.id, a.id, b.id], { Stage: "Closed Won" });
    for (const id of [a.id, b.id]) {
      expect((await service.get("Deals", id)).fields).toMatchObject({
        Stage: "Closed Won",
        Probability: 100,
        Reason_For_Loss__s: null,
      });
      expect((await history(id)).records).toHaveLength(2);
    }
    expect((await service.get("Deals", a.id)).fields.Expected_Revenue).toBe(100);
    await service.massUpdate("Deals", [a.id], { Amount: 200 });
    expect((await service.get("Deals", a.id)).fields.Expected_Revenue).toBe(200);
    expect((await history(a.id)).records).toHaveLength(2);
  });
  it("exposes the twelve history fields and rejects every direct mutation", async () => {
    const { service, create, history } = setup();
    expect((await service.getModule("DealHistory")).fields).toHaveLength(12);
    const deal = await create();
    const row = (await history(deal.id)).records[0];
    if (!row) throw new Error("Missing history");
    for (const write of [
      service.create("DealHistory", {}),
      service.update("DealHistory", row.id, { Stage: "Closed Won" }),
      service.delete("DealHistory", [row.id]),
      service.massUpdate("DealHistory", [row.id], { Stage: "Closed Won" }),
      service.changeOwner("DealHistory", [row.id], "rules-user"),
      service.merge("DealHistory", { masterId: row.id, duplicateIds: ["missing"], values: {} }),
      service.deduplicate("DealHistory", ["Stage"]),
    ])
      await expect(write).rejects.toBeInstanceOf(ForbiddenError);
    expect((await history(deal.id)).records).toHaveLength(1);
  });
  it("derives merge writes and removes the deleted duplicate histories", async () => {
    const { service, create, history } = setup();
    const master = await create({ Amount: 100 });
    const duplicate = await create();
    const merged = await service.merge("Deals", {
      masterId: master.id,
      duplicateIds: [duplicate.id],
      values: { Stage: "Closed Won" },
    });
    expect(merged.fields).toMatchObject({ Probability: 100, Expected_Revenue: 100 });
    expect((await history(master.id)).records).toHaveLength(2);
    expect((await history(duplicate.id)).records).toHaveLength(0);
  });
  it("creates when every create-visible writable field is null except required values", async () => {
    const { service } = setup();
    const nullables = Object.fromEntries(
      dealsMetadata.fields
        .filter(
          (field) =>
            field.views.create && !field.readOnly && !field.required && field.apiName !== "Owner",
        )
        .map((field) => [field.apiName, null]),
    );
    const deal = await service.create("Deals", {
      Deal_Name: "Form-shaped create",
      Account_Name: { module: "Accounts", id: "500000000000000000" },
      Closing_Date: "2026-12-15",
      Stage: "Qualification",
      ...nullables,
    });
    expect(deal.fields.Reason_For_Loss__s).toBeNull();
    expect(deal.fields.Probability).toBe(10);
  });
  it("seeds coherent derived fields and multiple-stage history", async () => {
    const { service, history } = setup();
    const deals = (await service.list("Deals", { viewId: "all-deals", page: 1, perPage: 100 }))
      .records;
    let transitions = 0;
    for (const deal of deals) {
      const stage = dealsPicklists.Stage?.find(
        (option) => option.storedValue === deal.fields.Stage,
      );
      expect(deal.fields.Probability).toBe(stage?.stage?.probability);
      expect(deal.fields.Expected_Revenue).toBe(
        (Number(deal.fields.Amount) * Number(deal.fields.Probability)) / 100,
      );
      expect(deal.fields.Reason_For_Loss__s).toBe(
        stage?.stage?.category === "Closed Lost" ? "Competition" : null,
      );
      const rows = (await history(deal.id)).records;
      expect(rows[0]?.fields.Stage).toBe(deal.fields.Stage);
      expect(rows[0]?.fields.Modified_Time).toBe(deal.fields.Stage_Modified_Time);
      if (rows.length > 1) {
        transitions++;
        expect(rows[1]?.fields.Stage_Duration_Calendar_Days).toBe(2);
      }
    }
    expect(transitions).toBeGreaterThan(1);
  });
});
