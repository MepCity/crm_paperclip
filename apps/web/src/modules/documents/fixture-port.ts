import type { DocumentFolder, DocumentItem, DocumentSort, DocumentsPort } from "./port";

const FOLDERS: readonly DocumentFolder[] = [
  { id: "my", name: "My Folders", title: "Workspace Files", section: "my", locked: false },
  { id: "team-sales", name: "Sales Team", section: "team", locked: true },
];

const ITEMS: readonly DocumentItem[] = [
  item("f0", "Workspace Files", "folder", "my", "2026-10-06T09:30:00Z"),
  item("f1", "Proposals", "folder", "f0", "2026-09-30T10:00:00Z"),
  item("f2", "Contracts", "folder", "f0", "2026-10-05T09:30:00Z"),
  item("d1", "Price list.pdf", "file", "f0", "2026-10-02T12:00:00Z"),
  item("f3", "Archive", "folder", "f1", "2026-09-12T08:00:00Z"),
  item("d2", "Draft proposal.docx", "file", "f1", "2026-09-28T15:20:00Z"),
  item("d3", "Signed agreement.pdf", "file", "f2", "2026-10-04T11:10:00Z"),
  item("f4", "Playbooks", "folder", "team-sales", "2026-10-01T07:45:00Z"),
  item("d4", "Quarterly targets.xlsx", "file", "team-sales", "2026-10-06T14:00:00Z"),
  item("d5", "Call script.docx", "file", "f4", "2026-09-20T13:00:00Z"),
];

function item(
  id: string,
  name: string,
  kind: DocumentItem["kind"],
  parentId: string,
  modifiedAt: string,
): DocumentItem {
  return { id, name, kind, parentId, modifiedAt, uploadedBy: "Alex Morgan", modifiedBy: "Sam Lee" };
}

export const fixtureDocumentsPort: DocumentsPort = {
  async listFolders() {
    return FOLDERS;
  },
  async listItems(folderId: string, sort: DocumentSort) {
    const rows = ITEMS.filter((row) => row.parentId === folderId);
    const dir = sort.direction === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => dir * a.modifiedAt.localeCompare(b.modifiedAt));
  },
  async getItem(id: string) {
    return ITEMS.find((row) => row.id === id);
  },
};
