import { expect, test } from "vitest";
import { resolveLaterModule } from "@/components/ui/later-module";
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
  expect(dealsScreenDefinition.detail.headerCurrency).toBe(true);
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
  expect(dealsScreenDefinition.form.rules.omittedSections).toEqual(["Deal Image"]);
  const defaultValues =
    typeof dealsScreenDefinition.form.rules.defaultValues === "function"
      ? dealsScreenDefinition.form.rules.defaultValues()
      : dealsScreenDefinition.form.rules.defaultValues;
  expect(defaultValues).toEqual({
    Stage: "Qualification",
    Probability: 10,
    Type: "-None-",
    Lead_Source: "-None-",
  });

  // Deals is registered with the form screen; its module key stays out of the live list until
  // the "Deals links in earlier modules" task moves LIVE_MODULE_KEYS.
  expect(resolveModuleScreen("Deals")).toBe(dealsScreenDefinition);
  expect(moduleScreens.some((definition) => definition.apiName === "Deals")).toBe(true);
  expect(moduleScreens.some((definition) => definition.tab === "Deals")).toBe(true);
  expect(resolveLaterModule("M4")).toBe("M4");
});
