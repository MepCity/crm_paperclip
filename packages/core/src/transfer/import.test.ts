import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { AppError, ValidationError } from "../errors";
import type { FieldDefinition, ModuleMetadata } from "../records/contract";
import { createFixtureRecordService } from "../records/fixture";
import type { OrgContext } from "../tenancy/types";
import type { Upload } from "./history";
import {
  defaultMatch,
  importRows,
  matchFields,
  normalizeHeader,
  validateMapping,
  writable,
} from "./import";
import type { ImportJob, ImportSettings, TransferDependencies, TransferModule } from "./types";

function makeField(overrides: Partial<FieldDefinition> & { apiName: string }): FieldDefinition {
  return {
    label: overrides.apiName,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: {
      view: true,
      create: true,
      edit: true,
      quickCreate: false,
    },
    ...overrides,
  };
}

function makeMetadata(
  module: TransferModule = "Leads",
  fields: FieldDefinition[] = [],
): ModuleMetadata {
  return {
    apiName: module,
    singularLabel: module.slice(0, -1),
    pluralLabel: module,
    businessCardFields: [],
    fields,
    layout: [],
  };
}

function makeUpload(headers: string[] = ["Email", "Last_Name"], rows: string[][] = []): Upload {
  return {
    id: "upload-1",
    userId: "user-1",
    module: "Leads",
    fileName: "test.csv",
    charset: "UTF-8",
    headers,
    rows,
    at: Date.now(),
  };
}

function makeSettings(overrides: Partial<ImportSettings> = {}): ImportSettings {
  return {
    mode: "add",
    ignoreEmptyOnUpdate: false,
    mapping: [],
    defaults: [],
    ...overrides,
  };
}

function expectValidationError(fn: () => unknown, key: string) {
  try {
    fn();
    expect.unreachable("expected ValidationError to be thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toHaveProperty(key);
  }
}

function expectAppError(fn: () => unknown, code: string) {
  try {
    fn();
    expect.unreachable(`expected AppError with code "${code}" to be thrown`);
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
  }
}

describe("normalizeHeader", () => {
  it("lower-cases and removes spaces and underscores", () => {
    expect(normalizeHeader("First_Name")).toBe("firstname");
    expect(normalizeHeader("first name")).toBe("firstname");
    expect(normalizeHeader("FIRSTNAME")).toBe("firstname");
    expect(normalizeHeader("  Email_Address  ")).toBe("emailaddress");
    expect(normalizeHeader("Account_Owner_Name")).toBe("accountownername");
    expect(normalizeHeader("A_B C_d")).toBe("abcd");
    expect(normalizeHeader("")).toBe("");
  });
});

describe("writable", () => {
  it("returns false for readOnly fields", () => {
    const field = makeField({
      apiName: "Formula_Field",
      readOnly: true,
      views: { view: true, create: true, edit: true, quickCreate: true },
    });
    expect(writable(field)).toBe(false);
  });

  it("returns false for managed fields", () => {
    const managedNames = [
      "id",
      "Created_By",
      "Modified_By",
      "Created_Time",
      "Modified_Time",
      "Locked__s",
    ];
    for (const name of managedNames) {
      const field = makeField({
        apiName: name,
        readOnly: false,
        views: { view: true, create: true, edit: true, quickCreate: true },
      });
      expect(writable(field)).toBe(false);
    }
  });

  it("returns false for fields with neither views.create nor views.edit", () => {
    const field = makeField({
      apiName: "View_Only",
      readOnly: false,
      views: { view: true, create: false, edit: false, quickCreate: false },
    });
    expect(writable(field)).toBe(false);
  });

  it("returns true otherwise when create or edit view is enabled and not managed/readOnly", () => {
    const createOnly = makeField({
      apiName: "Create_Only",
      readOnly: false,
      views: { view: true, create: true, edit: false, quickCreate: false },
    });
    expect(writable(createOnly)).toBe(true);

    const editOnly = makeField({
      apiName: "Edit_Only",
      readOnly: false,
      views: { view: true, create: false, edit: true, quickCreate: false },
    });
    expect(writable(editOnly)).toBe(true);

    const both = makeField({
      apiName: "Standard_Field",
      readOnly: false,
      views: { view: true, create: true, edit: true, quickCreate: false },
    });
    expect(writable(both)).toBe(true);
  });
});

describe("matchFields", () => {
  it("always starts with id and contains unique fields and module default match field", () => {
    const emailField = makeField({ apiName: "Email", label: "Email", unique: false });
    const lastNameField = makeField({ apiName: "Last_Name", label: "Last Name", unique: false });
    const leadMeta = makeMetadata("Leads", [lastNameField, emailField]);

    expect(matchFields(leadMeta, "Leads")).toEqual([
      { field: "id", label: "Record Id" },
      { field: "Email", label: "Email" },
    ]);
  });

  it("includes unique fields and default match field in metadata order without duplicates when default is unique", () => {
    const emailField = makeField({ apiName: "Email", label: "Email", unique: true });
    const taxIdField = makeField({ apiName: "Tax_Id", label: "Tax Id", unique: true });
    const lastNameField = makeField({ apiName: "Last_Name", label: "Last Name", unique: false });

    // Metadata order: Tax_Id before Email
    const metaTaxFirst = makeMetadata("Leads", [taxIdField, lastNameField, emailField]);
    expect(matchFields(metaTaxFirst, "Leads")).toEqual([
      { field: "id", label: "Record Id" },
      { field: "Tax_Id", label: "Tax Id" },
      { field: "Email", label: "Email" },
    ]);

    // Metadata order: Email before Tax_Id, Email is unique so it must not duplicate
    const metaEmailFirst = makeMetadata("Leads", [emailField, lastNameField, taxIdField]);
    expect(matchFields(metaEmailFirst, "Leads")).toEqual([
      { field: "id", label: "Record Id" },
      { field: "Email", label: "Email" },
      { field: "Tax_Id", label: "Tax Id" },
    ]);
  });

  it("supports default match fields for Contacts, Accounts and Deals", () => {
    const contactsMeta = makeMetadata("Contacts", [
      makeField({ apiName: "Email", label: "Contact Email" }),
    ]);
    expect(matchFields(contactsMeta, "Contacts")).toEqual([
      { field: "id", label: "Record Id" },
      { field: "Email", label: "Contact Email" },
    ]);

    const accountsMeta = makeMetadata("Accounts", [
      makeField({ apiName: "Account_Name", label: "Account Name" }),
    ]);
    expect(matchFields(accountsMeta, "Accounts")).toEqual([
      { field: "id", label: "Record Id" },
      { field: "Account_Name", label: "Account Name" },
    ]);

    const dealsMeta = makeMetadata("Deals", [
      makeField({ apiName: "Deal_Name", label: "Deal Name" }),
    ]);
    expect(matchFields(dealsMeta, "Deals")).toEqual([
      { field: "id", label: "Record Id" },
      { field: "Deal_Name", label: "Deal Name" },
    ]);
  });
});

describe("validateMapping", () => {
  const email = makeField({ apiName: "Email", label: "Email", required: true, unique: true });
  const lastName = makeField({ apiName: "Last_Name", label: "Last Name", required: true });
  const company = makeField({ apiName: "Company", label: "Company", required: false });
  const readOnlyField = makeField({
    apiName: "Auto_Number",
    label: "Auto Number",
    readOnly: true,
  });
  const defaultLeadMeta = makeMetadata("Leads", [email, lastName, company, readOnlyField]);
  const defaultUpload = makeUpload(["Email", "Last Name", "Company"]);

  it("throws ValidationError with key mode for invalid mode", () => {
    const settings = makeSettings({
      mode: "invalid" as unknown as ImportSettings["mode"],
      mapping: [
        { column: 0, field: "Email" },
        { column: 1, field: "Last_Name" },
      ],
    });
    expectValidationError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings),
      "mode",
    );
  });

  it("throws ValidationError with key mapping when column is out of range", () => {
    const settings = makeSettings({
      mapping: [{ column: 5, field: "Email" }],
    });
    expectValidationError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings),
      "mapping",
    );
  });

  it("throws ValidationError with key mapping when column is negative", () => {
    const settings = makeSettings({
      mapping: [{ column: -1, field: "Email" }],
    });
    expectValidationError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings),
      "mapping",
    );
  });

  it("throws ValidationError with key mapping when column is non-integer", () => {
    const settings = makeSettings({
      mapping: [{ column: 1.5, field: "Email" }],
    });
    expectValidationError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings),
      "mapping",
    );
  });

  it("throws ValidationError with key mapping when column is repeated", () => {
    const settings = makeSettings({
      mapping: [
        { column: 0, field: "Email" },
        { column: 0, field: "Last_Name" },
      ],
    });
    expectValidationError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings),
      "mapping",
    );
  });

  it("skips field: null columns without error", () => {
    const settings = makeSettings({
      mode: "add",
      mapping: [
        { column: 0, field: null },
        { column: 1, field: null },
        { column: 2, field: "Company" },
      ],
      defaults: [
        { field: "Email", value: "test@example.com" },
        { field: "Last_Name", value: "Smith" },
      ],
    });
    const result = validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings);
    expect(result).toBe("Email");
  });

  it("throws mapping_duplicate_field when mapping maps the same field twice", () => {
    const settings = makeSettings({
      mapping: [
        { column: 0, field: "Last_Name" },
        { column: 1, field: "Last_Name" },
      ],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings),
      "mapping_duplicate_field",
    );
  });

  it("throws mapping_system_field when mapping contains an unknown or non-writable field", () => {
    const unknownSettings = makeSettings({
      mapping: [{ column: 0, field: "Unknown_Field" }],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, unknownSettings),
      "mapping_system_field",
    );

    const readOnlySettings = makeSettings({
      mapping: [{ column: 0, field: "Auto_Number" }],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, readOnlySettings),
      "mapping_system_field",
    );

    const managedSettings = makeSettings({
      mapping: [{ column: 0, field: "Created_By" }],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, managedSettings),
      "mapping_system_field",
    );
  });

  it("allows id in mapping even though id is not writable as a normal record field", () => {
    const settings = makeSettings({
      mode: "update",
      matchField: "id",
      mapping: [{ column: 0, field: "id" }],
    });
    const result = validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings);
    expect(result).toBe("id");
  });

  it("throws mapping_duplicate_field when defaults contains duplicate fields", () => {
    const settings = makeSettings({
      mode: "add",
      mapping: [
        { column: 0, field: "Email" },
        { column: 1, field: "Last_Name" },
      ],
      defaults: [
        { field: "Company", value: "Acme 1" },
        { field: "Company", value: "Acme 2" },
      ],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings),
      "mapping_duplicate_field",
    );
  });

  it("throws mapping_system_field when defaults contains non-writable or unknown field", () => {
    const unknownDefault = makeSettings({
      mode: "add",
      mapping: [
        { column: 0, field: "Email" },
        { column: 1, field: "Last_Name" },
      ],
      defaults: [{ field: "Unknown_Field", value: "value" }],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, unknownDefault),
      "mapping_system_field",
    );

    const readOnlyDefault = makeSettings({
      mode: "add",
      mapping: [
        { column: 0, field: "Email" },
        { column: 1, field: "Last_Name" },
      ],
      defaults: [{ field: "Auto_Number", value: "value" }],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, readOnlyDefault),
      "mapping_system_field",
    );

    const idDefault = makeSettings({
      mode: "add",
      mapping: [
        { column: 0, field: "Email" },
        { column: 1, field: "Last_Name" },
      ],
      defaults: [{ field: "id", value: "rec-1" }],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, idDefault),
      "mapping_system_field",
    );
  });

  it("throws mapping_missing_required when a writable required field is missing in add or both mode", () => {
    // Missing Last_Name in add mode
    const addSettings = makeSettings({
      mode: "add",
      mapping: [{ column: 0, field: "Email" }],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, addSettings),
      "mapping_missing_required",
    );

    // Missing Last_Name in both mode
    const bothSettings = makeSettings({
      mode: "both",
      mapping: [{ column: 0, field: "Email" }],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, bothSettings),
      "mapping_missing_required",
    );
  });

  it("allows missing required field when covered by a default in add and both modes", () => {
    const addSettings = makeSettings({
      mode: "add",
      mapping: [{ column: 0, field: "Email" }],
      defaults: [{ field: "Last_Name", value: "Default Name" }],
    });
    expect(validateMapping(defaultLeadMeta, "Leads", defaultUpload, addSettings)).toBe("Email");

    const bothSettings = makeSettings({
      mode: "both",
      mapping: [{ column: 0, field: "Email" }],
      defaults: [{ field: "Last_Name", value: "Default Name" }],
    });
    expect(validateMapping(defaultLeadMeta, "Leads", defaultUpload, bothSettings)).toBe("Email");
  });

  it("allows missing required fields in update mode", () => {
    // In update mode, required fields do not need to be mapped if match field is mapped
    const updateSettings = makeSettings({
      mode: "update",
      mapping: [{ column: 0, field: "Email" }],
    });
    expect(validateMapping(defaultLeadMeta, "Leads", defaultUpload, updateSettings)).toBe("Email");
  });

  it("ignores non-writable required fields for mapping_missing_required", () => {
    const requiredReadOnly = makeField({
      apiName: "System_Required",
      label: "System Required",
      required: true,
      readOnly: true,
    });
    const meta = makeMetadata("Leads", [email, lastName, requiredReadOnly]);
    const settings = makeSettings({
      mode: "add",
      mapping: [
        { column: 0, field: "Email" },
        { column: 1, field: "Last_Name" },
      ],
    });
    expect(validateMapping(meta, "Leads", defaultUpload, settings)).toBe("Email");
  });

  it("throws invalid_match_field when matchField is not an allowed match field", () => {
    const settings = makeSettings({
      mode: "add",
      matchField: "Company", // Company is not unique and not default match
      mapping: [
        { column: 0, field: "Email" },
        { column: 1, field: "Last_Name" },
      ],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings),
      "invalid_match_field",
    );
  });

  it("throws match_field_required when matchField is not mapped in update or both mode", () => {
    const updateSettings = makeSettings({
      mode: "update",
      matchField: "Email",
      mapping: [{ column: 2, field: "Company" }],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, updateSettings),
      "match_field_required",
    );

    // In both mode, required fields (Email, Last_Name) must be satisfied;
    // if matchField is "id" and not mapped, match_field_required is thrown.
    const bothSettings = makeSettings({
      mode: "both",
      matchField: "id",
      mapping: [
        { column: 0, field: "Email" },
        { column: 1, field: "Last_Name" },
      ],
    });
    expectAppError(
      () => validateMapping(defaultLeadMeta, "Leads", defaultUpload, bothSettings),
      "match_field_required",
    );
  });

  it("allows matchField to be unmapped in add mode", () => {
    const settings = makeSettings({
      mode: "add",
      matchField: "Email",
      mapping: [{ column: 1, field: "Last_Name" }],
      defaults: [{ field: "Email", value: "new@example.com" }],
    });
    // In add mode, mapping matchField is not strictly required by match_field_required
    expect(validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings)).toBe("Email");
  });

  it("returns explicit matchField when specified", () => {
    const customUnique = makeField({
      apiName: "Custom_Unique",
      label: "Custom Unique",
      unique: true,
    });
    const meta = makeMetadata("Leads", [email, lastName, customUnique]);
    const settings = makeSettings({
      mode: "update",
      matchField: "Custom_Unique",
      mapping: [{ column: 0, field: "Custom_Unique" }],
    });
    expect(validateMapping(meta, "Leads", defaultUpload, settings)).toBe("Custom_Unique");
  });

  it("returns module default match field when matchField is omitted", () => {
    const settings = makeSettings({
      mode: "add",
      mapping: [
        { column: 0, field: "Email" },
        { column: 1, field: "Last_Name" },
      ],
    });
    expect(validateMapping(defaultLeadMeta, "Leads", defaultUpload, settings)).toBe("Email");

    const accountMeta = makeMetadata("Accounts", [
      makeField({ apiName: "Account_Name", label: "Account Name", required: true }),
    ]);
    const accountSettings = makeSettings({
      mode: "add",
      mapping: [{ column: 0, field: "Account_Name" }],
    });
    expect(validateMapping(accountMeta, "Accounts", defaultUpload, accountSettings)).toBe(
      defaultMatch.Accounts,
    );
  });
});

describe("importRows", () => {
  const ctx: OrgContext = {
    orgId: randomUUID(),
    orgSlug: "import-test",
    orgName: "Example",
    userId: "example-user",
    role: "admin",
  };
  const records = createFixtureRecordService(ctx);
  const deps: TransferDependencies = {
    records: () => records,
    authorize: vi.fn(async () => {}),
    listActors: async () => [{ id: ctx.userId, name: "Example User" }],
  };
  const upload = (headers: string[], rows: string[][]): Upload => ({
    id: "u1",
    userId: ctx.userId,
    module: "Contacts",
    fileName: "example.csv",
    charset: "UTF-8",
    headers,
    rows,
    at: 0,
  });
  const settings = (overrides: Partial<ImportSettings> = {}): ImportSettings => ({
    mode: "add",
    ignoreEmptyOnUpdate: false,
    mapping: [
      { column: 0, field: "Last_Name" },
      { column: 1, field: "Email" },
    ],
    defaults: [],
    ...overrides,
  });
  const newJob = (): ImportJob => ({
    id: "j1",
    module: "Contacts",
    fileName: "example.csv",
    createdBy: { id: ctx.userId, name: "Example User" },
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "completed",
    counts: { created: 0, updated: 0, skipped: 0, errors: 0 },
    undoable: false,
    rows: [],
  });

  it("creates, updates, skips and reports row errors", async () => {
    const metadata = await records.getModule("Contacts");
    const run = async (rows: string[][], over: Partial<ImportSettings>) => {
      const job = newJob();
      const s = settings(over);
      const matchField = validateMapping(metadata, "Contacts", upload(["a", "b"], rows), s);
      await importRows(ctx, records, deps, upload(["a", "b"], rows), s, metadata, matchField, job);
      return job;
    };
    const added = await run(
      [
        ["One", "one@example.test"],
        ["Two", "two@example.test"],
        ["Dup", "ONE@example.test"],
        ["", "bad@example.test"],
      ],
      {},
    );
    expect(added.counts).toEqual({ created: 2, updated: 0, skipped: 1, errors: 1 });
    expect(added.status).toBe("completed_with_errors");
    expect(added.undoable).toBe(true);
    expect(added.rows).toEqual([
      { row: 4, outcome: "skipped", code: "duplicate_in_file", field: "Email" },
      { row: 5, outcome: "error", code: "required_missing", field: "Last_Name" },
    ]);
    const again = await run([["One", "one@example.test"]], {});
    expect(again.counts).toEqual({ created: 0, updated: 0, skipped: 1, errors: 0 });
    expect(again.rows[0]?.code).toBe("already_exists");
    expect(again.status).toBe("failed");
    const updated = await run([["Renamed", "one@example.test"]], { mode: "update" });
    expect(updated.counts.updated).toBe(1);
    expect(updated.status).toBe("completed");
    expect(updated.undoable).toBe(false);
    const missing = await run([["Ghost", "ghost@example.test"]], { mode: "update" });
    expect(missing.counts.errors).toBe(1);
    expect(missing.rows[0]).toMatchObject({ code: "not_found", field: "Email" });
  });
});
