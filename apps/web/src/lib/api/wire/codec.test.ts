import type {
  FieldDataType,
  FieldDefinition,
  ListView,
  ModuleMetadata,
  RecordData,
} from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  decodeCriteria,
  decodeList,
  decodeModule,
  decodeRecord,
  decodeView,
  encodeCriteria,
  encodeField,
  encodeInfo,
  encodeLayout,
  encodeModule,
  encodeRecord,
  encodeView,
} from "./codec";

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const field = (apiName: string, dataType: FieldDataType): FieldDefinition => ({
  apiName,
  label: apiName,
  dataType,
  required: false,
  readOnly: false,
  unique: false,
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
  fields: [
    field("id", "bigint"),
    ...Object.keys(values).map((type) => field(type, type as FieldDataType)),
  ],
  layout: [{ label: "Information", columnCount: 2, fields: Object.keys(values) }],
};
const members = [{ userId: "member-id", name: "Example Member", email: "member@example.test" }];

describe("wire codec", () => {
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
    });
    expect(encodeLayout(module).sections[0]).toMatchObject({
      display_label: "Information",
      column_count: 2,
    });
    expect(encodeField(module.fields.at(-1) as FieldDefinition)).toEqual({
      api_name: "Choice",
      field_label: "Choice",
      data_type: "picklist",
      system_mandatory: true,
      read_only: true,
      unique: { enforced: true },
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
          { field: "boolean", comparator: "is", value: false },
          { groupOperator: "or", group: [{ field: "text", comparator: "is", value: ["A", null] }] },
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
        group_operator: "and",
        group: [
          { field: { api_name: "boolean" }, comparator: "equal", value: false },
          {
            group_operator: "or",
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
    const leaf = { field: "boolean", comparator: "is" as const, value: true };
    expect(decodeCriteria(json(encodeCriteria(leaf)))).toEqual(leaf);
  });
  it("round-trips page info with observed keys and page count", () => {
    const result = {
      records: [{ id: "row-id", fields: { id: "row-id", boolean: true } }],
      page: 2,
      perPage: 10,
      moreRecords: true,
    };
    const info = encodeInfo(result, 1, { field: "boolean", order: "asc" });
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
    expect(encodeInfo(result, 1)).toMatchObject({ sort_by: "id", sort_order: "desc" });
  });
});
