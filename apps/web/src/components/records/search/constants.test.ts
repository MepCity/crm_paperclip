import { expect, test } from "vitest";
import { meetingsScreenDefinition } from "@/modules/meetings/definition";
import { getDocumentedModuleFilterItems } from "./constants";

test("Meetings appears once and uses Events for search requests", () => {
  const meetings = getDocumentedModuleFilterItems([meetingsScreenDefinition]).filter(
    (item) => item.label === "Meetings",
  );
  expect(meetings).toEqual([
    {
      id: "S-31.6",
      moduleApiName: "Events",
      label: "Meetings",
      isRegistered: true,
      laterModule: undefined,
    },
  ]);
});

test("unregistered Meetings retains its M5 placeholder", () => {
  expect(getDocumentedModuleFilterItems([]).find((item) => item.id === "S-31.6")).toEqual({
    id: "S-31.6",
    moduleApiName: "Events",
    label: "Meetings",
    isRegistered: false,
    laterModule: "M5",
  });
});
