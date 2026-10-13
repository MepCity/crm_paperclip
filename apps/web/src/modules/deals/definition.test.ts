import { expect, test } from "vitest";
import { moduleScreens, resolveModuleScreen } from "../registry";
import { dealsScreenDefinition } from "./definition";

test("exports a complete Deals module screen definition", () => {
  expect(dealsScreenDefinition).toMatchObject({
    apiName: "Deals",
    tab: "Deals",
    singularLabel: "Deal",
    pluralLabel: "Deals",
    pageTitle: "Deals",
    navigation: { id: "deals" },
  });
  expect(dealsScreenDefinition.detail.hasPortrait).toBe(false);
  expect(dealsScreenDefinition.detail.recordNavigation).toBe(false);
  expect(dealsScreenDefinition.detail.statusRibbon).toBeUndefined();
  expect(dealsScreenDefinition.detail.addTags).toEqual({ label: "Add Tags", laterModule: "M6" });
  expect(dealsScreenDefinition.detail.headerCommands).toEqual([
    { id: "send-email", label: "Send Email", variant: "primary", laterModule: "M10" },
  ]);
  // DD-35: update indicator shares the Overview/Timeline row.
  expect(dealsScreenDefinition.detail.lastUpdatePlacement).toBe("tab-row");
  expect(dealsScreenDefinition.detail.timeline.upcomingAutomatedActions).toEqual({
    label: "Show Upcoming Automated Actions",
    laterModule: "M12",
  });
  expect(dealsScreenDefinition.listCurrencyCode).toBe("TRY");
  expect(dealsScreenDefinition.form.inventoryChrome).toBe(true);
  expect(dealsScreenDefinition.form.rules.currencies).toEqual(["Amount", "Expected_Revenue"]);
  expect(dealsScreenDefinition.form.rules.defaultValues).toEqual({
    Stage: "Qualification",
    Probability: 10,
    Type: "-None-",
    Lead_Source: "-None-",
  });

  // Verify Deals is not registered in the shared registry yet (kept isolated for MEP-407)
  expect(resolveModuleScreen("Deals")).toBeUndefined();
  expect(moduleScreens.some((definition) => definition.apiName === "Deals")).toBe(false);
  expect(moduleScreens.some((definition) => definition.tab === "Deals")).toBe(false);
});
