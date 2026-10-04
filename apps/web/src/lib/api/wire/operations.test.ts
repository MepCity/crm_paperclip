import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { beforeEach, describe, expect, it } from "vitest";
import { encodeError } from "./errors";
import { type OperationDeps, type OperationRequest, operationPath, operations } from "./operations";

const input = (query: Record<string, string> = {}, body?: unknown): OperationRequest => ({
  params: { module: "Leads", viewId: "all-leads", recordId: "missing" },
  query: { module: "Leads", cvid: "all-leads", ...query },
  body,
});
const json = (value: unknown) => JSON.parse(JSON.stringify(value));
let deps: OperationDeps;
beforeEach(() => {
  deps = {
    records: createFixtureRecordService({
      orgId: randomUUID(),
      orgSlug: "wire-test",
      orgName: "Wire Test",
      userId: "wire-user",
      role: "admin",
    }),
    members: [{ userId: "wire-user", name: "Wire User", email: "wire@example.test" }],
  };
});

describe("wire operations", () => {
  it("returns the observed envelopes for all read endpoints", async () => {
    const module = await operations.module.run(deps, input());
    expect(json(module)).toEqual({
      status: 200,
      body: { modules: [{ api_name: "Leads", singular_label: "Lead", plural_label: "Leads" }] },
    });
    expect(json(await operations.views.run(deps, input())).body.custom_views[0]).toEqual({
      id: "all-leads",
      name: "All Leads",
      system_defined: true,
      default: true,
    });
    const fields = json(await operations.fields.run(deps, input())).body.fields;
    expect(fields).toHaveLength(56);
    expect(
      fields.find((field: { api_name: string }) => field.api_name === "Company"),
    ).toMatchObject({ field_label: "Company", data_type: "text", system_mandatory: true });
    expect(json(await operations.layouts.run(deps, input())).body.layouts[0].sections).toHaveLength(
      4,
    );
    expect(json(await operations.views.run(deps, input({ per_page: "11" }))).body).toMatchObject({
      custom_views: expect.any(Array),
      info: { page: 1, per_page: 11, count: 11, more_records: true, default: "all-leads" },
    });
    expect(json(await operations.view.run(deps, input())).body.custom_views[0]).toMatchObject({
      id: "all-leads",
      fields: expect.any(Array),
      criteria: null,
      sort_by: null,
      sort_order: null,
    });
    const bulk = json(await operations.bulk.run(deps, input({ page: "1", per_page: "10" })));
    expect(bulk.status).toBe(200);
    expect(bulk.body.data).toHaveLength(10);
    expect(bulk.body.info).toEqual({
      page: 1,
      per_page: 10,
      count: 10,
      more_records: true,
      sort_by: "id",
      sort_order: "desc",
    });
    const row = bulk.body.data[0];
    expect(row.Owner).toEqual({ id: "wire-user", name: "Wire User", email: "wire@example.test" });
    expect(
      json(
        await operations.record.run(deps, {
          ...input(),
          params: { module: "Leads", recordId: row.id },
        }),
      ).body.data[0].id,
    ).toBe(row.id);
    expect(await operations.count.run(deps, input())).toEqual({
      status: 200,
      body: { count: 250 },
    });
    expect(json(await operations.users.run(deps, input())).body).toEqual({
      users: [{ id: "wire-user", full_name: "Wire User", email: "wire@example.test" }],
      info: { page: 1, per_page: 200, count: 1, more_records: false },
    });
  });
  it("passes view columns union requested fields to the port", async () => {
    const response = json(await operations.bulk.run(deps, input({ fields: "Annual_Revenue" })));
    const row = response.body.data[0];
    expect(row).toHaveProperty("Company");
    expect(row).toHaveProperty("Annual_Revenue");
    expect(row).not.toHaveProperty("Description");
    expect(Object.keys(row).sort()).toEqual(
      [
        "id",
        "Full_Name",
        "Company",
        "Email",
        "Phone",
        "Lead_Source",
        "Owner",
        "Annual_Revenue",
      ].sort(),
    );
    const noFields = json(await operations.bulk.run(deps, input())).body.data[0];
    expect(noFields).toHaveProperty("Company");
    expect(noFields).not.toHaveProperty("Annual_Revenue");
  });
  it("uses requested sort, view sort and default info in order", async () => {
    const body = {
      filters: { field: { api_name: "Company" }, comparator: "equal", value: "Sorting Test" },
    };
    await deps.records.create("Leads", { Company: "Sorting Test", Last_Name: "B" });
    await deps.records.create("Leads", { Company: "Sorting Test", Last_Name: "A" });
    const response = json(
      await operations.bulk.run(
        deps,
        input({ sort_by: "Last_Name", sort_order: "asc", fields: "Last_Name" }, body),
      ),
    );
    expect(response.body.data.map((row: { Last_Name: string }) => row.Last_Name)).toEqual([
      "A",
      "B",
    ]);
    expect(response.body.info).toMatchObject({ sort_by: "Last_Name", sort_order: "asc" });
    const getView = deps.records.getView.bind(deps.records);
    deps.records.getView = async (module, id) => ({
      ...(await getView(module, id)),
      sort: { field: "Company", order: "desc" },
    });
    expect(json(await operations.bulk.run(deps, input())).body.info).toMatchObject({
      sort_by: "Company",
      sort_order: "desc",
    });
  });
  it("combines nested filters and search for list and count", async () => {
    await deps.records.create("Leads", { Company: "Filter Test", Last_Name: "Target" });
    await deps.records.create("Leads", { Company: "Filter Test", Last_Name: "Other" });
    const body = {
      filters: {
        group_operator: "and",
        group: [{ field: { api_name: "Company" }, comparator: "equal", value: "Filter Test" }],
      },
      search: "target",
    };
    expect(json(await operations.bulk.run(deps, input({}, body))).body.data).toHaveLength(1);
    expect(await operations.count.run(deps, input({}, body))).toEqual({
      status: 200,
      body: { count: 1 },
    });
  });
  it("returns 204 with no body for empty collections", async () => {
    expect(
      await operations.bulk.run(deps, input({}, { search: "No_Record_Can_Match_This" })),
    ).toEqual({ status: 204, body: null });
    expect(await operations.views.run(deps, input({ page: "1000" }))).toEqual({
      status: 204,
      body: null,
    });
    expect(await operations.users.run({ ...deps, members: [] }, input())).toEqual({
      status: 204,
      body: null,
    });
    expect(
      await operations.count.run(deps, input({}, { search: "No_Record_Can_Match_This" })),
    ).toEqual({ status: 200, body: { count: 0 } });
  });
  it("returns keyed 400 errors for invalid parameters and bodies", async () => {
    for (const [key, query] of [
      ["page", { page: "0" }],
      ["page", { page: "1.5" }],
      ["page", { page: "9007199254740992" }],
      ["perPage", { per_page: "11" }],
      ["perPage", { per_page: "0" }],
      ["fields", { fields: "Unknown_Field" }],
      ["fields", { fields: "" }],
      ["sort", { sort_order: "asc" }],
      ["sort", { sort_by: "Unknown_Field", sort_order: "asc" }],
    ] as const) {
      const error = await operations.bulk.run(deps, input(query)).catch((error: unknown) => error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(encodeError(error)).toMatchObject({
        status: 400,
        body: { details: { fields: { [key]: expect.any(Array) } } },
      });
    }
    for (const op of [operations.views, operations.users]) {
      await expect(op.run(deps, input({ page: "0" }))).rejects.toMatchObject({
        fieldErrors: { page: expect.any(Array) },
      });
      await expect(op.run(deps, input({ per_page: "-1" }))).rejects.toMatchObject({
        fieldErrors: { perPage: expect.any(Array) },
      });
    }
    for (const body of [
      { filters: {} },
      { search: 12 },
      { filters: { group: [], group_operator: "xor" } },
    ])
      await expect(operations.count.run(deps, input({}, body))).rejects.toBeInstanceOf(
        ValidationError,
      );
    await expect(
      operations.count.run(deps, { ...input(), request: { text: async () => "{" } }),
    ).rejects.toMatchObject({ fieldErrors: { data: expect.any(Array) } });
    for (const body of [
      undefined,
      {},
      { data: [] },
      { data: [{}, {}] },
      { data: [{ Owner: "bad-shape" }] },
    ])
      await expect(operations.create.run(deps, input({}, body))).rejects.toBeInstanceOf(
        ValidationError,
      );
    await expect(operations.delete.run(deps, input({ ids: "" }))).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
  it("returns 404 for unknown modules, views and records", async () => {
    for (const op of Object.values(operations).filter((op) => op !== operations.users)) {
      await expect(
        op.run(deps, {
          ...input({ ids: "missing" }, { data: [{ Company: "Example", Last_Name: "Example" }] }),
          params: { module: "Never_A_Module", viewId: "missing", recordId: "missing" },
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    }
    await expect(
      operations.view.run(deps, { ...input(), params: { viewId: "missing" } }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(operations.bulk.run(deps, input({ cvid: "missing" }))).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(operations.record.run(deps, input())).rejects.toBeInstanceOf(NotFoundError);
  });
  it("creates, reads, updates and deletes using the interim write envelope", async () => {
    const created = json(
      await operations.create.run(
        deps,
        input({}, { data: [{ Company: "CRUD Example", Last_Name: "Original" }] }),
      ),
    );
    expect(created).toEqual({ status: 200, body: { data: [{ id: expect.any(String) }] } });
    const id = created.body.data[0].id;
    const request = { ...input(), params: { module: "Leads", recordId: id } };
    expect(json(await operations.record.run(deps, request)).body.data[0]).toMatchObject({
      id,
      Last_Name: "Original",
    });
    expect(
      await operations.update.run(deps, { ...request, body: { data: [{ Last_Name: "Updated" }] } }),
    ).toEqual({ status: 200, body: { data: [{ id }] } });
    expect(json(await operations.record.run(deps, request)).body.data[0]).toMatchObject({
      id,
      Last_Name: "Updated",
    });
    expect(await operations.delete.run(deps, input({ ids: id }))).toEqual({
      status: 200,
      body: { data: [{ id }] },
    });
    await expect(operations.record.run(deps, request)).rejects.toBeInstanceOf(NotFoundError);
  });
  it("builds escaped browser paths from the inventory", () => {
    expect(operationPath(operations.record, { module: "Leads", recordId: "id/with space" })).toBe(
      "/crm/v2.2/Leads/id%2Fwith%20space",
    );
    expect(() => operationPath(operations.view)).toThrow(ValidationError);
  });
});
