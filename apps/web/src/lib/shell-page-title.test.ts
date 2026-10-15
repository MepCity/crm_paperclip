import { describe, expect, it } from "vitest";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { getModuleScreens } from "@/modules/registry";

describe("shellPageTitle", () => {
  it("has the fixed shell titles", () => {
    expect(shellPageTitle).toMatchObject({
      home: "Home",
      settings: "Settings",
      loading: "Loading",
      pageNotFound: "Page not found",
      somethingWentWrong: "Something went wrong",
    });
  });

  it("maps every registered module screen to its page title", () => {
    const titles: Record<string, string> = shellPageTitle;
    for (const definition of getModuleScreens()) {
      expect(titles[definition.navigation.id]).toBe(definition.pageTitle);
    }
  });
});

describe("shellPageMetadata", () => {
  it("returns the title as metadata", () => {
    expect(shellPageMetadata("Home")).toEqual({ title: "Home" });
  });
});
