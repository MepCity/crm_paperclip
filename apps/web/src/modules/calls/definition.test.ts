import { expect, test } from "vitest";
import { accountsFormRules } from "../accounts/accounts-form-rules";
import { moduleScreens, resolveModuleScreen } from "../registry";
import {
  CALLS_DELETE_CONFIRM_MESSAGE,
  CALLS_DELETE_CONFIRM_TITLE,
} from "./calls-record-more-options";
import { callsScreenDefinition } from "./definition";
import { callsListPageConfig } from "./list-config";
import { buildCallsFilterGroups } from "./list-filters";

test("exports a complete Calls module screen definition satisfying ModuleScreenDefinition", () => {
  expect(callsScreenDefinition).toMatchObject({
    apiName: "Calls",
    tab: "Calls",
    singularLabel: "Call",
    pluralLabel: "Calls",
    pageTitle: "Calls",
    navigation: { id: "calls", group: "activities" },
    listCurrencyCode: "TRY",
  });

  expect(callsScreenDefinition.list).toBe(callsListPageConfig);
  expect(callsScreenDefinition.buildFilterGroups).toBe(buildCallsFilterGroups);

  // Form still borrows Accounts; detail is Calls-specific
  expect(callsScreenDefinition.form.rules).toBe(accountsFormRules);
  expect(callsScreenDefinition.detail.deleteTitle).toBe(CALLS_DELETE_CONFIRM_TITLE);
  expect(callsScreenDefinition.detail.deleteMessage).toBe(CALLS_DELETE_CONFIRM_MESSAGE);
  expect(callsScreenDefinition.detail.layout).toBe("activity");
  expect(callsScreenDefinition.detail.relatedListRail).toBeUndefined();
  expect(callsScreenDefinition.detail.timeline.subtabs).toBeDefined();
  expect(callsScreenDefinition.detail.timeline.normalizeEventKind).toBeDefined();

  expect(resolveModuleScreen("Calls")).toBe(callsScreenDefinition);
  expect(moduleScreens.some((definition) => definition.apiName === "Calls")).toBe(true);
  expect(moduleScreens.some((definition) => definition.tab === "Calls")).toBe(true);
});

test("calls detail buildHeaderCommands includes Reschedule Call split button when scheduled", () => {
  const scheduledCommands = callsScreenDefinition.detail.buildHeaderCommands?.(
    { id: "c1", fields: { Outgoing_Call_Status: "Scheduled" } },
    { editHref: "/edit", save: () => Promise.resolve() },
  );
  expect(scheduledCommands).toEqual([
    expect.objectContaining({
      id: "reschedule-call",
      label: "Reschedule Call",
      variant: "primary",
      onPress: expect.any(Function),
      splitLabel: "Down arrow",
    }),
  ]);

  const nonScheduledCommands = callsScreenDefinition.detail.buildHeaderCommands?.(
    { id: "c2", fields: { Outgoing_Call_Status: "Completed" } },
    { editHref: "/edit", save: () => Promise.resolve() },
  );
  expect(nonScheduledCommands).toEqual([]);
});
