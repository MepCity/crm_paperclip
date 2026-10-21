import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import { createFixtureDocumentsRepository } from "./fixture";
import { createDocumentsService } from "./service";
import type { DocumentNode, DocumentsSnapshot } from "./types";

const ctx: OrgContext = {
  orgId: "org-a",
  orgSlug: "fixture",
  orgName: "Fixture",
  userId: "owner",
  role: "admin",
};
const sort = { field: "modifiedAt", direction: "desc" } as const;
function node(
  id: string,
  spaceId: string,
  parentId: string | null,
  extra: Partial<DocumentNode> = {},
): DocumentNode {
  return {
    organizationId: "org-a",
    id,
    spaceId,
    parentId,
    kind: "folder",
    name: id,
    locked: false,
    restricted: false,
    ready: true,
    state: "active",
    uploadedBy: "Fixture Actor",
    modifiedBy: "Fixture Actor",
    modifiedAt: "2026-01-01T00:00:00Z",
    ...extra,
  };
}
function setup(nameSort = false) {
  const data: DocumentsSnapshot = {
    spaces: [
      { organizationId: "org-a", id: "my-space", kind: "my", ownerUserId: "owner" },
      { organizationId: "org-a", id: "other-space", kind: "my", ownerUserId: "other" },
      { organizationId: "org-a", id: "team-space", kind: "team", associated: true },
      { organizationId: "org-b", id: "foreign-space", kind: "team", associated: true },
    ],
    nodes: [
      node("my", "my-space", null),
      node("other", "other-space", null),
      node("team", "team-space", null, { locked: true }),
      node("foreign", "foreign-space", null, { organizationId: "org-b" }),
      node("empty", "my-space", "my"),
      node("b", "my-space", "my", { name: "Beta", modifiedAt: "2026-02-01T00:00:00Z" }),
      node("a", "my-space", "my", { name: "Alpha" }),
      node("c", "my-space", "my", { name: "Alpha" }),
      node("attachment", "my-space", "my", {
        kind: "file",
        managedAttachment: {
          module: "Leads",
          recordId: "record",
          attachmentId: "attachment",
          currentOwnerUserId: "owner",
          source: "record",
        },
      }),
      node("restricted", "team-space", "team", { restricted: true }),
      node("child", "team-space", "restricted"),
    ],
    memberships: [],
    grants: [],
  };
  const repository = createFixtureDocumentsRepository(() => data);
  const service = createDocumentsService(ctx, {
    repository,
    canReadDocuments: () => true,
    nameSort,
    now: () => Date.parse("2026-01-01T00:00:00Z"),
  });
  return { data, repository, service };
}
async function notFound(promise: Promise<unknown>) {
  await expect(promise).rejects.toMatchObject({ code: "not_found", message: "Not found." });
}

describe("Documents read boundary", () => {
  it("projects only the current owner's My roots, including for organization admins", async () => {
    const { service, repository } = setup();
    expect(await service.listFolders()).toEqual([
      { id: "my", name: "my", section: "my", locked: false },
    ]);
    const other = createDocumentsService(
      { ...ctx, userId: "other" },
      { repository, canReadDocuments: () => true },
    );
    expect((await other.listFolders()).map((r) => r.id)).toEqual(["other"]);
    await notFound(service.listItems("other", sort));
    await notFound(other.getItem("attachment"));
  });

  it("reevaluates current ownership and excludes non-record attachment sources", async () => {
    const { data, service } = setup();
    const attachment = data.nodes.find((n) => n.id === "attachment")!;
    expect(await service.getItem("attachment")).toMatchObject({ id: "attachment" });
    attachment.managedAttachment!.currentOwnerUserId = "other";
    await notFound(service.getItem("attachment"));
    attachment.managedAttachment!.currentOwnerUserId = "owner";
    for (const source of ["note", "email", "template", "upload_field"] as const) {
      attachment.managedAttachment!.source = source;
      await notFound(service.getItem("attachment"));
      expect((await service.listItems("my", sort)).some((n) => n.id === "attachment")).toBe(false);
    }
  });

  it("uses explicit team read capability, not folder role or the lock marker", async () => {
    const { data, service } = setup();
    data.memberships = [
      {
        organizationId: "org-a",
        spaceId: "team-space",
        userId: "owner",
        role: "admin",
        canRead: false,
      },
    ];
    await notFound(service.listItems("team", sort));
    data.memberships[0]!.canRead = true;
    expect((await service.listFolders()).find((r) => r.id === "team")).toMatchObject({
      locked: true,
    });
    expect(await service.listItems("team", sort)).toEqual([]);
    await notFound(service.getItem("restricted"));
    data.grants = [
      {
        organizationId: "org-a",
        id: "grant",
        userId: "owner",
        folderId: "restricted",
        access: "view",
        canRead: true,
        expiresAt: null,
      },
    ];
    expect((await service.listItems("team", sort)).map((r) => r.id)).toEqual(["restricted"]);
    expect(await service.getItem("child")).toMatchObject({ id: "child" });
    data.grants[0]!.expiresAt = "2025-12-31T23:59:59Z";
    await notFound(service.getItem("child"));
    data.grants[0]!.expiresAt = null;
    data.memberships = [];
    // A descendant grant cannot expose an ancestor's name or contents.
    await notFound(service.getItem("restricted"));
  });

  it("supports direct root and file grants without assuming a membership role", async () => {
    const { data, service } = setup();
    data.nodes = [...data.nodes, node("file", "team-space", "team", { kind: "file" })];
    data.grants = [
      {
        organizationId: "org-a",
        id: "root-grant",
        userId: "owner",
        folderId: "team",
        access: "view",
        canRead: true,
        expiresAt: null,
      },
      {
        organizationId: "org-a",
        id: "file-grant",
        userId: "owner",
        fileId: "file",
        access: "edit",
        canRead: true,
        expiresAt: null,
      },
    ];
    expect((await service.listItems("team", sort)).map((r) => r.id)).toEqual(["file"]);
    data.grants[1]!.canRead = false;
    await notFound(service.getItem("file"));
    data.grants = [];
    await notFound(service.listItems("team", sort));
  });

  it("makes foreign, inaccessible and missing IDs indistinguishable from each other, not empty", async () => {
    const { service } = setup();
    for (const id of ["foreign", "other", "missing", "team"]) {
      await notFound(service.listItems(id, sort));
      await notFound(service.getItem(id));
    }
    expect(await service.listItems("empty", sort)).toEqual([]);
    await expect(service.getItem("missing")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("hides trashed ancestors, pending files, disassociated spaces, cycles and invalid parents", async () => {
    const { data, service } = setup();
    data.nodes = [
      ...data.nodes,
      node("trash", "my-space", "my", { state: "trashed" }),
      node("hidden", "my-space", "trash"),
      node("pending", "my-space", "my", { ready: false }),
      node("cycle-a", "my-space", "cycle-b"),
      node("cycle-b", "my-space", "cycle-a"),
      node("cross-space", "my-space", "other"),
      node("orphan", "my-space", "missing"),
    ];
    for (const id of ["hidden", "pending", "cycle-a", "cross-space", "orphan"])
      await notFound(service.getItem(id));
    const team = data.spaces.find((s) => s.kind === "team" && s.organizationId === "org-a")!;
    if (team.kind === "team") team.associated = false;
    data.memberships = [
      {
        organizationId: "org-a",
        spaceId: "team-space",
        userId: "owner",
        role: "viewer",
        canRead: true,
      },
    ];
    await notFound(service.listItems("team", sort));
  });

  it("sorts authorized children in both directions with stable ascending ID ties", async () => {
    const { service } = setup(true);
    expect(
      (await service.listItems("my", { field: "modifiedAt", direction: "asc" })).map((n) => n.id),
    ).toEqual(["a", "attachment", "c", "empty", "b"]);
    expect((await service.listItems("my", sort)).map((n) => n.id)).toEqual([
      "b",
      "a",
      "attachment",
      "c",
      "empty",
    ]);
    expect((await service.listItemsByName!("my", { direction: "asc" })).map((n) => n.id)).toEqual([
      "a",
      "c",
      "b",
      "attachment",
      "empty",
    ]);
    expect((await service.listItemsByName!("my", { direction: "desc" })).map((n) => n.id)).toEqual([
      "empty",
      "attachment",
      "b",
      "a",
      "c",
    ]);
    expect(setup().service.listItemsByName).toBeUndefined();
  });

  it("reevaluates profile visibility on every request and propagates repository failures", async () => {
    const { repository } = setup();
    let allowed = true;
    const service = createDocumentsService(ctx, { repository, canReadDocuments: () => allowed });
    await service.listFolders();
    allowed = false;
    await notFound(service.listFolders());
    await notFound(service.listItems("my", sort));
    await notFound(service.getItem("attachment"));
    const broken = createDocumentsService(ctx, {
      repository: {
        read: async () => {
          throw new Error("unavailable");
        },
      },
      canReadDocuments: () => true,
    });
    await expect(broken.listFolders()).rejects.toThrow("unavailable");
  });

  it("does not expose storage, policy or projection data and returns detached DTOs", async () => {
    const { service } = setup();
    const item = await service.getItem("attachment");
    expect(Object.keys(item!).sort()).toEqual([
      "id",
      "kind",
      "modifiedAt",
      "modifiedBy",
      "name",
      "parentId",
      "uploadedBy",
    ]);
    item!.name = "changed";
    expect((await service.getItem("attachment"))!.name).toBe("attachment");
    expect(Object.keys(service).sort()).toEqual(["getItem", "listFolders", "listItems"]);
  });

  it("validates IDs and sort values instead of broadening queries", async () => {
    const { service } = setup();
    await expect(service.getItem("../my")).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.listItems("my", { field: "name", direction: "desc" } as unknown as typeof sort),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.listItems("my", {
        field: "modifiedAt",
        direction: "invalid",
      } as unknown as typeof sort),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
