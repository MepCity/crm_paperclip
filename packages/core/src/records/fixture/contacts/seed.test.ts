import { describe, expect, it } from "vitest";
import { generateFixtureAccounts } from "../accounts/seed";
import { countryOptions, stateOptions } from "./address-picklists";
import { contactsMetadata } from "./metadata";
import { contactsPicklists } from "./picklists";
import { fullName, generateFixtureContacts } from "./seed";

const now = new Date("2026-02-01T12:00:00.000Z");

describe("prepared Contacts seed", () => {
  it("is deterministic, with every exported field and unique ids", () => {
    const contacts = generateFixtureContacts(68, now);
    expect(contacts).toHaveLength(250);
    expect(contacts).toEqual(generateFixtureContacts(68, now));
    expect(new Set(contacts.map((contact) => contact.id)).size).toBe(250);
    for (const contact of contacts) {
      expect(Object.keys(contact.fields)).toEqual(
        contactsMetadata.fields.map((field) => field.apiName),
      );
      expect(contact.fields.id).toBe(contact.id);
    }
  });

  it("only stores values that exist in the picklists", () => {
    const contacts = generateFixtureContacts(68, now);
    expect(countryOptions.length).toBeGreaterThan(1);
    expect(stateOptions.length).toBeGreaterThan(1);
    for (const [name, options] of Object.entries(contactsPicklists)) {
      const allowed = new Set(options.map((option) => option.storedValue));
      for (const contact of contacts) {
        const value = contact.fields[name];
        if (value === null || value === undefined) continue;
        expect(allowed.has(value as string)).toBe(true);
      }
    }
  });

  it("resolves Account_Name links to seeded accounts", () => {
    const accounts = new Map(
      generateFixtureAccounts(68, now).map((account) => [account.id, account]),
    );
    const linked = generateFixtureContacts(68, now).filter(
      (contact) => contact.fields.Account_Name,
    );
    expect(linked.length).toBeGreaterThan(0);
    for (const contact of linked) {
      const link = contact.fields.Account_Name as { module: string; id: string; name: string };
      expect(link.module).toBe("Accounts");
      expect(accounts.get(link.id)?.fields.Account_Name).toBe(link.name);
    }
  });

  it("builds fullName from salutation, first and last name, skipping empty parts", () => {
    expect(fullName({ Salutation: "Dr.", First_Name: "Ada", Last_Name: "Lovelace" })).toBe(
      "Dr. Ada Lovelace",
    );
    expect(fullName({ First_Name: null, Last_Name: "Solo" })).toBe("Solo");
    expect(fullName({ First_Name: "", Last_Name: "Solo" })).toBe("Solo");
    for (const contact of generateFixtureContacts(68, now))
      expect(contact.fields.Full_Name).toBe(fullName(contact.fields));
  });
});
