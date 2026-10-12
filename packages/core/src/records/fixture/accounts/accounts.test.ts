import { createHash, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../../../errors";
import { describeRecordServiceContract } from "../../contract-suite";
import { accountsRecordServiceContractModule } from "../../contract-suite-module";
import { contactsPicklists } from "../contacts/picklists";
import { createFixtureRecordService } from "../index";
import expectations from "./export-expectations.json";
import { accountsMetadata } from "./metadata";
import { accountsPicklists } from "./picklists";
import { fixtureAccountId, generateFixtureAccounts } from "./seed";

const make = () =>
  createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "accounts-test",
    orgName: "Synthetic Organization",
    userId: "accounts-user",
    role: "admin",
  });

describeRecordServiceContract(
  "fixture",
  createFixtureRecordService,
  accountsRecordServiceContractModule,
);

describe("Accounts export and references", () => {
  it("matches the sanitized export field table, picklists and four layout sections", () => {
    expect(
      accountsMetadata.fields.map((f) => [
        f.apiName,
        f.dataType,
        f.maxLength,
        f.required,
        f.readOnly,
        f.unique,
        f.massUpdate,
      ]),
    ).toEqual(expectations.fields);
    expect(accountsMetadata.layout).toEqual(expectations.layout);
    for (const [name, options] of Object.entries(expectations.picklists))
      expect(accountsPicklists[name]).toEqual(options);
    for (const [name, expected] of Object.entries(expectations.addressCatalogs)) {
      const options = accountsPicklists[name] ?? [];
      expect(options).toHaveLength(expected.count);
      expect(
        createHash("sha256")
          .update(JSON.stringify(options.map((o) => [o.displayValue, o.storedValue])))
          .digest("hex"),
      ).toBe(expected.sha256);
    }
    expect(accountsPicklists.Billing_Country).toBe(contactsPicklists.Mailing_Country);
    expect(accountsPicklists.Shipping_Country).toBe(contactsPicklists.Mailing_Country);
    expect(accountsPicklists.Billing_State).toBe(contactsPicklists.Mailing_State);
    expect(accountsPicklists.Shipping_State).toBe(contactsPicklists.Mailing_State);
  });
  it("publishes eight views and still rejects unknown modules", async () => {
    const service = make();
    expect((await service.listViews("Accounts")).map((v) => v.name)).toEqual([
      "All Accounts",
      "All Locked Accounts",
      "My Accounts",
      "New Last Week",
      "New This Week",
      "Recently Created Accounts",
      "Recently Modified Accounts",
      "Unread Accounts",
    ]);
    expect((await service.listViews("Accounts")).map(({ id: _id, ...view }) => view)).toEqual(
      expectations.views,
    );
    await expect(service.getModule("Unknown")).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.create("Accounts", {})).rejects.toBeInstanceOf(ValidationError);
  });
  it("validates parent existence on writes, derives names and tolerates deleted parents", async () => {
    const service = make();
    const foreign = await make().create("Accounts", { Account_Name: "Foreign Account" });
    await expect(
      service.create("Accounts", {
        Account_Name: "Invalid",
        Parent_Account: { module: "Accounts", id: foreign.id },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    const parent = await service.create("Accounts", { Account_Name: "Parent" });
    const child = await service.create("Accounts", {
      Account_Name: "Child",
      Parent_Account: { module: "Accounts", id: parent.id, name: "Ignored" },
    });
    expect(child.fields.Parent_Account).toEqual({
      module: "Accounts",
      id: parent.id,
      name: "Parent",
    });
    await expect(
      service.update("Accounts", child.id, {
        Parent_Account: { module: "Accounts", id: "missing" },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await service.update("Accounts", parent.id, { Account_Name: "Renamed" });
    expect((await service.get("Accounts", child.id)).fields.Parent_Account).toEqual({
      module: "Accounts",
      id: parent.id,
      name: "Renamed",
    });
    const updated = await service.update("Accounts", child.id, {
      Parent_Account: { module: "Accounts", id: parent.id, name: "Ignored" },
    });
    expect(updated.fields.Parent_Account).toEqual({
      module: "Accounts",
      id: parent.id,
      name: "Renamed",
    });
    // The exported field is ineligible for mass update, independently of target validity.
    await expect(
      service.massUpdate("Accounts", [child.id], {
        Parent_Account: { module: "Accounts", id: "missing" },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await service.delete("Accounts", [parent.id]);
    expect((await service.get("Accounts", child.id)).fields.Parent_Account).toBeNull();
    const list = await service.list("Accounts", {
      viewId: "all-accounts",
      page: 1,
      perPage: 100,
      filters: { field: "id", comparator: "equal", value: child.id },
    });
    expect(list.records[0]?.fields.Parent_Account).toBeNull();
  });
  it("validates Contacts accounts and queries both related lists by opaque identity", async () => {
    const service = make();
    const account = await service.create("Accounts", { Account_Name: "Related" });
    const ref = { module: "Accounts", id: account.id, name: "Ignored" };
    await expect(
      service.create("Contacts", { Last_Name: "Invalid", Account_Name: { ...ref, id: "missing" } }),
    ).rejects.toBeInstanceOf(ValidationError);
    const contact = await service.create("Contacts", { Last_Name: "First", Account_Name: ref });
    const second = await service.create("Contacts", { Last_Name: "Second" });
    await expect(
      service.update("Contacts", second.id, { Account_Name: { ...ref, id: "missing" } }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(
      (await service.update("Contacts", second.id, { Account_Name: ref })).fields.Account_Name,
    ).toEqual({ ...ref, name: "Related" });
    expect(contact.fields.Account_Name).toEqual({ ...ref, name: "Related" });
    const child = await service.create("Accounts", { Account_Name: "Member", Parent_Account: ref });
    for (const [module, field, viewId, ids] of [
      ["Contacts", "Account_Name", "all-contacts", [contact.id, second.id]],
      ["Accounts", "Parent_Account", "all-accounts", [child.id]],
    ] as const) {
      const filters = { field, comparator: "equal" as const, value: account.id };
      const result = await service.list(module, { viewId, filters, page: 1, perPage: 100 });
      expect(result.records.map((r) => r.id).sort()).toEqual([...ids].sort());
      expect(await service.count(module, { viewId, filters })).toBe(ids.length);
    }
    const byName = await service.list("Contacts", {
      viewId: "all-contacts",
      page: 1,
      perPage: 100,
      filters: { field: "Account_Name", comparator: "equal", value: "Related" },
    });
    expect(byName.records.map((r) => r.id).sort()).toEqual([contact.id, second.id].sort());
    const excluded = await service.list("Contacts", {
      viewId: "all-contacts",
      page: 1,
      perPage: 100,
      filters: { field: "Account_Name", comparator: "not_equal", value: account.id },
    });
    expect(excluded.records.map((r) => r.id)).not.toContain(contact.id);
    await service.delete("Accounts", [account.id]);
    expect((await service.get("Contacts", contact.id)).fields.Account_Name).toBeNull();
    expect(
      (
        await service.list("Contacts", {
          viewId: "all-contacts",
          page: 1,
          perPage: 100,
          filters: { field: "id", comparator: "equal", value: contact.id },
        })
      ).records[0]?.fields.Account_Name,
    ).toBeNull();
  });
  it("seeds repeatable two-level groups, multi-contact accounts and an empty account", async () => {
    expect(generateFixtureAccounts()).toEqual(generateFixtureAccounts());
    const service = make();
    expect(
      await service.count("Contacts", {
        viewId: "all-contacts",
        filters: { field: "Account_Name", comparator: "equal", value: fixtureAccountId(0) },
      }),
    ).toBeGreaterThan(1);
    expect(
      await service.count("Accounts", {
        viewId: "all-accounts",
        filters: { field: "Parent_Account", comparator: "equal", value: fixtureAccountId(0) },
      }),
    ).toBe(4);
    expect(
      await service.count("Contacts", {
        viewId: "all-contacts",
        filters: { field: "Account_Name", comparator: "equal", value: fixtureAccountId(249) },
      }),
    ).toBe(0);
    expect(
      await service.count("Accounts", {
        viewId: "all-accounts",
        filters: { field: "Parent_Account", comparator: "equal", value: fixtureAccountId(249) },
      }),
    ).toBe(0);
  });
});
