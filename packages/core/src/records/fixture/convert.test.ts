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
    await service.convertLead(lead.id, {
      account: { reuseId: account.id },
      contact: { create: { Last_Name: "Reuse" } },
    });
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
    fail = true;
    await expect(
      service.convertLead(lead.id, { contact: { create: { Last_Name: "Rollback" } } }),
    ).rejects.toThrow("boom");
    fail = false;
    const read = await service.get("Leads", lead.id);
    expect(read.fields.Converted__s).not.toBe(true);
    expect(read.fields.Converted_Contact ?? null).toBeNull();
    expect((await events(service, "Leads", lead.id)).length).toBe(before);
  });

  it("rejects an already converted lead", async () => {
    const service = make();
    const lead = await service.create("Leads", { Last_Name: "Twice", Company: "Example" });
    await service.convertLead(lead.id, { contact: { create: { Last_Name: "Twice" } } });
    await expect(
      service.convertLead(lead.id, { contact: { create: { Last_Name: "Twice" } } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("carries mapped lead values, explicit input wins, and links the targets", async () => {
    const service = make();
    const lead = await service.create("Leads", {
      Last_Name: "Mapped",
      First_Name: "Ann",
      Company: "Mapped Co",
      Email: "ann@example.com",
      Phone: "555-0101",
      Website: "https://example.com",
    });
    const result = await service.convertLead(lead.id, {
      account: { create: { Phone: "555-9999" } },
      contact: { create: {} },
      deal: {
        create: { Deal_Name: "Mapped deal", Stage: "Qualification", Closing_Date: "2026-12-01" },
      },
    });
    const account = await service.get("Accounts", result.accountId as string);
    expect(account.fields).toMatchObject({
      Account_Name: "Mapped Co",
      Website: "https://example.com",
      Phone: "555-9999",
    });
    const contact = await service.get("Contacts", result.contactId as string);
    expect(contact.fields).toMatchObject({
      Last_Name: "Mapped",
      Email: "ann@example.com",
      Phone: "555-0101",
      Account_Name: { module: "Accounts", id: result.accountId },
    });
    const deal = await service.get("Deals", result.dealId as string);
    expect(deal.fields).toMatchObject({
      Account_Name: { module: "Accounts", id: result.accountId },
      Contact_Name: { module: "Contacts", id: result.contactId },
    });
  });

  it("rejects a conversion without a contact target", async () => {
    const service = make();
    const lead = await service.create("Leads", { Last_Name: "NoContact", Company: "Example" });
    await expect(
      service.convertLead(lead.id, { account: { create: { Account_Name: "X" } } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects an invalid owner or reference without writing anything", async () => {
    const service = make();
    const lead = await service.create("Leads", { Last_Name: "Invalid", Company: "Example" });
    await expect(
      service.convertLead(lead.id, { contact: { create: { Owner: "stranger" } } }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.convertLead(lead.id, {
        contact: { create: {} },
        deal: {
          create: {
            Deal_Name: "Bad",
            Stage: "Qualification",
            Account_Name: { module: "Accounts", id: "missing" },
          },
        },
      }),
    ).rejects.toBeDefined();
    const read = await service.get("Leads", lead.id);
    expect(read.fields.Converted__s).not.toBe(true);
    expect(read.fields.Converted_Contact ?? null).toBeNull();
  });
});
