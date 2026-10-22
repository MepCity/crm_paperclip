import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import { createFixtureRecordService } from ".";

const make = (options?: Parameters<typeof createFixtureRecordService>[1]) => {
  const ctx: OrgContext = {
    orgId: randomUUID(),
    orgSlug: "test",
    orgName: "Test",
    userId: "admin",
    role: "admin",
  };
  return createFixtureRecordService(ctx, options);
};
const events = async (service: ReturnType<typeof make>, module: string, id: string) =>
  (await service.history.list(module, id, { perPage: 100 })).events;

describe("convertLead", () => {
  it("records one correlated operation: converted source, created and reused targets", async () => {
    const service = make();
    const lead = await service.create("Leads", { Last_Name: "Convert", Company: "Example" });
    const account = await service.create("Accounts", { Account_Name: "Existing" });
    const result = await service.convertLead(lead.id, {
      account: { reuseId: account.id, update: { Phone: "555-0100" } },
      contact: { create: { Last_Name: "Convert" } },
      deal: {
        create: {
          Deal_Name: "Convert deal",
          Stage: "Qualification",
          Closing_Date: "2026-12-31",
          Account_Name: { module: "Accounts", id: account.id },
        },
      },
    });
    expect(result.accountId).toBe(account.id);
    const read = await service.get("Leads", lead.id);
    expect(read.fields.Converted__s).toBe(true);
    expect(read.fields.Converted_Contact).toMatchObject({
      module: "Contacts",
      id: result.contactId,
    });

    const [converted] = (await events(service, "Leads", lead.id)).filter(
      (event) => event.kind === "record_converted",
    );
    expect(converted).toBeDefined();
    const op = converted?.operationId;
    const contact = (await events(service, "Contacts", result.contactId as string)).find(
      (event) => event.operationId === op,
    );
    const deal = (await events(service, "Deals", result.dealId as string)).find(
      (event) => event.operationId === op,
    );
    const reused = (await events(service, "Accounts", account.id)).find(
      (event) => event.operationId === op,
    );
    expect(contact?.kind).toBe("record_created");
    expect(deal?.kind).toBe("record_created");
    expect(reused?.kind).toBe("fields_updated");
    expect(reused?.changes.map((change) => change.apiName)).toEqual(["Phone"]);
    expect((await events(service, "Leads", lead.id)).some((e) => e.kind === "record_deleted")).toBe(
      false,
    );
  });

  it("emits nothing for a reused target without real changes", async () => {
    const service = make();
    const lead = await service.create("Leads", { Last_Name: "Reuse", Company: "Example" });
    const account = await service.create("Accounts", { Account_Name: "Quiet" });
    const before = (await events(service, "Accounts", account.id)).length;
    await service.convertLead(lead.id, { account: { reuseId: account.id } });
    expect((await events(service, "Accounts", account.id)).length).toBe(before);
  });

  it("rolls back every write and history event on failure", async () => {
    let fail = false;
    const service = make({
      beforeHistoryAppend() {
        if (fail) throw new Error("boom");
      },
    });
    const lead = await service.create("Leads", { Last_Name: "Rollback", Company: "Example" });
    const before = (await events(service, "Leads", lead.id)).length;
    const accounts = (await service.count("Accounts", { viewId: "" }).catch(() => null)) ?? null;
    fail = true;
    await expect(
      service.convertLead(lead.id, { contact: { create: { Last_Name: "Rollback" } } }),
    ).rejects.toThrow("boom");
    fail = false;
    const read = await service.get("Leads", lead.id);
    expect(read.fields.Converted__s).not.toBe(true);
    expect(read.fields.Converted_Contact ?? null).toBeNull();
    expect((await events(service, "Leads", lead.id)).length).toBe(before);
    void accounts;
  });

  it("rejects an already converted lead", async () => {
    const service = make();
    const lead = await service.create("Leads", { Last_Name: "Twice", Company: "Example" });
    await service.convertLead(lead.id, { contact: { create: { Last_Name: "Twice" } } });
    await expect(
      service.convertLead(lead.id, { contact: { create: { Last_Name: "Twice" } } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
