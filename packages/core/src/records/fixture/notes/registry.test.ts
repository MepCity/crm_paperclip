import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createFixtureRecordService } from "../../fixture";
import { fixtureModules } from "../registry";
import { generateFixtureNotes } from "./seed";

const make = () =>
  createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "fixture-test",
    orgName: "Fixture Organization",
    userId: "fixture-test-user",
    role: "admin",
  });

describe("Notes registry entry", () => {
  it("registers Notes with a single default view", async () => {
    expect(fixtureModules.Notes).toBeDefined();
    const views = await make().listViews("Notes");
    expect(views.filter((view) => view.isDefault)).toHaveLength(1);
    expect(views[0]?.criteria).toBeNull();
  });

  it("filters by Parent_Id equal {module,id}", async () => {
    const service = make();
    const [first, second] = generateFixtureNotes();
    if (!first || !second) throw new Error("seed missing");
    const parent = first.fields.Parent_Id as { module: string; id: string };
    const result = await service.list("Notes", {
      viewId: "all-notes",
      page: 1,
      perPage: 50,
      filters: { field: "Parent_Id", comparator: "equal", value: parent },
    });
    const ids = result.records.map((record) => record.id);
    expect(ids).toContain(first.id);
    expect(ids).not.toContain(second.id);
    for (const record of result.records) {
      expect(record.fields.Parent_Id).toMatchObject({ module: parent.module, id: parent.id });
    }
  });
});
