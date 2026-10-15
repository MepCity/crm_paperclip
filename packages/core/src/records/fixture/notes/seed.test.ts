import { describe, expect, it } from "vitest";
import { generateFixtureAccounts } from "../accounts/seed";
import { generateFixtureContacts } from "../contacts/seed";
import { generateFixtureDeals } from "../deals/seed";
import { generateFixtureLeads } from "../seed";
import { notesHooks } from "./hooks";
import { notesMetadata, notesMetadataSource, notesParentModules } from "./metadata";
import { generateFixtureNotes } from "./seed";

const generators = {
  Leads: generateFixtureLeads,
  Contacts: generateFixtureContacts,
  Accounts: generateFixtureAccounts,
  Deals: generateFixtureDeals,
};

describe("Notes metadata and seed", () => {
  it("preserves evidenced fields and restricts the polymorphic parent", () => {
    expect(notesMetadata.apiName).toBe("Notes");
    expect(notesMetadata.fields.map((field) => field.apiName)).toEqual([
      "Owner",
      "Note_Title",
      "Note_Content",
      "Parent_Id",
      "Created_By",
      "Modified_By",
      "Created_Time",
      "Modified_Time",
      "id",
    ]);
    expect(notesMetadata.fields.find((field) => field.apiName === "Note_Title")).toMatchObject({
      dataType: "text",
      maxLength: 120,
      required: false,
    });
    expect(notesMetadata.fields.find((field) => field.apiName === "Note_Content")).toMatchObject({
      dataType: "textarea",
      maxLength: 65_535,
      required: false,
    });
    expect(notesMetadataSource.fields.find((field) => field.apiName === "Parent_Id")).toMatchObject(
      { lookup: { module: "se_module" } },
    );
    expect(notesMetadata.fields.find((field) => field.apiName === "Parent_Id")).toMatchObject({
      required: true,
      lookup: { modules: notesParentModules },
    });
  });
  it.each([68, 17])("deterministically binds seed %s to the first parent records", (seed) => {
    const now = new Date("2026-02-01T12:00:00.000Z");
    const notes = generateFixtureNotes(seed, now);
    expect(generateFixtureNotes(seed, now)).toEqual(notes);
    expect(new Set(notes.map((note) => note.id)).size).toBe(notes.length);
    expect(notes).toHaveLength(4);
    for (const [index, module] of notesParentModules.entries()) {
      const parents = generators[module](seed, now);
      const note = notes[index];
      expect(note?.fields.Parent_Id).toEqual({ module, id: parents[0]?.id });
      expect(note?.fields.id).toBe(note?.id);
      expect(Object.keys(note?.fields ?? {})).toEqual(
        notesMetadata.fields.map((field) => field.apiName),
      );
      expect(() =>
        notesHooks.applyRules?.({ ...note?.fields }, {}, undefined, {
          registeredModules: notesParentModules,
          moduleStore: () => ({
            records: new Map(parents.map((record) => [record.id, record])),
            nextId: 1n,
          }),
        }),
      ).not.toThrow();
    }
    expect(generateFixtureNotes()[0]?.fields.Note_Title).toBeNull();
    const changed = generateFixtureNotes(seed, new Date("2026-02-02T12:00:00.000Z"));
    expect(changed[0]?.fields.Created_Time).not.toBe(notes[0]?.fields.Created_Time);
  });
});
