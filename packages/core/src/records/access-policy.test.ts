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
});
