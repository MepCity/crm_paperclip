import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import type { RecordInput } from "./contract";
import { describeRecordServiceContract } from "./contract-suite";
import type { RecordServiceContractModuleDefinition } from "./contract-suite-module";
import { createFixtureRecordService } from "./fixture";
import casesTable from "./fixture/cases/export-table.json";
import { fixtureModules } from "./fixture/registry";
import solutionsTable from "./fixture/solutions/export-table.json";

const now = new Date("2026-10-17T12:00:00Z");
const make = (options = {}) =>
  createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "service-test",
      orgName: "Synthetic organization",
      userId: "test-user",
      role: "admin",
    },
    { now: () => now, ...options },
  );
const caseInput = (extra: RecordInput = {}): RecordInput => ({
  Subject: "Example case",
  Status: "New",
  Case_Origin: "Email",
  ...extra,
});
const solutionInput = (extra: RecordInput = {}): RecordInput => ({
  Solution_Title: "Example solution",
  ...extra,
});
for (const [module, title, size, build, table] of [
  ["Cases", "Subject", 60, caseInput, casesTable],
  ["Solutions", "Solution_Title", 25, solutionInput, solutionsTable],
] as const) {
  const number = module === "Cases" ? "Case_Number" : "Solution_Number";
  const definition: RecordServiceContractModuleDefinition = {
    apiName: module,
    singularLabel: module.slice(0, -1),
    pluralLabel: module,
    expectedFieldCount: table.fields.length,
    buildMinimalValidInput: build,
    systemFields: {
      owner: "Owner",
      createdBy: "Created_By",
      modifiedBy: "Modified_By",
      createdTime: "Created_Time",
      modifiedTime: "Modified_Time",
      lastActivityTime: "Last_Activity_Time",
    },
    filterMarker: {
      field: title,
      sample: "Contract sample",
      updated: "Contract updated",
      tenantOther: "Other tenant",
    },
    duplicatePermittedField: "Add_Comment",
    sortFields: [title, "Status"],
    expectedUniqueFields: [],
    typeValidationCases: [
      [title, 1],
      ["Locked__s", "true"],
      ["No_of_comments", "one"],
    ],
  };
  describeRecordServiceContract(`${module} fixture`, createFixtureRecordService, definition);
  describe(module, () => {
    it("matches the sanitized export field, layout, picklist and view tables", async () => {
      const service = make();
      const metadata = await service.getModule(module);
      expect(metadata.fields).toEqual(
        table.fields.map((field) => ({
          ...field,
          ...(field.apiName === "Tag" ? { acceptsJsonArray: true } : {}),
          ...(field.dataType === "picklist"
            ? { picklist: table.picklists[field.apiName as keyof typeof table.picklists] }
            : {}),
        })),
      );
      expect(metadata.layout).toEqual(table.layout);
      expect(await service.listViews(module)).toEqual(table.views);
    });
    it("covers every view and picklist with deterministic seeds and ordered numbers", async () => {
      const service = make();
      const rows = (
        await service.list(module, { viewId: `all-${module.toLowerCase()}`, page: 1, perPage: 100 })
      ).records;
      expect(rows).toHaveLength(size);
      const ordered = [...rows].sort(
        (a, b) =>
          String(a.fields.Created_Time).localeCompare(String(b.fields.Created_Time)) ||
          a.id.localeCompare(b.id),
      );
      expect(ordered.map((row) => row.fields[number])).toEqual(
        Array.from({ length: size }, (_, i) => String(i + 1)),
      );
      for (const [field, options] of Object.entries(table.picklists))
        for (const option of options)
          expect(rows.some((row) => row.fields[field] === option.storedValue)).toBe(true);
      for (const view of await service.listViews(module))
        expect(await service.count(module, { viewId: view.id })).toBeGreaterThan(0);
    });
    it("rejects missing required fields and client-managed numbers without consuming numbers", async () => {
      const service = make();
      const required =
        module === "Cases" ? ["Subject", "Status", "Case_Origin"] : ["Solution_Title"];
      for (const field of required)
        await expect(service.create(module, build({ [field]: null }))).rejects.toBeInstanceOf(
          ValidationError,
        );
      await expect(service.create(module, build({ [number]: "999" }))).rejects.toBeInstanceOf(
        ValidationError,
      );
      const first = await service.create(module, build());
      expect(first.fields[number]).toBe(String(size + 1));
      await expect(service.update(module, first.id, { [number]: "999" })).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect((await service.update(module, first.id, { [title]: "Changed" })).fields[number]).toBe(
        String(size + 1),
      );
      // Clone follows the existing client path: copy only writable non-managed values.
      const bundle = fixtureModules[module];
      if (!bundle) throw new Error("Missing bundle");
      const cloneInput = Object.fromEntries(
        bundle.metadata.fields
          .filter(
            (field) =>
              field.views.create && !field.readOnly && !bundle.managedFields.has(field.apiName),
          )
          .map((field) => [field.apiName, first.fields[field.apiName] ?? null]),
      );
      const clone = await service.create(module, cloneInput);
      expect(clone.fields[number]).toBe(String(size + 2));
      await service.delete(module, [clone.id]);
      expect((await service.create(module, build())).fields[number]).toBe(String(size + 3));
    });
    it("retains numbers on mass update and merge", async () => {
      const service = make();
      const master = await service.create(module, build());
      const duplicate = await service.create(module, build());
      await service.massUpdate(module, [master.id, duplicate.id], {
        Status: module === "Cases" ? "Closed" : "Reviewed",
      });
      expect((await service.get(module, master.id)).fields[number]).toBe(master.fields[number]);
      const merged = await service.merge(module, {
        masterId: master.id,
        duplicateIds: [duplicate.id],
        values: {},
      });
      expect(merged.fields[number]).toBe(master.fields[number]);
      expect((await service.create(module, build())).fields[number]).toBe(String(size + 3));
    });
    it("rolls back sequence and record publication on atomic failure", async () => {
      let fail = true;
      const service = make({
        beforeHistoryAppend: () => {
          if (fail) throw new Error("Publication failed");
        },
      });
      await expect(service.create(module, build())).rejects.toThrow("Publication failed");
      expect(await service.count(module, { viewId: `all-${module.toLowerCase()}` })).toBe(size);
      fail = false;
      expect((await service.create(module, build())).fields[number]).toBe(String(size + 1));
    });
    it("preserves unregistered Products references", async () => {
      const service = make();
      const product = { module: "Products", id: "synthetic-product" };
      const row = await service.create(module, build({ Product_Name: product }));
      expect((await service.get(module, row.id)).fields.Product_Name).toEqual(product);
    });
    it("resolves activity, note and attachment parent lookups to the registered module", async () => {
      const service = make();
      const parent = await service.create(module, build());
      const ref = { module, id: parent.id };
      const task = await service.create("Tasks", { Subject: "Linked task", What_Id: ref });
      expect((await service.get("Tasks", task.id)).fields.What_Id).toEqual({
        ...ref,
        name: parent.fields[title],
      });
      const note = await service.create("Notes", { Note_Title: "Linked note", Parent_Id: ref });
      expect((await service.get("Notes", note.id)).fields.Parent_Id).toEqual({
        ...ref,
        name: parent.fields[title],
      });
      const attachment = await service.create("Attachments", {
        File_Name: "https://example.test/help",
        Size: "0",
        Parent_Id: ref,
        $type: "link",
        $link_url: "https://example.test/help",
      });
      expect((await service.get("Attachments", attachment.id)).fields.Parent_Id).toEqual({
        ...ref,
        name: parent.fields[title],
      });
      const attachmentField = (await service.getModule("Attachments")).fields.find(
        (field) => field.apiName === "Parent_Id",
      );
      expect(attachmentField?.lookup?.modules).toContain(module);
      await service.delete(module, [parent.id]);
      await expect(service.get("Tasks", task.id)).rejects.toThrow();
      await expect(service.get("Notes", note.id)).rejects.toThrow();
      await expect(service.get("Attachments", attachment.id)).rejects.toThrow();
    });
  });
}
it("maintains independent module sequences", async () => {
  const service = make();
  await service.create("Cases", caseInput());
  await service.create("Cases", caseInput());
  expect((await service.create("Solutions", solutionInput())).fields.Solution_Number).toBe("26");
});
for (const [module, field, input] of [
  ["Accounts", "Account_Name", { Account_Name: "Linked account" }],
  ["Contacts", "Related_To", { Last_Name: "Linked contact" }],
  ["Deals", "Deal_Name", { Deal_Name: "Linked deal", Stage: "Qualification" }],
] as const) {
  it(`lists/counts Cases for ${module} and applies shared dangling-reference deletion`, async () => {
    const service = make();
    const account = await service.create("Accounts", { Account_Name: "Deal parent" });
    const parent = await service.create(
      module,
      module === "Deals"
        ? {
            ...input,
            Closing_Date: "2026-10-30",
            Account_Name: { module: "Accounts", id: account.id },
          }
        : input,
    );
    const ref = { module, id: parent.id };
    const row = await service.create("Cases", caseInput({ [field]: ref }));
    const query = {
      viewId: "all-cases",
      page: 1,
      perPage: 100,
      filters: { field, comparator: "equal" as const, value: parent.id },
    };
    expect((await service.list("Cases", query)).records.map((item) => item.id)).toEqual([row.id]);
    expect(await service.count("Cases", query)).toBe(1);
    expect((await service.get("Cases", row.id)).fields[field]).toMatchObject(ref);
    await service.delete(module, [parent.id]);
    expect((await service.get("Cases", row.id)).fields[field]).toBeNull();
    expect(await service.count("Cases", query)).toBe(0);
  });
}
