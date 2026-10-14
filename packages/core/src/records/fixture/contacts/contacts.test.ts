import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../../../errors";
import type { RecordInput } from "../../contract";
import { createFixtureRecordService } from "../index";
import { contactsViews } from "./views";

const make = () =>
  createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "contacts-test",
      orgName: "Synthetic Organization",
      userId: "contacts-user",
      role: "admin",
    },
    { now: () => new Date("2026-10-14T12:00:00Z") },
  );

describe("Contacts fixture CRUD", () => {
  it.each<RecordInput>([{}, { Last_Name: "" }, { Last_Name: "   " }, { Last_Name: null }])(
    "reports the mandatory Last_Name field for %j",
    async (input: RecordInput) => {
      const service = make();
      const before = await service.count("Contacts", { viewId: "all-contacts" });
      const failure = service.create("Contacts", input);
      await expect(failure).rejects.toBeInstanceOf(ValidationError);
      await expect(failure).rejects.toMatchObject({
        code: "validation",
        reason: "mandatory",
        fieldErrors: { Last_Name: ["This field is required."] },
      });
      expect(await service.count("Contacts", { viewId: "all-contacts" })).toBe(before);
    },
  );

  it("creates and reads a contact with only Last_Name", async () => {
    const service = make();
    const created = await service.create("Contacts", { Last_Name: "Minimal" });
    expect(created.id).toEqual(expect.any(String));
    expect(created.fields).toMatchObject({
      Last_Name: "Minimal",
      Full_Name: "Minimal",
      First_Name: null,
      Account_Name: null,
      Reporting_To: null,
      Owner: "contacts-user",
    });
    expect(await service.get("Contacts", created.id)).toEqual(created);
  });

  it("derives both lookup labels on create and read", async () => {
    const service = make();
    const account = await service.create("Accounts", { Account_Name: "Example Account" });
    const manager = await service.create("Contacts", {
      First_Name: "Example",
      Last_Name: "Manager",
    });
    const created = await service.create("Contacts", {
      Last_Name: "Report",
      Account_Name: { module: "Accounts", id: account.id, name: "Ignored account label" },
      Reporting_To: { module: "Contacts", id: manager.id, name: "Ignored contact label" },
    });
    for (const record of [created, await service.get("Contacts", created.id)]) {
      expect(record.fields.Account_Name).toEqual({
        module: "Accounts",
        id: account.id,
        name: "Example Account",
      });
      expect(record.fields.Reporting_To).toEqual({
        module: "Contacts",
        id: manager.id,
        name: "Example Manager",
      });
    }
  });

  it("preserves omitted fields in a partial update", async () => {
    const service = make();
    const created = await service.create("Contacts", {
      First_Name: "Example",
      Last_Name: "Contact",
      Email: "contact@example.org",
      Phone: "000-001",
      Description: "Original description",
    });
    const updated = await service.update("Contacts", created.id, { Phone: "000-002" });
    expect(updated).toEqual({ ...created, fields: { ...created.fields, Phone: "000-002" } });
    expect(await service.get("Contacts", created.id)).toEqual(updated);
    await expect(
      service.update("Contacts", "missing-contact", { Phone: "000-003" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it.each([1, 3])("deletes %i contacts without deleting an unselected contact", async (size) => {
    const service = make();
    const kept = await service.create("Contacts", { Last_Name: "Kept" });
    const targets = [];
    for (let index = 0; index < size; index++)
      targets.push(await service.create("Contacts", { Last_Name: `Removed ${index}` }));
    const before = await service.count("Contacts", { viewId: "all-contacts" });
    await service.delete(
      "Contacts",
      targets.map((record) => record.id),
    );
    for (const target of targets)
      await expect(service.get("Contacts", target.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await service.get("Contacts", kept.id)).toEqual(kept);
    expect(await service.count("Contacts", { viewId: "all-contacts" })).toBe(before - size);
  });

  it("rejects a missing batch target before deleting any existing target", async () => {
    const service = make();
    const first = await service.create("Contacts", { Last_Name: "First" });
    const second = await service.create("Contacts", { Last_Name: "Second" });
    const before = await service.count("Contacts", { viewId: "all-contacts" });
    await expect(
      service.delete("Contacts", [first.id, "missing-contact", second.id]),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await service.get("Contacts", first.id)).toEqual(first);
    expect(await service.get("Contacts", second.id)).toEqual(second);
    expect(await service.count("Contacts", { viewId: "all-contacts" })).toBe(before);
  });

  it("cannot read, update or delete another organization's contact", async () => {
    const owner = make();
    const other = make();
    const contact = await owner.create("Contacts", { Last_Name: "Private Contact" });
    await expect(other.get("Contacts", contact.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      other.update("Contacts", contact.id, { Last_Name: "Changed" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(other.delete("Contacts", [contact.id])).rejects.toBeInstanceOf(NotFoundError);
    expect(await owner.get("Contacts", contact.id)).toEqual(contact);
    expect(
      await other.count("Contacts", {
        viewId: "all-contacts",
        filters: { field: "id", comparator: "equal", value: contact.id },
      }),
    ).toBe(0);
  });
});

describe("Contacts fixture queries and views", () => {
  it("filters by account, sorts names and combines an alphabet filter with matching counts", async () => {
    const service = make();
    const account = await service.create("Accounts", { Account_Name: "Selected Account" });
    const contacts = [];
    for (const Last_Name of ["Beta", "Alpine", "Alpha"])
      contacts.push(
        await service.create("Contacts", {
          Last_Name,
          Account_Name: { module: "Accounts", id: account.id },
        }),
      );
    await service.create("Contacts", { Last_Name: "Alpha Elsewhere" });
    const filters = { field: "Account_Name", comparator: "equal" as const, value: account.id };
    const query = {
      viewId: "all-contacts",
      page: 1,
      perPage: 10,
      filters,
      sort: { field: "Full_Name", order: "asc" as const },
    };
    const listed = await service.list("Contacts", query);
    expect(listed.records.map((record) => record.id)).toEqual([
      contacts[2]?.id,
      contacts[1]?.id,
      contacts[0]?.id,
    ]);
    expect(listed.sort).toEqual(query.sort);
    expect(listed.moreRecords).toBe(false);
    expect(await service.count("Contacts", query)).toBe(listed.records.length);
    const alphabetQuery = {
      ...query,
      filters: {
        groupOperator: "and" as const,
        group: [filters, { field: "Full_Name", comparator: "starts_with" as const, value: "A" }],
      },
    };
    const alphabet = await service.list("Contacts", alphabetQuery);
    expect(alphabet.records.map((record) => record.id)).toEqual([contacts[2]?.id, contacts[1]?.id]);
    expect(await service.count("Contacts", alphabetQuery)).toBe(alphabet.records.length);
  });

  it("publishes and resolves every Contacts view through the service", async () => {
    const service = make();
    const contact = await service.create("Contacts", {
      Last_Name: "View Contact",
      Email_Opt_Out: true,
    });
    const includedViews = new Set([
      "all-contacts",
      "mailing-labels",
      "my-contacts",
      "new-this-week",
      "recently-created-contacts",
      "recently-modified-contacts",
      "unread-contacts",
      "unsubscribed-contacts",
    ]);
    expect(await service.listViews("Contacts")).toEqual(contactsViews);
    for (const view of contactsViews) {
      expect(await service.getView("Contacts", view.id)).toEqual(view);
      const query = {
        viewId: view.id,
        page: 1,
        perPage: 10,
        filters: { field: "Last_Name", comparator: "equal" as const, value: "View Contact" },
      };
      const result = await service.list("Contacts", query);
      const expected = includedViews.has(view.id) ? [contact.id] : [];
      expect(
        result.records.map((record) => record.id),
        view.id,
      ).toEqual(expected);
      expect(await service.count("Contacts", query)).toBe(expected.length);
    }
    await expect(service.getView("Contacts", "missing-view")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("applies owner and unsubscribed view criteria to created contacts", async () => {
    const service = make();
    const subscribed = await service.create("Contacts", {
      Last_Name: "Subscribed",
      Email_Opt_Out: false,
    });
    const unsubscribed = await service.create("Contacts", {
      Last_Name: "Unsubscribed",
      Email_Opt_Out: true,
    });
    const filters = {
      groupOperator: "or" as const,
      group: [subscribed, unsubscribed].map((record) => ({
        field: "id",
        comparator: "equal" as const,
        value: record.id,
      })),
    };
    for (const [viewId, expected] of [
      ["my-contacts", [subscribed.id, unsubscribed.id]],
      ["unsubscribed-contacts", [unsubscribed.id]],
    ] as const) {
      const query = { viewId, filters, page: 1, perPage: 10 };
      expect(
        (await service.list("Contacts", query)).records.map((record) => record.id).sort(),
      ).toEqual([...expected].sort());
      expect(await service.count("Contacts", query)).toBe(expected.length);
    }
  });
});
