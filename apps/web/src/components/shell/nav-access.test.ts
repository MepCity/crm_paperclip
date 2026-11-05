import { describe, expect, it } from "vitest";
import { accessSettingsNav, settingsNav, settingsNavFor } from "./nav";

describe("settingsNavFor", () => {
  it("hides the access links without user management", () => {
    expect(settingsNavFor(false)).toEqual(settingsNav);
  });

  it("adds the access links after the General group", () => {
    const ids = settingsNavFor(true).map((link) => link.id);
    expect(ids).toHaveLength(settingsNav.length + accessSettingsNav.length);
    expect(ids.slice(0, 6)).toEqual([
      "general",
      "members",
      "personal-settings",
      "company-details",
      "currencies",
      "calendar-booking",
    ]);
    expect(ids.slice(6, 11)).toEqual([
      "profiles",
      "roles",
      "groups",
      "data-sharing",
      "field-permissions",
    ]);
    expect(accessSettingsNav.every((link) => link.requiresUserManagement)).toBe(true);
  });
});
