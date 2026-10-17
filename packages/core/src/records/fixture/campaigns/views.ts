import type { ListView } from "../../contract";
export const campaignsViews: readonly ListView[] = [
  {
    id: "all-active-campaigns",
    name: "All Active Campaigns",
    systemDefined: true,
    isDefault: false,
    columns: ["Campaign_Name", "Type", "Status", "Start_Date", "End_Date", "Owner"],
    criteria: {
      field: "Status",
      comparator: "equal",
      value: "Active",
    },
    sort: null,
  },
  {
    id: "all-campaigns",
    name: "All Campaigns",
    systemDefined: true,
    isDefault: true,
    columns: ["Campaign_Name", "Type", "Status", "Start_Date", "End_Date", "Owner"],
    criteria: null,
    sort: null,
  },
  {
    id: "my-active-campaigns",
    name: "My Active Campaigns",
    systemDefined: true,
    isDefault: false,
    columns: ["Campaign_Name", "Type", "Status", "Start_Date", "End_Date"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Owner",
          comparator: "equal",
          value: {
            token: "CURRENTUSER",
          },
        },
        {
          field: "Status",
          comparator: "equal",
          value: "Active",
        },
      ],
    },
    sort: null,
  },
  {
    id: "unread-campaigns",
    name: "Unread Campaigns",
    systemDefined: true,
    isDefault: false,
    columns: ["Campaign_Name", "Type", "Status", "Start_Date", "End_Date", "Owner"],
    criteria: {
      field: "Common_Status",
      comparator: "not_contains",
      value: "v",
    },
    sort: null,
  },
];
