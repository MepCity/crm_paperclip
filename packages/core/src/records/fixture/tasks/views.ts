import type { Comparator, Criteria, CriteriaToken, ListView } from "../../contract";
/** Sanitized saved-view definitions. Export date tokens remain source literals.
 * Domain views below adapt these tokens exactly; do not
 * substitute DUEINDAYS for NEXT7DAYS (the latter also includes overdue tasks).
 * BEST_TIME is preserved although it is absent from the exported field list.
 */
export const tasksViewSource = [
  {
    id: "all-locked-tasks",
    name: "All Locked Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id", "Owner"],
    criteria: {
      field: "Locked__s",
      comparator: "equal",
      value: true,
    },
    sort: null,
  },
  {
    id: "all-tasks",
    name: "All Tasks",
    systemDefined: true,
    isDefault: true,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id", "Owner"],
    criteria: null,
    sort: null,
  },
  {
    id: "closed-tasks",
    name: "Closed Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id", "Owner"],
    criteria: {
      field: "Status",
      comparator: "equal",
      value: "Completed",
    },
    sort: null,
  },
  {
    id: "my-closed-tasks",
    name: "My Closed Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Due_Date", "Subject", "Status", "Priority", "What_Id", "Who_Id", "BEST_TIME"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Status",
          comparator: "equal",
          value: "Completed",
        },
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
            name: "${CURRENTUSER}",
          },
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-next-7-days-overdue-tasks",
    name: "My Next 7 Days + Overdue Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Due_Date", "Subject", "Status", "Priority", "What_Id", "Who_Id", "BEST_TIME"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          groupOperator: "and",
          group: [
            {
              field: "Due_Date",
              comparator: "less_equal",
              // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
              value: "${NEXT7DAYS}",
            },
            {
              field: "Status",
              comparator: "not_equal",
              value: "Completed",
            },
          ],
        },
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
            name: "${CURRENTUSER}",
          },
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-open-tasks",
    name: "My Open Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
            name: "${CURRENTUSER}",
          },
        },
        {
          field: "Status",
          comparator: "not_equal",
          value: "Completed",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-overdue-tasks",
    name: "My Overdue Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Due_Date", "Subject", "Status", "Priority", "What_Id", "Who_Id", "BEST_TIME"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          groupOperator: "and",
          group: [
            {
              field: "Due_Date",
              comparator: "equal",
              // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
              value: "${YESTERDAYMINUS}",
            },
            {
              field: "Status",
              comparator: "not_equal",
              value: "Completed",
            },
          ],
        },
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
            name: "${CURRENTUSER}",
          },
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-tasks",
    name: "My Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Due_Date", "Subject", "Status", "Priority", "What_Id", "Who_Id", "BEST_TIME"],
    criteria: {
      field: "Owner",
      comparator: "equal",
      value: {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
        name: "${CURRENTUSER}",
      },
    },
    sort: null,
  },
  {
    id: "my-today-overdue-tasks",
    name: "My Today + Overdue Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Due_Date", "Subject", "Status", "Priority", "What_Id", "Who_Id", "BEST_TIME"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          groupOperator: "and",
          group: [
            {
              field: "Due_Date",
              comparator: "less_equal",
              // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
              value: "${TODAYANDOVERDUE}",
            },
            {
              field: "Status",
              comparator: "not_equal",
              value: "Completed",
            },
          ],
        },
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
            name: "${CURRENTUSER}",
          },
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-today-s-tasks",
    name: "My Today's Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Due_Date", "Subject", "Status", "Priority", "What_Id", "Who_Id", "BEST_TIME"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          groupOperator: "and",
          group: [
            {
              field: "Due_Date",
              comparator: "equal",
              // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
              value: "${TODAY}",
            },
            {
              field: "Status",
              comparator: "not_equal",
              value: "Completed",
            },
          ],
        },
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
            name: "${CURRENTUSER}",
          },
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-tomorrow-s-tasks",
    name: "My Tomorrow's Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Due_Date", "Subject", "Status", "Priority", "What_Id", "Who_Id", "BEST_TIME"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Due_Date",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${TOMORROW}",
        },
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
            name: "${CURRENTUSER}",
          },
        },
      ],
    },
    sort: null,
  },
  {
    id: "next-7-days-overdue-tasks",
    name: "Next 7 Days + Overdue Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id", "Owner"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Due_Date",
          comparator: "less_equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${NEXT7DAYS}",
        },
        {
          field: "Status",
          comparator: "not_equal",
          value: "Completed",
        },
      ],
    },
    sort: null,
  },
  {
    id: "open-tasks",
    name: "Open Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id", "Owner"],
    criteria: {
      field: "Status",
      comparator: "not_equal",
      value: "Completed",
    },
    sort: null,
  },
  {
    id: "overdue-tasks",
    name: "Overdue Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id", "Owner"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Due_Date",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${YESTERDAYMINUS}",
        },
        {
          field: "Status",
          comparator: "not_equal",
          value: "Completed",
        },
      ],
    },
    sort: null,
  },
  {
    id: "today-overdue-tasks",
    name: "Today + Overdue Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id", "Owner"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Due_Date",
          comparator: "less_equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${TODAYANDOVERDUE}",
        },
        {
          field: "Status",
          comparator: "not_equal",
          value: "Completed",
        },
      ],
    },
    sort: null,
  },
  {
    id: "today-s-tasks",
    name: "Today's Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id", "Owner"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Due_Date",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${TODAY}",
        },
        {
          field: "Status",
          comparator: "not_equal",
          value: "Completed",
        },
      ],
    },
    sort: null,
  },
  {
    id: "tomorrow-s-tasks",
    name: "Tomorrow's Tasks",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id", "Owner"],
    criteria: {
      field: "Due_Date",
      comparator: "equal",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
      value: "${TOMORROW}",
    },
    sort: null,
  },
] as const;

/** Explicit projection exception approved for a source column without a field. */
export const tasksDroppedColumns = ["BEST_TIME"] as const;
const sourceTokens: Readonly<Record<string, CriteriaToken>> = {
  "${CURRENTUSER}": { token: "CURRENTUSER" },
  "${TODAY}": { token: "TODAY" },
  "${TOMORROW}": { token: "PERIOD", name: "TOMORROW" },
  "${YESTERDAYMINUS}": { token: "PERIOD", name: "TILL_YESTERDAY" },
  "${NEXT7DAYS}": { token: "NEXT7DAYS" },
  "${TODAYANDOVERDUE}": { token: "TODAYANDOVERDUE" },
};
type SourceCriteria =
  | { groupOperator: "and" | "or"; group: readonly SourceCriteria[] }
  | { field: string; comparator: Comparator; value: string | boolean | { name: string } };
function convertCriteria(source: SourceCriteria | null): Criteria | null {
  if (source === null) return null;
  if ("group" in source)
    return {
      groupOperator: source.groupOperator,
      group: source.group.map((child) => convertCriteria(child) as Criteria),
    };
  const key = typeof source.value === "object" ? source.value.name : source.value;
  return {
    field: source.field,
    comparator: source.comparator,
    value: typeof key === "string" ? (sourceTokens[key] ?? key) : key,
  };
}
export const tasksViews: readonly ListView[] = tasksViewSource.map((view) => ({
  ...view,
  columns: view.columns.filter(
    (column) => !tasksDroppedColumns.some((dropped) => dropped === column),
  ),
  criteria: convertCriteria(view.criteria),
}));
