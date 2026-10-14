import { expect, test } from "vitest";
import { accountsFormRules } from "../accounts/accounts-form-rules";
import {
  ACCOUNTS_DELETE_CONFIRM_MESSAGE,
  ACCOUNTS_DELETE_CONFIRM_TITLE,
} from "../accounts/accounts-record-more-options";
import { moduleScreens, resolveModuleScreen } from "../registry";
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
    navigation: { id: "calls" },
    listCurrencyCode: "TRY",
  });

  expect(callsScreenDefinition.list).toBe(callsListPageConfig);
  expect(callsScreenDefinition.buildFilterGroups).toBe(buildCallsFilterGroups);

  // Temporary fallbacks from Accounts
  expect(callsScreenDefinition.form.rules).toBe(accountsFormRules);
  expect(callsScreenDefinition.detail.deleteTitle).toBe(ACCOUNTS_DELETE_CONFIRM_TITLE);
  expect(callsScreenDefinition.detail.deleteMessage).toBe(ACCOUNTS_DELETE_CONFIRM_MESSAGE);
  expect(callsScreenDefinition.detail.timeline.subtabs).toBeDefined();
  expect(callsScreenDefinition.detail.timeline.normalizeEventKind).toBeDefined();

  // Registry contract: Calls must NOT be registered in registry.ts in this task
  expect(resolveModuleScreen("Calls")).toBeUndefined();
  expect(moduleScreens.some((definition) => definition.apiName === "Calls")).toBe(false);
  expect(moduleScreens.some((definition) => definition.tab === "Calls")).toBe(false);
});
