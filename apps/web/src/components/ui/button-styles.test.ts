import { describe, expect, it } from "vitest";
import { buttonSizes, buttonStyles } from "./button-styles";

describe("button styles", () => {
  it("exposes the full set of style variants", () => {
    expect(Object.keys(buttonStyles).sort()).toEqual(
      [
        "avatar",
        "danger",
        "ghost",
        "icon",
        "primary",
        "rail",
        "railIcon",
        "recordNavigation",
        "recordPrimary",
        "recordSecondary",
        "recordSelector",
        "relatedAction",
        "secondary",
        "selection",
        "unsavedDialogLeave",
        "unsavedDialogStay",
      ].sort(),
    );
  });

  it("exposes the full set of sizes", () => {
    expect(Object.keys(buttonSizes).sort()).toEqual(
      [
        "actions",
        "avatar",
        "compact",
        "cardSelector",
        "pageAction",
        "pageSelector",
        "formAction",
        "listFilter",
        "listIcon",
        "listSelection",
        "listToolbar",
        "md",
        "record",
        "relatedAction",
        "selectUserFooter",
        "selector",
        "sm",
        "splitArrow",
        "splitPrimary",
        "toolbar",
      ].sort(),
    );
  });
});
