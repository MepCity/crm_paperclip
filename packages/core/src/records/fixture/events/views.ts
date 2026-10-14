import type { Comparator, Criteria, CriteriaToken, ListView } from "../../contract";
/** Sanitized views: unknown Host_or_Participant stays published, never synthesized. */
export const eventsViewSource = [
  {
    id: "all-meetings",
    name: "All Meetings",
    systemDefined: true,
    isDefault: true,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id", "Owner"],
    criteria: null,
    sort: null,
  },
  {
    id: "cancelled-meetings",
    name: "Cancelled Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id"],
    criteria: null,
    sort: null,
  },
  {
    id: "completed-meetings",
    name: "Completed Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id", "Owner"],
    criteria: {
      field: "End_DateTime",
      comparator: "less_than",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
      value: "${CURRENTTIME}",
    },
    sort: null,
  },
  {
    id: "my-cancelled-meetings",
    name: "My Cancelled Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id", "Owner"],
    criteria: {
      field: "Owner",
      comparator: "equal",
      value: {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
        name: "${CURRENTUSER}",
      },
    },
    sort: null,
  },
  {
    id: "my-completed-meetings",
    name: "My Completed Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id", "Owner"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "End_DateTime",
          comparator: "less_than",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
          value: "${CURRENTTIME}",
        },
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
            name: "${CURRENTUSER}",
          },
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-meetings",
    name: "My Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id"],
    criteria: {
      field: "Host_or_Participant",
      comparator: "equal",
      value: {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
        name: "${CURRENTUSER}",
      },
    },
    sort: null,
  },
  {
    id: "my-todays-meetings",
    name: "My Today's Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "Start_DateTime",
          comparator: "equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
          value: "${TODAY}",
        },
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
            name: "${CURRENTUSER}",
          },
        },
      ],
    },
    sort: null,
  },
  {
    id: "my-upcoming-meetings",
    name: "My Upcoming Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id", "Owner"],
    criteria: {
      groupOperator: "and",
      group: [
        {
          field: "End_DateTime",
          comparator: "greater_equal",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
          value: "${CURRENTTIME}",
        },
        {
          field: "Owner",
          comparator: "equal",
          value: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
            name: "${CURRENTUSER}",
          },
        },
      ],
    },
    sort: null,
  },
  {
    id: "this-week-meetings",
    name: "This Weeks Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id", "Owner"],
    criteria: {
      field: "Start_DateTime",
      comparator: "equal",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
      value: "${THISWEEK}",
    },
    sort: null,
  },
  {
    id: "todays-meetings",
    name: "Today's Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id", "Owner"],
    criteria: {
      field: "Start_DateTime",
      comparator: "equal",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
      value: "${TODAY}",
    },
    sort: null,
  },
  {
    id: "upcoming-meetings",
    name: "Upcoming Meetings",
    systemDefined: true,
    isDefault: false,
    columns: ["Event_Title", "Start_DateTime", "End_DateTime", "What_Id", "Who_Id", "Owner"],
    criteria: {
      field: "End_DateTime",
      comparator: "greater_equal",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Exact saved-view source literal.
      value: "${CURRENTTIME}",
    },
    sort: null,
  },
] as const;
const sourceTokens: Readonly<Record<string, CriteriaToken>> = {
  "${CURRENTUSER}": { token: "CURRENTUSER" },
  "${CURRENTTIME}": { token: "CURRENTTIME" },
  "${TODAY}": { token: "TODAY" },
  "${THISWEEK}": { token: "PERIOD", name: "THIS_WEEK" },
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
export const eventsViews: readonly ListView[] = eventsViewSource.map((view) => ({
  ...view,
  criteria: convertCriteria(view.criteria),
}));
