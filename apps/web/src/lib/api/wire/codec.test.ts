import { randomUUID } from "node:crypto";
import { ValidationError } from "@crm/core/errors";
import type {
  Criteria,
  CriteriaToken,
  FieldDataType,
  FieldDefinition,
  ListView,
  ModuleMetadata,
  RecordData,
} from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import {
  decodeCriteria,
  decodeField,
  decodeInput,
  decodeList,
  decodeModule,
  decodeRecord,
  decodeView,
  encodeCriteria,
  encodeField,
  encodeInfo,
  encodeInput,
  encodeLayout,
  encodeModule,
  encodeRecord,
  encodeView,
} from "./codec";
import { encodeError } from "./errors";

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const field = (apiName: string, dataType: FieldDataType): FieldDefinition => ({
  apiName,
  label: apiName,
  dataType,
  required: false,
  readOnly: false,
  unique: false,
  views: { view: true, create: false, edit: true, quickCreate: false },
});
const values = {
  text: "Example",
  textarea: "Line one\nLine two",
  email: "example@example.test",
  phone: "+10000000000",
  website: "https://example.test",
  picklist: "Option",
  integer: 12,
  currency: 25.5,
  boolean: false,
  datetime: "2026-01-01T00:00:00.000Z",
  double: 0.125,
  bigint: "99999999999999999999",
  lookup: "lookup-id",
  ownerlookup: "member-id",
  profileimage: "image-reference",
  multi_module_lookup: { module: "Contacts", id: "related-id" },
} as const;
const metadata: ModuleMetadata = {
  apiName: "Leads",
  singularLabel: "Lead",
  pluralLabel: "Leads",
  businessCardFields: ["ownerlookup", "email", "phone"],
  fields: [
    field("id", "bigint"),
    ...Object.keys(values).map((type) => field(type, type as FieldDataType)),
  ],
  layout: [
    {
      label: "Information",
      columnCount: 2,
      fields: Object.keys(values),
      columns: [Object.keys(values), []],
    },
  ],
};
const members = [{ userId: "member-id", name: "Example Member", email: "member@example.test" }];
const tokens: { port: CriteriaToken; wire: unknown }[] = [
  { port: { token: "CURRENTUSER" }, wire: { name: `\${CURRENTUSER}` } },
  { port: { token: "TODAY" }, wire: `\${TODAY}` },
  { port: { token: "AGEINDAYS", offset: 31 }, wire: `\${AGEINDAYS}+31` },
  { port: { token: "CATEGORY", name: "Junk" }, wire: `\${CATEGORY.Junk}` },
];

describe("wire codec", () => {
  it.each(["equal", "contains", "not_contains", "less_equal"] as const)(
    "preserves comparator %s and each token through JSON",
    (comparator) => {
      for (const { port, wire } of tokens) {
        const leaf: Criteria = { field: "Example", comparator, value: port };
        expect(encodeCriteria(leaf)).toEqual({
          field: { api_name: "Example" },
          comparator,
          value: wire,
        });
        expect(decodeCriteria(json(encodeCriteria(leaf)))).toEqual(leaf);
      }
      const plain: Criteria = { field: "Example", comparator, value: "literal" };
      expect(decodeCriteria(json(encodeCriteria(plain)))).toEqual(plain);
    },
  );
  it.each([-31, 0, 0.5, 1e21])("round-trips AGEINDAYS offset %s", (offset) => {
    const leaf: Criteria = {
      field: "Created_Time",
      comparator: "less_equal",
      value: { token: "AGEINDAYS", offset },
    };
    expect(encodeCriteria(leaf)).toMatchObject({
      value: `\${AGEINDAYS}${offset < 0 ? "" : "+"}${offset}`,
    });
    expect(decodeCriteria(json(encodeCriteria(leaf)))).toEqual(leaf);
  });
  it.each([
    `\${CURRENTUSER}`,
    `prefix \${TODAY}`,
    `\${TODAY} suffix`,
    `\${TODAY}\n`,
    `\${AGEINDAYS}`,
    `\${AGEINDAYS}+31suffix`,
    `\${AGEINDAYS}+31\n`,
    `\${CATEGORY.}`,
    `\${CATEGORY.Junk}\n`,
    `\${CATEGORY.Junk}suffix`,
    `\${UNKNOWN}`,
  ])("retains a non-token string %j", (value) => {
    const leaf: Criteria = { field: "text", comparator: "equal", value };
    expect(decodeCriteria(json(encodeCriteria(leaf)))).toEqual(leaf);
  });
  it("decodes exact literal token strings as tokens and preserves category spaces", () => {
    for (const { port, wire } of tokens.filter(({ wire }) => typeof wire === "string"))
      expect(
        decodeCriteria({ field: { api_name: "Example" }, comparator: "equal", value: wire }),
      ).toEqual({ field: "Example", comparator: "equal", value: port });
    const leaf: Criteria = {
      field: "Lead_Status",
      comparator: "equal",
      value: { token: "CATEGORY", name: "Not Qualified" },
    };
    expect(decodeCriteria(json(encodeCriteria(leaf)))).toEqual(leaf);
    expect(() =>
      decodeCriteria({
        field: { api_name: "Owner" },
        comparator: "equal",
        value: { name: `\${CURRENTUSER}`, extra: true },
      }),
    ).toThrow(ValidationError);
  });
  it("rejects invalid group_operator values with the filters key", () => {
    const validGroup = {
      group_operator: "AND",
      group: [{ field: { api_name: "Example" }, comparator: "equal", value: "x" }],
    };
    for (const group_operator of ["and", "Or", "XOR", undefined]) {
      try {
        decodeCriteria({ ...validGroup, group_operator });
        expect.fail("Expected a validation failure");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(encodeError(error)).toMatchObject({
          status: 400,
          body: { details: { fields: { filters: expect.any(Array) } } },
        });
      }
    }
    try {
      decodeCriteria({ group: validGroup.group });
      expect.fail("Expected a validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(encodeError(error)).toMatchObject({
        status: 400,
        body: { details: { fields: { filters: expect.any(Array) } } },
      });
    }
  });
  it("rejects unknown comparators with the filters key in both directions", () => {
    const leaf = { field: "Example", comparator: "unknown", value: "literal" };
    for (const encode of [
      () => encodeCriteria(leaf as Criteria),
      () => decodeCriteria({ ...leaf, field: { api_name: "Example" } }),
    ]) {
      try {
        encode();
        expect.fail("Expected a validation failure");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(encodeError(error)).toMatchObject({
          status: 400,
          body: { details: { fields: { filters: expect.any(Array) } } },
        });
      }
    }
  });
  it("round-trips all fourteen fixture view definitions through JSON", async () => {
    const service = createFixtureRecordService({
      orgId: randomUUID(),
      orgSlug: "codec-test",
      orgName: "Codec Test",
      userId: "codec-user",
      role: "admin",
    });
    const views = await service.listViews("Leads");
    expect(views).toHaveLength(14);
    for (const view of views) expect(decodeView(json(encodeView(view)))).toEqual(view);
  });
  it.each(Object.entries(values))(
    "round-trips %s write inputs and null through JSON",
    (type, value) => {
      for (const candidate of [value, null]) {
        const input = { [type]: candidate };
        expect(decodeInput(json(encodeInput(input, metadata)), metadata)).toEqual(input);
      }
    },
  );
  it("encodes owner and lookup write inputs as IDs without display properties", () => {
    expect(encodeInput({ ownerlookup: "member-id", lookup: "lookup-id" }, metadata)).toEqual({
      ownerlookup: { id: "member-id" },
      lookup: { id: "lookup-id" },
    });
    expect(encodeInput({}, metadata)).toEqual({});
    expect(() => encodeInput({ Unknown_Field: "value" }, metadata)).toThrow(ValidationError);
  });
  it("reports unknown record and layout fields as internal server errors", () => {
    for (const encode of [
      () => encodeRecord({ id: "row-id", fields: { Unknown_Field: "value" } }, metadata),
      () =>
        encodeLayout({
          ...metadata,
          layout: [
            {
              label: "Broken",
              columnCount: 1,
              fields: ["Unknown_Field"],
              columns: [["Unknown_Field"]],
            },
          ],
        }),
    ]) {
      try {
        encode();
        expect.fail("Expected an internal error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(ValidationError);
        expect(encodeError(error)).toMatchObject({
          status: 500,
          body: { code: "internal_error", details: {}, status: 500 },
        });
      }
    }
  });
  it.each(Object.entries(values))("round-trips %s values and null through JSON", (type, value) => {
    for (const candidate of [value, null]) {
      const row: RecordData = { id: "row-id", fields: { id: "row-id", [type]: candidate } };
      expect(decodeRecord(json(encodeRecord(row, metadata, members)), metadata)).toEqual(row);
    }
  });
  it("uses the observed owner keys and does not fabricate unresolved names", () => {
    expect(
      encodeRecord(
        { id: "row-id", fields: { ownerlookup: "member-id", lookup: "lookup-id" } },
        metadata,
        members,
      ),
    ).toEqual({
      id: "row-id",
      ownerlookup: { id: "member-id", name: "Example Member", email: "member@example.test" },
      lookup: { id: "lookup-id" },
    });
    expect(
      encodeRecord({ id: "row-id", fields: { ownerlookup: "missing-member" } }, metadata, members),
    ).toEqual({ id: "row-id", ownerlookup: { id: "missing-member" } });
  });
  it("round-trips every combination of surface flags through JSON", () => {
    for (let bits = 0; bits < 16; bits++) {
      const views = {
        view: !!(bits & 1),
        create: !!(bits & 2),
        edit: !!(bits & 4),
        quickCreate: !!(bits & 8),
      };
      const definition = { ...field("Example", "text"), views };
      expect(encodeField(definition).view_type).toEqual({
        view: views.view,
        create: views.create,
        edit: views.edit,
        quick_create: views.quickCreate,
      });
      expect(decodeField(json(encodeField(definition)))).toEqual(definition);
    }
  });
  it("round-trips the actual Owner write shape without display properties", async () => {
    const service = createFixtureRecordService({
      orgId: randomUUID(),
      orgSlug: "owner-codec",
      orgName: "Owner Codec",
      userId: "actor",
      role: "admin",
    });
    const module = await service.getModule("Leads");
    expect(encodeInput({ Owner: "actor" }, module)).toEqual({ Owner: { id: "actor" } });
    expect(decodeInput(json(encodeInput({ Owner: "actor" }, module)), module)).toEqual({
      Owner: "actor",
    });
    expect(encodeInput({}, module)).toEqual({});
    expect(() => encodeInput({ Owner: { module: "Contacts", id: "actor" } }, module)).toThrow(
      ValidationError,
    );
  });
  it("round-trips metadata, layout ordering and optional field attributes", () => {
    const module: ModuleMetadata = {
      ...metadata,
      fields: [
        ...metadata.fields,
        {
          ...field("Choice", "picklist"),
          maxLength: 20,
          required: true,
          readOnly: true,
          unique: true,
          picklist: [{ displayValue: "Shown", storedValue: "Stored" }],
          lookup: { module: "Contacts" },
        },
      ],
    };
    expect(
      decodeModule(
        json(encodeModule(module)),
        json(module.fields.map(encodeField)),
        json(encodeLayout(module)),
      ),
    ).toEqual(module);
    expect(encodeModule(module)).toEqual({
      api_name: "Leads",
      singular_label: "Lead",
      plural_label: "Leads",
      business_card_fields: [
        { api_name: "ownerlookup" },
        { api_name: "email" },
        { api_name: "phone" },
      ],
    });
    expect(encodeLayout(module).sections[0]).toMatchObject({
      display_label: "Information",
      column_count: 2,
      columns: [Object.keys(values), []],
    });
    expect(encodeField(module.fields.at(-1) as FieldDefinition)).toEqual({
      api_name: "Choice",
      field_label: "Choice",
      data_type: "picklist",
      system_mandatory: true,
      read_only: true,
      unique: { enforced: true },
      view_type: { view: true, create: false, edit: true, quick_create: false },
      length: 20,
      pick_list_values: [{ display_value: "Shown", actual_value: "Stored" }],
      lookup: { module: { api_name: "Contacts" } },
    });
  });
  it("round-trips a selected view, nested groups, arrays, nulls and sort", () => {
    const view: ListView = {
      id: "view-id",
      name: "Example View",
      systemDefined: false,
      isDefault: true,
      columns: ["text", "boolean"],
      criteria: {
        groupOperator: "and",
        group: [
          { field: "boolean", comparator: "equal", value: false },
          {
            groupOperator: "or",
            group: [{ field: "text", comparator: "equal", value: ["A", null] }],
          },
        ],
      },
      sort: { field: "text", order: "asc" },
    };
    expect(decodeView(json(encodeView(view)))).toEqual(view);
    expect(encodeView(view)).toEqual({
      id: "view-id",
      name: "Example View",
      system_defined: false,
      default: true,
      fields: [{ api_name: "text" }, { api_name: "boolean" }],
      criteria: {
        group_operator: "AND",
        group: [
          { field: { api_name: "boolean" }, comparator: "equal", value: false },
          {
            group_operator: "OR",
            group: [{ field: { api_name: "text" }, comparator: "equal", value: ["A", null] }],
          },
        ],
      },
      sort_by: "text",
      sort_order: "asc",
    });
    expect(decodeView(json(encodeView({ ...view, criteria: null, sort: null })))).toEqual({
      ...view,
      criteria: null,
      sort: null,
    });
    const leaf = { field: "boolean", comparator: "equal" as const, value: true };
    expect(decodeCriteria(json(encodeCriteria(leaf)))).toEqual(leaf);
  });
  it("round-trips page info with observed keys and page count", () => {
    const result = {
      records: [{ id: "row-id", fields: { id: "row-id", boolean: true } }],
      page: 2,
      perPage: 10,
      moreRecords: true,
      sort: { field: "boolean", order: "asc" as const },
    };
    const info = encodeInfo(result, 1);
    expect(info).toEqual({
      page: 2,
      per_page: 10,
      count: 1,
      more_records: true,
      sort_by: "boolean",
      sort_order: "asc",
    });
    expect(
      decodeList(
        json(result.records.map((row) => encodeRecord(row, metadata))),
        json(info),
        metadata,
      ),
    ).toEqual(result);
    expect(encodeInfo({ ...result, sort: { field: "id", order: "desc" } }, 1)).toMatchObject({
      sort_by: "id",
      sort_order: "desc",
    });
  });
});
