import { describe, expect, it } from "vitest";
import type { AccessData, AccessSnapshot, DefaultAccess } from "../access";
import { administratorPermissions, buildAccessSnapshot, standardPermissions } from "../access";
import { ForbiddenError, NotFoundError } from "../errors";
import { createFixtureRecordService } from "./fixture";

const ORG = "org-access-policy";
const ctxFor = (userId: string) => ({
  orgId: ORG,
  orgSlug: "access-policy",
  orgName: "Access policy",
  userId,
  role: "member" as const,
});

function snapshotFor(
  userId: string,
  options: { defaults?: DefaultAccess; hidden?: string[]; admin?: boolean } = {},
): AccessSnapshot {
  const data: AccessData = {
    orgId: ORG,
    userId,
    version: 1,
    profile: {
      id: "p",
      kind: options.admin ? "administrator" : "standard",
      permissions: options.admin ? administratorPermissions() : standardPermissions(),
    },
    fieldRows: (options.hidden ?? []).map((field) => ({
      module: "Leads",
      field,
      access: "hidden" as const,
    })),
    roles: [{ id: "r", name: "CEO", parentRoleId: null, shareWithPeers: false }],
    members: [
      { userId, roleId: "r", profileId: "p" },
      { userId: "owner", roleId: "r", profileId: "p" },
    ],
    groupMembers: [],
    defaults: options.defaults ? [{ module: "Leads", level: options.defaults }] : [],
    rules: [],
  };
  return buildAccessSnapshot(data);
}

describe("RecordAccessPolicy on the fixture record service (ADR 0017 §11.3)", () => {
  // The first service seeds the organization's records, all owned by "owner".
  const owner = createFixtureRecordService(ctxFor("owner"));
  const viewer = (snapshot: AccessSnapshot) =>
    createFixtureRecordService(ctxFor(snapshot.userId), { access: async () => snapshot });
  const query = { viewId: "all-leads", page: 1, perPage: 10 } as const;

  it("shows a private module to a non-owner as empty on every read path", async () => {
    const service = viewer(snapshotFor("viewer"));
    expect((await service.list("Leads", query)).records).toHaveLength(0);
    expect(await service.count("Leads", { viewId: "all-leads" })).toBe(0);
    const [seeded] = (await owner.list("Leads", query)).records;
    await expect(service.get("Leads", seeded?.id ?? "")).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.delete("Leads", [seeded?.id ?? ""])).rejects.toBeInstanceOf(NotFoundError);
  });

  it("gives the same visible id set on list and count with public read, and blocks writes", async () => {
    const service = viewer(snapshotFor("viewer", { defaults: "public_read" }));
    const list = await service.list("Leads", query);
    expect(list.records.length).toBeGreaterThan(0);
    expect(await service.count("Leads", { viewId: "all-leads" })).toBe(
      await owner.count("Leads", { viewId: "all-leads" }),
    );
    const id = list.records[0]?.id ?? "";
    await expect(service.update("Leads", id, { Company: "X" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(service.delete("Leads", [id])).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("removes hidden fields from payloads and rejects them in filters and sort", async () => {
    const service = viewer(snapshotFor("viewer", { defaults: "public_read", hidden: ["Company"] }));
    const [row] = (await service.list("Leads", query)).records;
    expect(row?.fields).not.toHaveProperty("Company");
    expect((await service.get("Leads", row?.id ?? "")).fields).not.toHaveProperty("Company");
    await expect(
      service.list("Leads", {
        ...query,
        filters: { field: "Company", comparator: "is_not_empty", value: null },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      service.list("Leads", { ...query, sort: { field: "Company", order: "asc" } }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("leaves administrators unrestricted", async () => {
    const service = viewer(snapshotFor("someone", { admin: true }));
    expect(await service.count("Leads", { viewId: "all-leads" })).toBe(
      await owner.count("Leads", { viewId: "all-leads" }),
    );
  });

  describe("service matrix", () => {
    const mine = async (service: ReturnType<typeof viewer>, n: number) => {
      const ids: string[] = [];
      for (let i = 0; i < n; i++)
        ids.push(
          (await service.create("Leads", { Last_Name: `Matrix ${i}`, Company: "MatrixCo" })).id,
        );
      return ids;
    };

    it("gives one identical visible id set on list, count, summarize and search", async () => {
      const service = viewer(snapshotFor("viewer", { hidden: ["Description"] }));
      const before = (await service.list("Leads", { ...query, perPage: 100 })).records.length;
      const ids = [...(await mine(service, 3))].sort();
      expect(before).toBeGreaterThanOrEqual(0);
      const list = await service.list("Leads", { ...query, perPage: 50 });
      expect(list.records.map((r) => r.id).sort()).toEqual(ids);
      expect(await service.count("Leads", { viewId: "all-leads" })).toBe(ids.length);
      const groups = await service.summarize("Leads", { viewId: "all-leads", groupBy: "Lead_Source" });
      expect(groups.reduce((sum, g) => sum + g.count, 0)).toBe(ids.length);
      const found = await service.search({ text: "Matrix", modules: ["Leads"] });
      expect(found.flatMap((g) => g.records.map((r) => r.id)).sort()).toEqual(ids);
      expect(found.reduce((sum, g) => sum + g.total, 0)).toBe(ids.length);
    });

    it("does not leak a hidden field through aggregates", async () => {
      const service = viewer(snapshotFor("viewer", { hidden: ["Lead_Source"] }));
      await mine(service, 1);
      await expect(service.summarize("Leads", { viewId: "all-leads", groupBy: "Lead_Source" })).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it("refuses writes to hidden fields and flags partial access with $access", async () => {
      const service = viewer(snapshotFor("viewer", { hidden: ["Description"] }));
      await expect(
        service.create("Leads", { Last_Name: "X", Company: "Y", Description: "z" }),
      ).rejects.toBeInstanceOf(ForbiddenError);
      const readOnly = viewer(snapshotFor("viewer", { defaults: "public_read" }));
      const row = (await readOnly.list("Leads", { ...query, perPage: 100 })).records.find(
        (r) => r.fields.Owner === "owner",
      );
      expect(row?.$access).toBe("read");
      const own = viewer(snapshotFor("viewer"));
      const [id] = await mine(own, 1);
      expect((await own.get("Leads", id ?? "")).$access).toBeUndefined();
    });

    it("makes notes follow the parent record level", async () => {
      const seeded = (await owner.list("Leads", { ...query, perPage: 100 })).records.find(
        (r) => r.fields.Owner === "owner",
      );
      const note = await owner.create("Notes", {
        Parent_Id: { module: "Leads", id: seeded?.id ?? "" },
        Note_Content: "private note",
      });
      const stranger = viewer(snapshotFor("viewer"));
      await expect(stranger.get("Notes", note.id)).rejects.toBeInstanceOf(NotFoundError);
      const reader = viewer(snapshotFor("viewer", { defaults: "public_read" }));
      expect((await reader.get("Notes", note.id)).id).toBe(note.id);
      await expect(reader.update("Notes", note.id, { Note_Content: "x" })).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });
  });
});
