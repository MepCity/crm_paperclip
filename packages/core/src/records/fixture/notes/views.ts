import type { ListView } from "../../contract";

/** Single default saved view for the Notes module. */
export const notesViews: readonly ListView[] = [
  {
    id: "all-notes",
    name: "All Notes",
    systemDefined: true,
    isDefault: true,
    columns: ["Note_Title", "Note_Content", "Parent_Id", "Owner", "Created_Time"],
    criteria: null,
    sort: null,
  },
];
