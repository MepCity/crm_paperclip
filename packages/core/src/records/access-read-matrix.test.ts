import { describe, expect, it } from "vitest";
import type { AccessData, AccessSnapshot } from "../access";
import { buildAccessSnapshot, standardPermissions } from "../access";
import { ForbiddenError, NotFoundError } from "../errors";
import { createFixtureRecordService } from "./fixture";

/**
 * ADR 0017 §11.3: one identical visible id set on every read path, for a Standard user (own
 * records only) and a Manager (own records plus a subordinate's) under a private default.
 */
let ORG = "org-read-matrix";
let orgCounter = 0;
const ctxFor = (userId: string) => ({
  orgId: ORG,
  orgSlug: "read-matrix",
  orgName: "Read matrix",
  userId,
  role: "member" as const,
});

function snapshotFor(userId: string, roleId: string, hidden: string[] = []): AccessSnapshot {
  const data: AccessData = {
    orgId: ORG,
    userId,
    version: 1,
    profile: { id: "p", kind: "standard", permissions: standardPermissions() },
    fieldRows: hidden.map((field) => ({ module: "Leads", field, access: "hidden" as const })),
    roles: [
      { id: "ceo", name: "CEO", parentRoleId: null, shareWithPeers: false },
      { id: "mgr", name: "Manager", parentRoleId: "ceo", shareWithPeers: false },
      { id: "rep", name: "Rep", parentRoleId: "mgr", shareWithPeers: false },
      { id: "other", name: "Other", parentRoleId: "ceo", shareWithPeers: false },
    ],
    members: [
      { userId, roleId, profileId: "p" },
      { userId: "rep", roleId: "rep", profileId: "p" },
    ],
    groupMembers: [],
    defaults: [],
    rules: [],
  };
  return buildAccessSnapshot(data);
}

const viewerFor = (snapshot: AccessSnapshot) =>
  createFixtureRecordService(ctxFor(snapshot.userId), { access: async () => snapshot });
const query = { viewId: "all-leads", page: 1, perPage: 100 } as const;

async function seed() {
  ORG = `org-read-matrix-${++orgCounter}`;
  const rep = viewerFor(snapshotFor("rep", "rep"));
  const standard = viewerFor(snapshotFor("standard", "other"));
  const manager = viewerFor(snapshotFor("manager", "mgr"));
  const make = async (service: typeof rep, label: string) => {
    const ids: string[] = [];
    for (let i = 0; i < 2; i++)
      ids.push(
        (await service.create("Leads", { Last_Name: `Matrix ${label}`, Company: "MatrixCo" })).id,
      );
    return ids;
  };
  return {
    rep,
    standard,
    manager,
    repIds: await make(rep, "rep"),
    standardIds: await make(standard, "std"),
    managerIds: await make(manager, "mgr"),
  };
}

describe("read-path matrix (ADR 0017 §11.3)", () => {
  it.each([
    ["Standard", "standard", "other"],
    ["Manager", "manager", "mgr"],
  ] as const)("%s sees the same id set on every read path", async (_label, user, roleId) => {
    const s = await seed();
    const service = viewerFor(snapshotFor(user, roleId));
    const expected = (user === "standard" ? s.standardIds : [...s.managerIds, ...s.repIds]).sort();

    const byFilter = {
      field: "Company",
      comparator: "equal",
      value: "MatrixCo",
    } as const;
    const ids = (rows: readonly { id: string }[]) => rows.map((r) => r.id).sort();

    // list, related-list style filter (kanban cards and exports read through list)
    expect(ids((await service.list("Leads", { ...query, filters: byFilter })).records)).toEqual(
      expected,
    );
    // count
    expect(await service.count("Leads", { viewId: "all-leads", filters: byFilter })).toBe(
      expected.length,
    );
    // summarize (kanban column counts and report aggregates)
    const groups = await service.summarize("Leads", {
      viewId: "all-leads",
      filters: byFilter,
      groupBy: "Lead_Source",
    });
    expect(groups.reduce((sum, g) => sum + g.count, 0)).toBe(expected.length);
    // search
    const found = await service.search({ text: "Matrix", modules: ["Leads"] });
    expect(ids(found.flatMap((g) => g.records))).toEqual(expected);
    // duplicate scan: every "Matrix ..." group only contains visible records
    const dup = await service.findDuplicateGroups("Leads", ["Company"]);
    const dupIds = ids(dup.flatMap((g) => g.records)).filter((id) =>
      [...s.repIds, ...s.standardIds, ...s.managerIds].includes(id),
    );
    expect(dupIds).toEqual(expected);
    // timeline: visible records have a history page, invisible ones are 404
    for (const id of [...s.repIds, ...s.standardIds, ...s.managerIds]) {
      const page = service.history.list("Leads", id, { perPage: 10 });
      if (expected.includes(id)) await expect(page).resolves.toBeDefined();
      else await expect(page).rejects.toBeInstanceOf(NotFoundError);
    }
  });

  it("rejects a hidden field in filter, sort, group-by and duplicate fields on every path", async () => {
    const s = await seed();
    const service = viewerFor(snapshotFor("standard", "other", ["Lead_Source"]));
    const hidden = { field: "Lead_Source", comparator: "equal", value: "Web" } as const;
    const forbidden = (p: Promise<unknown>) => expect(p).rejects.toBeInstanceOf(ForbiddenError);
    await forbidden(service.list("Leads", { ...query, filters: hidden }));
    await forbidden(
      service.list("Leads", { ...query, sort: { field: "Lead_Source", order: "asc" } }),
    );
    await forbidden(service.count("Leads", { viewId: "all-leads", filters: hidden }));
    await forbidden(service.summarize("Leads", { viewId: "all-leads", groupBy: "Lead_Source" }));
    await forbidden(
      service.summarize("Leads", { viewId: "all-leads", filters: hidden, groupBy: "Company" }),
    );
    await forbidden(service.findDuplicateGroups("Leads", ["Lead_Source"]));
    expect(s.standardIds.length).toBeGreaterThan(0);
  });
});
