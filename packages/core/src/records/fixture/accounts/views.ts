import type { Criteria, CriteriaValue, ListView } from "../../contract";

const listColumns = ["Account_Name", "Phone", "Website", "Owner"];
const myColumns = ["Account_Name", "Phone", "Website"];
function equal(field: string, value: CriteriaValue): Criteria {
  return { field, comparator: "equal", value };
}
function and(...group: Criteria[]): Criteria {
  return { groupOperator: "and", group };
}
function view(
  id: string,
  name: string,
  systemDefined: boolean,
  columns: readonly string[],
  criteria: Criteria | null,
): ListView {
  return {
    id,
    name,
    systemDefined,
    isDefault: id === "all-accounts",
    columns,
    criteria,
    sort: null,
  };
}

const currentUser = equal("Owner", { token: "CURRENTUSER" });
const ageWithin31 = (field: string): Criteria => ({
  field,
  comparator: "less_equal",
  value: { token: "AGEINDAYS", offset: 31 },
});
const thisWeek = equal("Created_Time", { token: "PERIOD", name: "THIS_WEEK" });
const lastWeek = equal("Created_Time", { token: "PERIOD", name: "PREVIOUS_WEEK" });

/** Eight system views in exported order. */
export const accountsViews: readonly ListView[] = [
  view("all-accounts", "All Accounts", true, listColumns, null),
  view("all-locked-accounts", "All Locked Accounts", true, listColumns, equal("Locked__s", true)),
  view("my-accounts", "My Accounts", true, myColumns, currentUser),
  view("new-last-week", "New Last Week", true, listColumns, lastWeek),
  view("new-this-week", "New This Week", true, listColumns, thisWeek),
  view(
    "recently-created-accounts",
    "Recently Created Accounts",
    true,
    listColumns,
    and(
      { field: "Common_Status", comparator: "contains", value: "c" },
      ageWithin31("Created_Time"),
    ),
  ),
  view(
    "recently-modified-accounts",
    "Recently Modified Accounts",
    true,
    listColumns,
    and(
      { field: "Common_Status", comparator: "contains", value: "m" },
      ageWithin31("Modified_Time"),
    ),
  ),
  view("unread-accounts", "Unread Accounts", true, listColumns, {
    field: "Common_Status",
    comparator: "not_contains",
    value: "v",
  }),
];
