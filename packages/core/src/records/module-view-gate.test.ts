import { describe, expect, it } from "vitest";
import type { AccessData, AccessSnapshot, DefaultAccess } from "../access";
import { administratorPermissions, buildAccessSnapshot, standardPermissions } from "../access";
import { ForbiddenError, NotFoundError } from "../errors";
import { createRecordAccessChecker, moduleViewAllowed } from "./access-policy";
import { createFixtureRecordHistoryService, createFixtureRecordService } from "./fixture";

/**
 * MEP-1516: the profile module-view gate (ADR 0017 §4.1) holds inside the record service, so
 * paths without a URL-module route gate (reports, dashboards, ads summary, feeds, notes of a
 * parent module) cannot read a module the profile cannot view.
 */
const ORG = "org-module-view-gate";
const ctxFor = (userId: string) => ({
  orgId: ORG,
  orgSlug: "module-view-gate",
  orgName: "Module view gate",
  userId,
  role: "member" as const,
});

function snapshotFor(
  userId: string,
  options: { dealsView?: boolean; admin?: boolean; dealsDefault?: DefaultAccess } = {},
): AccessSnapshot {
  const permissions = options.admin ? administratorPermissions() : standardPermissions();
  if (!options.admin && options.dealsView === false)
    permissions.modules.Deals = { view: false, create: false, edit: false, delete: false };
  const data: AccessData = {
    orgId: ORG,
    userId,
    version: 1,
    profile: { id: "p", kind: options.admin ? "administrator" : "standard", permissions },
    fieldRows: [],
    roles: [{ id: "r", name: "CEO", parentRoleId: null, shareWithPeers: false }],
    members: [
      { userId, roleId: "r", profileId: "p" },
      { userId: "owner", roleId: "r", profileId: "p" },
    ],
    groupMembers: [],
    // Record level alone would grant everything: only the module gate can refuse.
    defaults: [{ module: "Deals", level: options.dealsDefault ?? "public_read_write_delete" }],
    rules: [],
  };
  return buildAccessSnapshot(data);
}

describe("module view gate inside the record service (MEP-1516)", () => {
  // The first service seeds the organization's records, all owned by "owner".
  const owner = createFixtureRecordService(ctxFor("owner"));
  const viewer = (snapshot: AccessSnapshot) =>
    createFixtureRecordService(ctxFor(snapshot.userId), { access: async () => snapshot });
  const dealQuery = { viewId: "all-deals", page: 1, perPage: 100 } as const;
  const historyQuery = { viewId: "all-deal-history", page: 1, perPage: 100 } as const;
  const firstDeal = async () => {
    const [deal] = (await owner.list("Deals", dealQuery)).records;
    if (!deal) throw new Error("seed has no deal");
    return deal;
  };

  it("refuses get and returns empty list, count, summarize and search (leads 23, 30)", async () => {
    const deal = await firstDeal();
    const blocked = viewer(snapshotFor("viewer", { dealsView: false }));
    await expect(blocked.get("Deals", deal.id)).rejects.toBeInstanceOf(ForbiddenError);
    expect((await blocked.list("Deals", dealQuery)).records).toHaveLength(0);
    expect(await blocked.count("Deals", { viewId: "all-deals" })).toBe(0);
    const groups = await blocked.summarize("Deals", { viewId: "all-deals", groupBy: "Stage" });
    expect(groups.reduce((sum, g) => sum + g.count, 0)).toBe(0);
    const name = String(deal.fields.Deal_Name ?? "").slice(0, 5);
    if (name.length >= 3) {
      const found = await blocked.search({ text: name, modules: ["Deals"] });
      expect(found).toHaveLength(0);
    }
  });

  it("refuses writes on records of a module the profile cannot view", async () => {
    const deal = await firstDeal();
    const blocked = viewer(snapshotFor("viewer", { dealsView: false }));
    await expect(blocked.update("Deals", deal.id, { Description: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(blocked.delete("Deals", [deal.id])).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses the record timeline of a module the profile cannot view (lead 24)", async () => {
    const deal = await firstDeal();
    const snapshot = snapshotFor("viewer", { dealsView: false });
    const history = createFixtureRecordHistoryService(ctxFor("viewer"), {
      access: async () => snapshot,
    });
    await expect(history.list("Deals", deal.id, { perPage: 10 })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("hides notes whose parent module the profile cannot view (lead 22)", async () => {
    const deal = await firstDeal();
    const note = await owner.create("Notes", {
      Parent_Id: { module: "Deals", id: deal.id },
      Note_Content: "deal note",
    });
    const blocked = viewer(snapshotFor("viewer", { dealsView: false }));
    await expect(blocked.get("Notes", note.id)).rejects.toBeInstanceOf(NotFoundError);
    const notes = await blocked.list("Notes", {
      viewId: "all-notes",
      page: 1,
      perPage: 100,
    });
    expect(notes.records.map((r) => r.id)).not.toContain(note.id);
    // The same note stays readable when the profile views the parent module.
    const allowed = viewer(snapshotFor("viewer"));
    expect((await allowed.get("Notes", note.id)).id).toBe(note.id);
  });

  it("never grants a non-catalogue module more than its parent module (scope 2)", async () => {
    const blocked = viewer(snapshotFor("viewer", { dealsView: false }));
    expect((await blocked.list("DealHistory", historyQuery)).records).toHaveLength(0);
    // With Deals view but a private Deals default, only the viewer's own deals' history shows.
    const privateViewer = viewer(snapshotFor("viewer", { dealsDefault: "private" }));
    expect((await privateViewer.list("DealHistory", historyQuery)).records).toHaveLength(0);
    const account = await privateViewer.create("Accounts", { Account_Name: "Gate account" });
    const mine = await privateViewer.create("Deals", {
      Deal_Name: "Gate deal",
      Stage: "Qualification",
      Closing_Date: "2030-01-01",
      Account_Name: { module: "Accounts", id: account.id },
    });
    const rows = (await privateViewer.list("DealHistory", historyQuery)).records;
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((r) => (r.fields.Potential_Name as { id?: string } | null)?.id === mine.id),
    ).toBe(true);
  });

  it("leaves an allowed profile and administrators unchanged", async () => {
    const deal = await firstDeal();
    const total = await owner.count("Deals", { viewId: "all-deals" });
    const allowed = viewer(snapshotFor("viewer"));
    expect((await allowed.get("Deals", deal.id)).id).toBe(deal.id);
    expect(await allowed.count("Deals", { viewId: "all-deals" })).toBe(total);
    const admin = viewer(snapshotFor("admin", { admin: true, dealsView: false }));
    expect((await admin.get("Deals", deal.id)).id).toBe(deal.id);
    expect(await admin.count("Deals", { viewId: "all-deals" })).toBe(total);
    expect((await admin.list("DealHistory", historyQuery)).records.length).toBe(
      (await owner.list("DealHistory", historyQuery)).records.length,
    );
  });
});

describe("moduleViewAllowed / checker.level (MEP-1516)", () => {
  it("maps child and non-catalogue modules to the gate the route uses, denying unknown ones", () => {
    const snapshot = snapshotFor("viewer", { dealsView: false });
    expect(moduleViewAllowed(snapshot, "Leads")).toBe(true);
    expect(moduleViewAllowed(snapshot, "Events")).toBe(true);
    expect(moduleViewAllowed(snapshot, "Notes")).toBe(true);
    expect(moduleViewAllowed(snapshot, "Deals")).toBe(false);
    expect(moduleViewAllowed(snapshot, "DealHistory")).toBe(false);
    expect(moduleViewAllowed(snapshot, "Contact_Roles")).toBe(false);
    expect(moduleViewAllowed(snapshot, "Unknown_Module")).toBe(false);
    const checker = createRecordAccessChecker(snapshot);
    expect(checker.level("Unknown_Module", {})).toBe("none");
    expect(checker.level("Deals", { Owner: "viewer" })).toBe("none");
    expect(createRecordAccessChecker(snapshotFor("viewer")).level("Unknown_Module", {})).toBe(
      "none",
    );
    const admin = snapshotFor("admin", { admin: true });
    expect(moduleViewAllowed(admin, "Unknown_Module")).toBe(true);
    expect(createRecordAccessChecker(admin).level("Unknown_Module", {})).toBe("read_write_delete");
  });
});
