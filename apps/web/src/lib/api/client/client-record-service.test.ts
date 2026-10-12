import { randomUUID } from "node:crypto";
import type { RecordService } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { expect, it } from "vitest";
import { createClientRecordService } from "./client-record-service";

it("forwards every discovery method even when inherited by the wrapped service", async () => {
  const fixture = createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "client-test",
    orgName: "Test",
    userId: "test-user",
    role: "admin",
  });
  const inherited: RecordService = Object.create(fixture);
  const client = createClientRecordService(inherited, { listUsers: async () => [] });
  const master = await fixture.create("Contacts", { Last_Name: "Wrapper Marker" });
  const duplicate = await fixture.create("Contacts", { Last_Name: "Wrapper Marker" });
  expect((await client.search({ text: "wrapper marker" }))[0]?.total).toBe(2);
  expect(await client.findDuplicateGroups("Contacts", ["Last_Name"])).toHaveLength(1);
  expect(
    (
      await client.merge("Contacts", {
        masterId: master.id,
        duplicateIds: [duplicate.id],
        values: {},
      })
    ).id,
  ).toBe(master.id);
  expect(await client.deduplicate("Contacts", ["Last_Name"])).toMatchObject({
    mergedGroups: 0,
    removedRecords: 0,
  });
});
