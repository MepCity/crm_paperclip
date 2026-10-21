/** Read DTOs mirror the browser DocumentsPort without importing the web app. */
export interface DocumentFolder {
  id: string;
  name: string;
  title?: string;
  section: "my" | "team";
  locked: boolean;
}
export interface DocumentItem {
  id: string;
  name: string;
  kind: "folder" | "file";
  uploadedBy: string;
  modifiedBy: string;
  modifiedAt: string;
  parentId: string;
}
export interface DocumentSort {
  field: "modifiedAt";
  direction: "asc" | "desc";
}
export interface DocumentsPort {
  listFolders(): Promise<readonly DocumentFolder[]>;
  listItems(folderId: string, sort: DocumentSort): Promise<readonly DocumentItem[]>;
  getItem(id: string): Promise<DocumentItem | undefined>;
}
export interface DocumentsService extends DocumentsPort {
  /** Optional capability; ordinal, case-sensitive comparison with ID ascending ties. */
  listItemsByName?: (
    folderId: string,
    sort: { direction: "asc" | "desc" },
  ) => Promise<readonly DocumentItem[]>;
}

export interface DocumentKey {
  organizationId: string;
  id: string;
}
export type DocumentSpace = DocumentKey &
  ({ kind: "my"; ownerUserId: string } | { kind: "team"; associated: boolean });
export interface DocumentNode extends DocumentKey {
  spaceId: string;
  parentId: string | null;
  kind: "folder" | "file";
  name: string;
  title?: string;
  locked: boolean;
  state: "active" | "trashed";
  /** Only ready content is published by reads. */
  ready: boolean;
  /** Explicit fixture policy: no inheritance through a restricted node. */
  restricted: boolean;
  uploadedBy: string;
  modifiedBy: string;
  modifiedAt: string;
  /** Personal files project ordinary record attachments, never other attachment sources. */
  managedAttachment?: {
    module: string;
    recordId: string;
    attachmentId: string;
    currentOwnerUserId: string;
    source: "record" | "note" | "email" | "template" | "upload_field";
  };
}
export interface DocumentMembership {
  organizationId: string;
  spaceId: string;
  userId: string;
  role: "admin" | "organizer" | "editor" | "commenter" | "viewer";
  /** Explicit read capability, not inferred from role until U2 is resolved. */
  canRead: boolean;
}
export type DocumentItemGrant = DocumentKey & {
  userId: string;
  access: "view" | "comment" | "edit" | "organize" | "share";
  canRead: boolean;
  expiresAt: string | null;
} & ({ folderId: string; fileId?: never } | { fileId: string; folderId?: never });
export interface DocumentsSnapshot {
  spaces: readonly DocumentSpace[];
  nodes: readonly DocumentNode[];
  memberships: readonly DocumentMembership[];
  grants: readonly DocumentItemGrant[];
}
/** No writes. Persistent adapters await ADR 0002 and must resolve current ownership. */
export interface DocumentsRepository {
  read(organizationId: string): Promise<DocumentsSnapshot>;
}
