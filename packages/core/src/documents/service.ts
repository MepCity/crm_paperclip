import { NotFoundError, ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type { DocumentItem, DocumentNode, DocumentsRepository, DocumentsService } from "./types";

interface Options {
  repository: DocumentsRepository;
  /** Session/profile Documents visibility; reevaluated on every read, never an org-admin shortcut. */
  canReadDocuments: (ctx: OrgContext) => boolean | Promise<boolean>;
  nameSort?: boolean;
  now?: () => number;
}

/** Dedicated read boundary. No record service, blob keys, writes or silent pagination. */
export function createDocumentsService(context: OrgContext, options: Options): DocumentsService {
  const ctx = { ...context };
  async function authorized() {
    if (!(await options.canReadDocuments({ ...ctx }))) throw new NotFoundError();
    const snapshot = await options.repository.read(ctx.orgId);
    const spaces = new Map(
      snapshot.spaces.filter((s) => s.organizationId === ctx.orgId).map((s) => [s.id, s]),
    );
    const nodes = new Map(
      snapshot.nodes.filter((n) => n.organizationId === ctx.orgId).map((n) => [n.id, n]),
    );
    const now = (options.now ?? Date.now)();
    function readable(node: DocumentNode, visiting = new Set<string>()): boolean {
      if (visiting.has(node.id) || node.state !== "active" || !node.ready) return false;
      const space = spaces.get(node.spaceId);
      if (!space) return false;
      if (space.kind === "my") {
        if (space.ownerUserId !== ctx.userId) return false;
        if (
          node.kind === "file" &&
          (node.managedAttachment?.source !== "record" ||
            node.managedAttachment.currentOwnerUserId !== ctx.userId)
        )
          return false;
      } else {
        if (!space.associated) return false;
        const direct = snapshot.grants.some(
          (g) =>
            g.organizationId === ctx.orgId &&
            g.userId === ctx.userId &&
            g.canRead &&
            (node.kind === "folder" ? g.folderId === node.id : g.fileId === node.id) &&
            (g.expiresAt === null || Date.parse(g.expiresAt) > now),
        );
        const membership = snapshot.memberships.some(
          (m) =>
            m.organizationId === ctx.orgId &&
            m.spaceId === space.id &&
            m.userId === ctx.userId &&
            m.canRead,
        );
        // Direct grants never reveal unreadable ancestors. Restricted children need their own grant.
        if (!direct && (node.restricted || !membership)) return false;
      }
      if (node.parentId === null) return node.kind === "folder";
      const parent = nodes.get(node.parentId);
      if (!parent || parent.kind !== "folder" || parent.spaceId !== node.spaceId) return false;
      visiting.add(node.id);
      return readable(parent, visiting);
    }
    return { spaces, nodes, readable };
  }
  async function list(folderId: string, field: "modifiedAt" | "name", direction: "asc" | "desc") {
    validateId(folderId);
    if (direction !== "asc" && direction !== "desc") {
      throw new ValidationError({ direction: ["Invalid sort direction."] });
    }
    const { nodes, readable } = await authorized();
    const folder = nodes.get(folderId);
    if (!folder || folder.kind !== "folder" || !readable(folder)) throw new NotFoundError();
    return [...nodes.values()]
      .filter((node) => node.parentId === folder.id && readable(node))
      .sort((a, b) => {
        const primary =
          field === "name"
            ? compare(a.name, b.name)
            : Date.parse(a.modifiedAt) - Date.parse(b.modifiedAt);
        return (direction === "asc" ? primary : -primary) || compare(a.id, b.id);
      })
      .map(item);
  }
  const service: DocumentsService = {
    async listFolders() {
      const { spaces, nodes, readable } = await authorized();
      return [...nodes.values()]
        .filter((node) => node.parentId === null && readable(node))
        .sort((a, b) => compare(a.id, b.id))
        .map((node) => ({
          id: node.id,
          name: node.name,
          section: spaces.get(node.spaceId)!.kind,
          locked: node.locked,
          ...(node.title === undefined ? {} : { title: node.title }),
        }));
    },
    async listItems(folderId, sort) {
      if (sort.field !== "modifiedAt") {
        throw new ValidationError({ field: ["Invalid sort field."] });
      }
      return list(folderId, "modifiedAt", sort.direction);
    },
    async getItem(id) {
      validateId(id);
      const { nodes, readable } = await authorized();
      const node = nodes.get(id);
      // The HTTP adapter maps this same not-found to undefined for the browser port only.
      if (!node || node.parentId === null || !readable(node)) throw new NotFoundError();
      return item(node);
    },
  };
  if (options.nameSort) {
    service.listItemsByName = (id, sort) => list(id, "name", sort.direction);
  }
  return service;
}
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
function validateId(id: string): void {
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    throw new ValidationError({ id: ["Invalid document ID."] });
  }
}
function item(node: DocumentNode): DocumentItem {
  return {
    id: node.id,
    name: node.name,
    kind: node.kind,
    uploadedBy: node.uploadedBy,
    modifiedBy: node.modifiedBy,
    modifiedAt: node.modifiedAt,
    parentId: node.parentId!,
  };
}
