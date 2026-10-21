/** Narrow read-only data port for the Documents screen; a real adapter replaces the fixture later. */
export interface DocumentFolder {
  id: string;
  name: string;
  /** Optional breadcrumb label for the root, when it differs from the panel name. */
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
  /** ISO timestamp. */
  modifiedAt: string;
  parentId: string;
}

export interface DocumentSort {
  field: "modifiedAt";
  direction: "asc" | "desc";
}

export interface DocumentsPort {
  listFolders(): Promise<readonly DocumentFolder[]>;
  /** Direct children of a root folder or sub-folder. */
  listItems(folderId: string, sort: DocumentSort): Promise<readonly DocumentItem[]>;
  getItem(id: string): Promise<DocumentItem | undefined>;
}
