import type { ListView } from "../../contract";
export const solutionsViews: readonly ListView[] = [
  {
    id: "all-locked-solutions",
    name: "All Locked Solutions",
    systemDefined: true,
    isDefault: false,
    columns: ["Solution_Title", "Status", "Owner"],
    criteria: {
      field: "Locked__s",
      comparator: "equal",
      value: true,
    },
    sort: null,
  },
  {
    id: "all-solutions",
    name: "All Solutions",
    systemDefined: true,
    isDefault: true,
    columns: ["Solution_Number", "Solution_Title", "Status", "Owner"],
    criteria: null,
    sort: null,
  },
  {
    id: "my-solutions",
    name: "My Solutions",
    systemDefined: true,
    isDefault: false,
    columns: ["Solution_Number", "Solution_Title", "Status"],
    criteria: {
      field: "Owner",
      comparator: "equal",
      value: {
        token: "CURRENTUSER",
      },
    },
    sort: null,
  },
  {
    id: "unread-solutions",
    name: "Unread Solutions",
    systemDefined: true,
    isDefault: false,
    columns: ["Solution_Number", "Solution_Title", "Status", "Owner"],
    criteria: {
      field: "Common_Status",
      comparator: "not_contains",
      value: "v",
    },
    sort: null,
  },
];
