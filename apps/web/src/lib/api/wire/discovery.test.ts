import { randomUUID } from "node:crypto";
import { ValidationError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { beforeEach, describe, expect, it } from "vitest";
import { encodeCriteria } from "./codec";
import { type OperationDeps, operations } from "./operations";

let deps: OperationDeps;
beforeEach(() => {
  deps = {
    records: createFixtureRecordService({
      orgId: randomUUID(),
      orgSlug: "discovery-wire",
      orgName: "Test",
      userId: "test-user",
      role: "admin",
    }),
    members: async () => [],
  };
});

describe("discovery request validation", () => {
  it("rejects malformed JSON and search DTOs at the transport boundary", async () => {
    await expect(
      operations.search.run(deps, { query: {}, request: { text: async () => "{" } }),
    ).rejects.toBeInstanceOf(ValidationError);
    for (const body of [
      null,
      [],
      {},
      { text: 3 },
      { text: "sample", scope: "unknown" },
      { text: "sample", modules: "Contacts" },
      { text: "sample", fields: [false] },
      { text: "sample", page: 0 },
      { text: "sample", perPage: "10" },
      { text: "sample", sort: { field: "Last_Name", order: "sideways" } },
      { text: "sample", filters: {} },
    ]) {
      await expect(operations.search.run(deps, { query: {}, body })).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
  });
  it("validates duplicate fields and merge bodies without changing records", async () => {
    const params = { module: "Contacts" };
    for (const op of [operations.duplicateGroups, operations.deduplicate]) {
      for (const body of [{}, { fields: "Email" }, { fields: [null] }, { fields: [] }])
        await expect(op.run(deps, { params, query: {}, body })).rejects.toBeInstanceOf(
          ValidationError,
        );
    }
    for (const body of [
      {},
      { masterId: "", duplicateIds: [] },
      { masterId: "master", duplicateIds: "duplicate" },
      { masterId: "master", duplicateIds: ["duplicate"], values: [] },
    ])
      await expect(operations.merge.run(deps, { params, query: {}, body })).rejects.toBeInstanceOf(
        ValidationError,
      );
  });
  it("uses encoded criteria and JSON bodies on the local search operation", async () => {
    const record = await deps.records.create("Contacts", {
      Last_Name: "Transport Marker",
      First_Name: "Chosen",
    });
    const body = {
      text: "transport marker",
      modules: ["Contacts"],
      filters: encodeCriteria({ field: "First_Name", comparator: "equal", value: "Chosen" }),
    };
    expect(
      await operations.search.run(deps, {
        query: {},
        request: { text: async () => JSON.stringify(body) },
      }),
    ).toMatchObject({
      status: 200,
      body: [{ module: "Contacts", total: 1, records: [{ id: record.id }] }],
    });
    expect(
      await operations.search.run(deps, { query: {}, body: { text: "no-match-marker" } }),
    ).toEqual({ status: 200, body: [] });
  });
});
