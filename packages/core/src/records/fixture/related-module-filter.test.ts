import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { ValidationError } from "../../errors";
import type { RecordService, RelatedModuleFilter } from "../contract";
import { casesRecordServiceContractModule } from "../contract-suite-module";
import { createFixtureRecordService } from "./index";

describe("related-module list filter (Cases)", () => {
  let service: RecordService;
  let viewId: string;
  let withCall: string;
  let bare: string;
  const subjectFilter = {
    field: "Subject",
    comparator: "starts_with" as const,
    value: "RMF ",
  };
  const ids = async (relatedModules: readonly RelatedModuleFilter[], filters = subjectFilter) =>
    (
      await service.list("Cases", { viewId, page: 1, perPage: 100, filters, relatedModules })
    ).records
      .map((r) => r.id)
      .sort();
  beforeEach(async () => {
    service = createFixtureRecordService({
      orgId: randomUUID(),
      orgSlug: "related-filter",
      orgName: "Synthetic",
      userId: "user",
      role: "admin",
    });
    viewId = (await service.listViews("Cases")).find((v) => v.isDefault)?.id ?? "";
    const base = casesRecordServiceContractModule.buildMinimalValidInput();
    withCall = (await service.create("Cases", { ...base, Subject: "RMF with" })).id;
    bare = (await service.create("Cases", { ...base, Subject: "RMF bare" })).id;
    await service.create("Calls", {
      Call_Type: "Outbound",
      Call_Start_Time: "2026-01-15T10:00:00.000Z",
      Call_Duration: "05:00",
      Subject: "Ping",
      What_Id: { module: "Cases", id: withCall },
    });
    await service.create("Notes", {
      Parent_Id: { module: "Cases", id: bare },
      Note_Content: "hello",
    });
  });
  it("with / without presence", async () => {
    expect(await ids([{ module: "Calls", presence: "with", criteria: [] }])).toEqual([withCall]);
    expect(await ids([{ module: "Calls", presence: "without", criteria: [] }])).toEqual([bare]);
    expect(await ids([{ module: "Notes", presence: "with", criteria: [] }])).toEqual([bare]);
    expect(await ids([{ module: "Tasks", presence: "with", criteria: [] }])).toEqual([]);
  });
  it("applies child criteria and combines rows with AND", async () => {
    const hit = { field: "Subject", comparator: "equal" as const, value: "Ping" };
    const miss = { field: "Subject", comparator: "equal" as const, value: "Nope" };
    expect(await ids([{ module: "Calls", presence: "with", criteria: [hit] }])).toEqual([withCall]);
    expect(await ids([{ module: "Calls", presence: "with", criteria: [miss] }])).toEqual([]);
    expect(await ids([{ module: "Calls", presence: "without", criteria: [miss] }])).toEqual(
      [bare, withCall].sort(),
    );
    expect(
      await ids([
        { module: "Calls", presence: "with", criteria: [] },
        { module: "Notes", presence: "without", criteria: [] },
      ]),
    ).toEqual([withCall]);
  });
  it("rejects over-limit and unsupported requests", async () => {
    const row = { module: "Calls" as const, presence: "with" as const, criteria: [] };
    await expect(ids([row, row, row, row])).rejects.toBeInstanceOf(ValidationError);
    const c = { field: "Subject", comparator: "equal" as const, value: "x" };
    await expect(ids([{ ...row, criteria: [c, c, c, c, c, c] }])).rejects.toBeInstanceOf(
      ValidationError,
    );
    const leadsView = (await service.listViews("Leads")).find((v) => v.isDefault)?.id ?? "";
    await expect(
      service.list("Leads", { viewId: leadsView, page: 1, perPage: 10, relatedModules: [row] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
