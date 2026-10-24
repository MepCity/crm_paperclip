import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createFixtureRecordService } from "./index";

function makeService() {
  return createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "references-test",
    orgName: "References Test Org",
    userId: "references-test-user",
    role: "admin",
  });
}

describe("cross-module lookup references", () => {
  it("returns null Account_Name on Contact after the linked account is deleted", async () => {
    const service = makeService();
    const account = await service.create("Accounts", { Account_Name: "Acme Corp" });
    const contact = await service.create("Contacts", {
      Last_Name: "Doe",
      Account_Name: { module: "Accounts", id: account.id },
    });
    // Verify the lookup resolves before deletion.
    expect(contact.fields.Account_Name).toMatchObject({
      module: "Accounts",
      id: account.id,
      name: expect.any(String),
    });

    await service.delete("Accounts", [account.id]);

    const fetched = await service.get("Contacts", contact.id);
    expect(fetched.fields.Account_Name).toBeNull();

    const listed = (
      await service.list("Contacts", { viewId: "all-contacts", page: 1, perPage: 100 })
    ).records.find((row) => row.id === contact.id);
    expect(listed?.fields.Account_Name).toBeNull();
  });

  it("returns null Account_Name on Deal after the linked account is deleted", async () => {
    const service = makeService();
    const account = await service.create("Accounts", { Account_Name: "Deals Account" });
    const deal = await service.create("Deals", {
      Deal_Name: "Test Deal",
      Stage: "Qualification",
      Closing_Date: "2027-01-01",
      Account_Name: { module: "Accounts", id: account.id },
    });
    expect(deal.fields.Account_Name).toMatchObject({
      module: "Accounts",
      id: account.id,
      name: expect.any(String),
    });

    await service.delete("Accounts", [account.id]);

    const fetched = await service.get("Deals", deal.id);
    expect(fetched.fields.Account_Name).toBeNull();

    const listed = (
      await service.list("Deals", { viewId: "all-deals", page: 1, perPage: 100 })
    ).records.find((row) => row.id === deal.id);
    expect(listed?.fields.Account_Name).toBeNull();
  });

  it("returns null Contact_Name on Deal after the linked contact is deleted", async () => {
    const service = makeService();
    const account = await service.create("Accounts", { Account_Name: "Contact Deal Account" });
    const contact = await service.create("Contacts", { Last_Name: "Smith" });
    const deal = await service.create("Deals", {
      Deal_Name: "Contact Deal",
      Stage: "Qualification",
      Closing_Date: "2027-01-01",
      Account_Name: { module: "Accounts", id: account.id },
      Contact_Name: { module: "Contacts", id: contact.id },
    });
    expect(deal.fields.Contact_Name).toMatchObject({
      module: "Contacts",
      id: contact.id,
      name: expect.any(String),
    });

    await service.delete("Contacts", [contact.id]);

    const fetched = await service.get("Deals", deal.id);
    expect(fetched.fields.Contact_Name).toBeNull();

    const listed = (
      await service.list("Deals", { viewId: "all-deals", page: 1, perPage: 100 })
    ).records.find((row) => row.id === deal.id);
    expect(listed?.fields.Contact_Name).toBeNull();
  });

  it("returns null Parent_Account on child account after the parent account is deleted", async () => {
    const service = makeService();
    const parent = await service.create("Accounts", { Account_Name: "Parent Corp" });
    const child = await service.create("Accounts", {
      Account_Name: "Child Corp",
      Parent_Account: { module: "Accounts", id: parent.id },
    });
    expect(child.fields.Parent_Account).toMatchObject({
      module: "Accounts",
      id: parent.id,
      name: expect.any(String),
    });

    await service.delete("Accounts", [parent.id]);

    const fetched = await service.get("Accounts", child.id);
    expect(fetched.fields.Parent_Account).toBeNull();

    const listed = (
      await service.list("Accounts", { viewId: "all-accounts", page: 1, perPage: 100 })
    ).records.find((row) => row.id === child.id);
    expect(listed?.fields.Parent_Account).toBeNull();
  });

  it("reflects the updated account name in Contact and Deal lookups after an account rename", async () => {
    const service = makeService();
    const account = await service.create("Accounts", { Account_Name: "Original Name" });
    const contact = await service.create("Contacts", {
      Last_Name: "Rename Test Contact",
      Account_Name: { module: "Accounts", id: account.id },
    });
    const deal = await service.create("Deals", {
      Deal_Name: "Rename Test Deal",
      Stage: "Qualification",
      Closing_Date: "2027-01-01",
      Account_Name: { module: "Accounts", id: account.id },
    });

    // Verify initial names.
    expect(contact.fields.Account_Name).toMatchObject({ name: "Original Name" });
    expect(deal.fields.Account_Name).toMatchObject({ name: "Original Name" });

    await service.update("Accounts", account.id, { Account_Name: "Renamed Corp" });

    const updatedContact = await service.get("Contacts", contact.id);
    expect(updatedContact.fields.Account_Name).toMatchObject({
      module: "Accounts",
      id: account.id,
      name: "Renamed Corp",
    });

    const updatedDeal = await service.get("Deals", deal.id);
    expect(updatedDeal.fields.Account_Name).toMatchObject({
      module: "Accounts",
      id: account.id,
      name: "Renamed Corp",
    });

    // Verify list also reflects the rename.
    const listedContact = (
      await service.list("Contacts", { viewId: "all-contacts", page: 1, perPage: 100 })
    ).records.find((row) => row.id === contact.id);
    expect(listedContact?.fields.Account_Name).toMatchObject({ name: "Renamed Corp" });

    const listedDeal = (
      await service.list("Deals", { viewId: "all-deals", page: 1, perPage: 100 })
    ).records.find((row) => row.id === deal.id);
    expect(listedDeal?.fields.Account_Name).toMatchObject({ name: "Renamed Corp" });
  });
});
