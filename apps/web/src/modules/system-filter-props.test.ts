import { expect, test } from "vitest";
import { accountsFilterGroups } from "./accounts/list-filters";
import { callsFilterGroups } from "./calls/list-filters";
import { campaignsFilterGroups } from "./campaigns/list-filters";
import { contactsFilterGroups } from "./contacts/list-filters";
import { dealsFilterGroups } from "./deals/list-filters";
import { leadsFilterGroups } from "./leads/list-filters";
import { meetingsFilterGroups } from "./meetings/list-filters";
import { tasksFilterGroups } from "./tasks/list-filters";

const kinds = {
  Locked: "locked",
  "Record Action": "record_action",
  "Related Records Action": "related_records_action",
  "Touched Records": "touched",
  "Untouched Records": "untouched",
};
const modules = [
  ["Leads", leadsFilterGroups, ["Notes", "Attachments", "Tasks", "Events", "Calls"]],
  ["Contacts", contactsFilterGroups, ["Notes", "Attachments", "Tasks", "Events", "Calls"]],
  ["Accounts", accountsFilterGroups, ["Notes", "Attachments", "Tasks", "Events", "Calls"]],
  ["Deals", dealsFilterGroups, ["Notes", "Attachments", "Tasks", "Events", "Calls"]],
  ["Tasks", tasksFilterGroups, ["Notes", "Attachments"]],
  ["Meetings", meetingsFilterGroups, ["Notes", "Attachments"]],
  ["Calls", callsFilterGroups, ["Notes"]],
  ["Campaigns", campaignsFilterGroups, ["Notes", "Attachments"]],
] as const;

test.each(modules)(
  "%s enables its system filter rows with registered related lists",
  (name, groups, related) => {
    const rows = (groups[0]?.items ?? []).filter((row) => row.label in kinds);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.disabled).toBeUndefined();
      expect(row.systemEditor).toBe(kinds[row.label as keyof typeof kinds]);
    }
    const relatedRow = rows.find((row) => row.label === "Related Records Action");
    expect(relatedRow?.systemOptions?.relatedModules?.map((o) => o.id)).toEqual(related);
    const actions = rows.find((row) => row.label === "Record Action")?.systemOptions?.recordActions;
    expect(actions?.includes("converted")).toBe(name === "Leads");
  },
);
