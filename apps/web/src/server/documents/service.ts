import type { OrgContext } from "@crm/core";
import type { DocumentsSnapshot } from "@crm/core/documents";
import { createDocumentsService, createFixtureDocumentsRepository } from "@crm/core/documents";
import { canReadDocuments } from "./access";

/** Synthetic scenario data until the persistent adapter exists (ADR 0008, awaiting ADR 0002). */
function fixtureSnapshot(ctx: OrgContext): DocumentsSnapshot {
  const organizationId = ctx.orgId;
  return {
    spaces: [
      { organizationId, id: "space-my", kind: "my", ownerUserId: ctx.userId },
      { organizationId, id: "space-team", kind: "team", associated: true },
      { organizationId: "org-foreign", id: "space-foreign", kind: "team", associated: true },
    ],
    nodes: [
      node(organizationId, "folder-my", "space-my", null, "folder", "My Folders", undefined, {
        title: "Workspace Files",
      }),
      node(organizationId, "folder-app", "space-my", "folder-my", "folder", "Workspace Files"),
      {
        ...node(
          organizationId,
          "file-guide",
          "space-my",
          "folder-app",
          "file",
          "Getting started.pdf",
        ),
        managedAttachment: {
          module: "Leads",
          recordId: "100000000000000000",
          attachmentId: "file-guide",
          currentOwnerUserId: ctx.userId,
          source: "record" as const,
        },
      },
      node(organizationId, "folder-team", "space-team", null, "folder", "Team Folder", undefined, {
        locked: true,
      }),
      node(organizationId, "folder-empty", "space-team", "folder-team", "folder", "Empty"),
      node(
        organizationId,
        "file-a",
        "space-team",
        "folder-team",
        "file",
        "a.pdf",
        "2026-01-02T00:00:00Z",
      ),
      node(
        organizationId,
        "file-b",
        "space-team",
        "folder-team",
        "file",
        "b.pdf",
        "2026-01-03T00:00:00Z",
      ),
      node("org-foreign", "folder-foreign", "space-foreign", null, "folder", "Foreign Folder"),
      node("org-foreign", "file-foreign", "space-foreign", "folder-foreign", "file", "x.pdf"),
    ],
    memberships: [
      { organizationId, spaceId: "space-team", userId: ctx.userId, role: "viewer", canRead: true },
      {
        organizationId: "org-foreign",
        spaceId: "space-foreign",
        userId: ctx.userId,
        role: "viewer",
        canRead: true,
      },
    ],
    grants: [],
  };
}

function node(
  organizationId: string,
  id: string,
  spaceId: string,
  parentId: string | null,
  kind: "folder" | "file",
  name: string,
  modifiedAt = "2026-01-01T00:00:00Z",
  extra: { title?: string; locked?: boolean } = {},
) {
  return {
    organizationId,
    id,
    spaceId,
    parentId,
    kind,
    name,
    locked: extra.locked ?? false,
    ...(extra.title === undefined ? {} : { title: extra.title }),
    state: "active" as const,
    ready: true,
    restricted: false,
    uploadedBy: "Fixture User",
    modifiedBy: "Fixture User",
    modifiedAt,
  };
}

export function getDocumentsService(ctx: OrgContext) {
  return createDocumentsService(ctx, {
    repository: createFixtureDocumentsRepository(() => fixtureSnapshot(ctx)),
    canReadDocuments,
    nameSort: true,
  });
}
