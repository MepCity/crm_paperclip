import { expect, test } from "vitest";
import { moduleScreens, resolveModuleScreen } from "../registry";
import { CallRecordScreen } from "./call-record-screen";
import { buildCallsBusinessCardFields, buildCallsDetailSections } from "./calls-detail-sections";
import { callsFormRules } from "./calls-form-rules";
import { callsRecordHeaderIdentity } from "./calls-record-header";
import {
  buildCallsRecordMoreMenuGroups,
  CALLS_DELETE_CONFIRM_MESSAGE,
  CALLS_DELETE_CONFIRM_TITLE,
} from "./calls-record-more-options";
import { CALLS_TIMELINE_SUBTABS, normalizeCallsEventKind } from "./calls-timeline";
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

  // Detail definition uses Calls helpers
  expect(callsScreenDefinition.detail.Screen).toBe(CallRecordScreen);
  expect(callsScreenDefinition.detail.header).toBe(callsRecordHeaderIdentity);
  expect(callsScreenDefinition.detail.businessCard).toBe(buildCallsBusinessCardFields);
  expect(callsScreenDefinition.detail.sections).toBe(buildCallsDetailSections);
  expect(callsScreenDefinition.detail.moreOptions).toBe(buildCallsRecordMoreMenuGroups);
  expect(callsScreenDefinition.detail.deleteTitle).toBe(CALLS_DELETE_CONFIRM_TITLE);
  expect(callsScreenDefinition.detail.deleteMessage).toBe(CALLS_DELETE_CONFIRM_MESSAGE);
  expect(callsScreenDefinition.detail.timeline.subtabs).toBe(CALLS_TIMELINE_SUBTABS);
  expect(callsScreenDefinition.detail.timeline.normalizeEventKind).toBe(normalizeCallsEventKind);

  expect(callsScreenDefinition.form.rules).toBe(callsFormRules);
  expect(callsScreenDefinition.form.variant).toBe("activity");

  expect(resolveModuleScreen("Calls")).toBe(callsScreenDefinition);
  expect(moduleScreens.some((definition) => definition.apiName === "Calls")).toBe(true);
  expect(moduleScreens.some((definition) => definition.tab === "Calls")).toBe(true);
});
