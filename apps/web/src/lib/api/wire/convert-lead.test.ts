import { randomUUID } from "node:crypto";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { beforeEach, describe, expect, it } from "vitest";
import { type OperationDeps, operationPath, operations } from "./operations";

let deps: OperationDeps;
const run = (leadId: string, body: unknown, module = "Leads") =>
  operations.convertLead.run(deps, { params: { module, recordId: leadId }, query: {}, body });
const newLead = async () =>
  (await deps.records.create("Leads", { Last_Name: "Wire", Company: "Wire Co" })).id;
const count = async (module: string) =>
  await deps.records.count(module, { viewId: `all-${module.toLowerCase()}` });

beforeEach(() => {
  deps = {
    records: createFixtureRecordService({
      orgId: randomUUID(),
      orgSlug: "convert-wire",
      orgName: "Convert Wire",
      userId: "wire-user",
      role: "admin",
    }),
    members: async () => [],
  };
});

describe("convert lead operation", () => {
  it("publishes a POST action path under the record", () => {
    expect(operations.convertLead.method).toBe("POST");
    expect(operationPath(operations.convertLead, { module: "Leads", recordId: "7" })).toBe(
      "/crm/v2.2/Leads/7/actions/convert",
    );
  });

  it("converts into new targets and marks the lead converted", async () => {
    const id = await newLead();
    const result = await run(id, {
      account: { create: {} },
      contact: { create: {} },
      deal: {
        create: { Deal_Name: "Wire deal", Stage: "Qualification", Closing_Date: "2026-12-31" },
      },
    });
    const body = result.body as { accountId: string; contactId: string; dealId: string };
    expect(body.accountId && body.contactId && body.dealId).toBeTruthy();
    expect((await deps.records.get("Leads", id)).fields.Converted__s).toBe(true);
    expect((await deps.records.get("Deals", body.dealId)).fields.Deal_Name).toBe("Wire deal");
  });

  it("reuses an existing account and contact", async () => {
    const account = await deps.records.create("Accounts", { Account_Name: "Existing" });
    const contact = await deps.records.create("Contacts", { Last_Name: "Existing" });
    const id = await newLead();
    const result = await run(id, {
      account: { reuseId: account.id },
      contact: { reuseId: contact.id },
    });
    expect(result.body).toMatchObject({ accountId: account.id, contactId: contact.id });
    expect((await deps.records.get("Contacts", contact.id)).fields.Account_Name).toMatchObject({
      id: account.id,
    });
  });

  it("rejects bad shapes, non-lead modules and missing contacts", async () => {
    const id = await newLead();
    await expect(run(id, { contact: { nothing: true } })).rejects.toMatchObject({
      name: "ValidationError",
    });
    await expect(run(id, { account: { create: {} } })).rejects.toMatchObject({
      name: "ValidationError",
    });
    await expect(run(id, { contact: { create: {} } }, "Contacts")).rejects.toMatchObject({
      name: "ValidationError",
    });
  });

  it("returns field errors for an invalid deal and leaves everything unchanged", async () => {
    const id = await newLead();
    const before = await count("Contacts");
    await expect(
      run(id, { contact: { create: {} }, deal: { create: { Stage: "Qualification" } } }),
    ).rejects.toMatchObject({ name: "ValidationError" });
    expect((await deps.records.get("Leads", id)).fields.Converted__s).not.toBe(true);
    expect(await count("Contacts")).toBe(before);
  });

  it("refuses an already converted lead", async () => {
    const id = await newLead();
    await run(id, { contact: { create: {} } });
    await expect(run(id, { contact: { create: {} } })).rejects.toMatchObject({
      name: "ValidationError",
    });
  });
});
