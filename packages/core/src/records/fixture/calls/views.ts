import type { Comparator, Criteria, CriteriaToken, ListView } from "../../contract";

/** Sanitized saved-view definitions. Export date tokens remain source literals.
 * An empty source value is projected to is_empty; numeric source literals on
 * integer fields are converted to numbers. A duplicated source column is kept
 * once, in its first position. Open/closed state is only what these criteria say.
 */
export const callsViewSource = [
  {
    id: "all-calls",
    name: "All Calls",
    systemDefined: true,
    isDefault: true,
    columns: [
      "Subject",
      "Call_Type",
      "Call_Start_Time",
      "Call_Duration",
      "What_Id",
      "Who_Id",
      "Owner",
    ],
    criteria: null,
    sort: null,
  },
  {
    id: "attended-calls",
    name: "Attended Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Call_Type",
          comparator: "equal",
          value: "Outbound",
        },
        {
          field: "Call_Duration_in_seconds",
          comparator: "greater_than",
          value: "0",
        },
      ],
    },
    sort: null,
  },
  {
    id: "cancelled-calls",
    name: "Cancelled Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      field: "Outgoing_Call_Status",
      comparator: "equal",
      value: "Cancelled",
    },
    sort: null,
  },
  {
    id: "completed-calls",
    name: "Completed Calls",
    systemDefined: true,
    isDefault: false,
    columns: [
      "Subject",
      "What_Id",
      "Call_Start_Time",
      "Call_Type",
      "Call_Start_Time",
      "Call_Duration",
    ],
    criteria: {
      groupOperator: "or",
      group: [
        {
          groupOperator: "and",
          group: [
            {
              field: "Outgoing_Call_Status",
              comparator: "not_equal",
              value: "Scheduled",
            },
            {
              field: "Outgoing_Call_Status",
              comparator: "not_equal",
              value: "Overdue",
            },
          ],
        },
        {
          field: "Outgoing_Call_Status",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${EMPTY}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "incoming-calls",
    name: "Incoming Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      field: "Call_Type",
      comparator: "equal",
      value: "Inbound",
    },
    sort: null,
  },
  {
    id: "missed-calls",
    name: "Missed Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      field: "Call_Type",
      comparator: "equal",
      value: "Missed",
    },
    sort: null,
  },
  {
    id: "my-attended-calls",
    name: "My Attended Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          groupOperator: "and",
          group: [
            {
              field: "Call_Type",
              comparator: "equal",
              value: "Outbound",
            },
            {
              field: "Call_Duration_in_seconds",
              comparator: "greater_than",
              value: "0",
            },
          ],
        },
        {
          field: "Owner",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${CURRENTUSER}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-calls",
    name: "My Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "Call_Type", "Call_Start_Time", "Call_Duration", "What_Id", "Who_Id"],
    criteria: {
      field: "Owner",
      comparator: "equal",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
      value: "${CURRENTUSER}",
    },
    sort: null,
  },
  {
    id: "my-cancelled-calls",
    name: "My Cancelled Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Outgoing_Call_Status",
          comparator: "equal",
          value: "Cancelled",
        },
        {
          field: "Owner",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${CURRENTUSER}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-incoming-calls",
    name: "My Incoming Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Call_Type",
          comparator: "equal",
          value: "Inbound",
        },
        {
          field: "Owner",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${CURRENTUSER}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-missed-calls",
    name: "My Missed Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Call_Type",
          comparator: "equal",
          value: "Missed",
        },
        {
          field: "Owner",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${CURRENTUSER}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-outgoing-calls",
    name: "My Outgoing Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Call_Type",
          comparator: "equal",
          value: "Outbound",
        },
        {
          field: "Owner",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${CURRENTUSER}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-overdue-calls",
    name: "My Overdue Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Outgoing_Call_Status",
          comparator: "equal",
          value: "Overdue",
        },
        {
          field: "Owner",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${CURRENTUSER}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-scheduled-calls",
    name: "My Scheduled Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Outgoing_Call_Status",
          comparator: "equal",
          value: "Scheduled",
        },
        {
          field: "Owner",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${CURRENTUSER}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-todays-scheduled-overdue-calls",
    name: "My Todays Scheduled+Overdue Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          groupOperator: "and",
          group: [
            {
              groupOperator: "or",
              group: [
                {
                  field: "Outgoing_Call_Status",
                  comparator: "equal",
                  value: "Scheduled",
                },
                {
                  field: "Outgoing_Call_Status",
                  comparator: "equal",
                  value: "Overdue",
                },
              ],
            },
            {
              field: "Call_Start_Time",
              comparator: "equal",
              // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
              value: "${TODAY}",
            },
          ],
        },
        {
          field: "Owner",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${CURRENTUSER}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-todays-scheduled-calls",
    name: "My Todays Scheduled Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          groupOperator: "and",
          group: [
            {
              field: "Outgoing_Call_Status",
              comparator: "equal",
              value: "Scheduled",
            },
            {
              field: "Owner",
              comparator: "equal",
              // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
              value: "${CURRENTUSER}",
            },
          ],
        },
        {
          field: "Call_Start_Time",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${TODAY}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-unattended-calls",
    name: "My Unattended Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          groupOperator: "and",
          group: [
            {
              field: "Outgoing_Call_Status",
              comparator: "equal",
              value: "Completed",
            },
            {
              field: "Call_Duration_in_seconds",
              comparator: "equal",
              value: "0",
            },
          ],
        },
        {
          field: "Owner",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${CURRENTUSER}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "outgoing-calls",
    name: "Outgoing Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      field: "Call_Type",
      comparator: "equal",
      value: "Outbound",
    },
    sort: null,
  },
  {
    id: "overdue-calls",
    name: "Overdue Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      field: "Outgoing_Call_Status",
      comparator: "equal",
      value: "Overdue",
    },
    sort: null,
  },
  {
    id: "scheduled-calls",
    name: "Scheduled Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      field: "Outgoing_Call_Status",
      comparator: "equal",
      value: "Scheduled",
    },
    sort: null,
  },
  {
    id: "todays-scheduled-calls",
    name: "Todays Scheduled Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Outgoing_Call_Status",
          comparator: "equal",
          value: "Scheduled",
        },
        {
          field: "Call_Start_Time",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${TODAY}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "todays-scheduled-overdue-calls",
    name: "Todays Scheduled+Overdue Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          groupOperator: "or",
          group: [
            {
              field: "Outgoing_Call_Status",
              comparator: "equal",
              value: "Scheduled",
            },
            {
              field: "Outgoing_Call_Status",
              comparator: "equal",
              value: "Overdue",
            },
          ],
        },
        {
          field: "Call_Start_Time",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
          value: "${TODAY}",
        },
      ],
    },
    sort: null,
  },
  {
    id: "unattended-calls",
    name: "Unattended Calls",
    systemDefined: true,
    isDefault: false,
    columns: ["Subject", "What_Id", "Call_Start_Time"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Outgoing_Call_Status",
          comparator: "equal",
          value: "Completed",
        },
        {
          field: "Call_Duration_in_seconds",
          comparator: "equal",
          value: "0",
        },
      ],
    },
    sort: null,
  },
] as const;

const sourceTokens: Readonly<Record<string, CriteriaToken>> = {
  "${CURRENTUSER}": { token: "CURRENTUSER" },
  "${TODAY}": { token: "TODAY" },
};
const integerFields: ReadonlySet<string> = new Set(["Call_Duration_in_seconds"]);
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
  // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal token from the metadata export.
  if (source.value === "${EMPTY}")
    return { field: source.field, comparator: "is_empty", value: null };
  const key = typeof source.value === "object" ? source.value.name : source.value;
  if (typeof key === "string" && integerFields.has(source.field))
    return { field: source.field, comparator: source.comparator, value: Number(key) };
  return {
    field: source.field,
    comparator: source.comparator,
    value: typeof key === "string" ? (sourceTokens[key] ?? key) : key,
  };
}
export const callsViews: readonly ListView[] = callsViewSource.map((view) => ({
  ...view,
  columns: (view.columns as readonly string[]).filter(
    (column, index, all) => all.indexOf(column) === index,
  ),
  criteria: convertCriteria(view.criteria as SourceCriteria | null),
}));
