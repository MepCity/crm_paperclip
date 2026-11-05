import { describe, expect, it } from "vitest";
import { accessSettingsNav, isNavLinkActive, settingsNav, settingsNavFor } from "./nav";

describe("settingsNavFor", () => {
  it("hides the access links without user management", () => {
    expect(settingsNavFor(false)).toEqual(settingsNav);
  });

  it("adds the access links after the General group", () => {
    const ids = settingsNavFor(true).map((link) => link.id);
    expect(ids).toHaveLength(settingsNav.length + accessSettingsNav.length);
    expect(ids.slice(0, 6)).toEqual([
      "general",
      "users",
      "personal-settings",
      "company-details",
      "currencies",
      "calendar-booking",
    ]);
    expect(ids.slice(6, 9)).toEqual(["profiles", "roles", "field-permissions"]);
    // Groups and Data Sharing Settings are tabs of the Users and Roles pages.
    const roles = accessSettingsNav.find((link) => link.id === "roles");
    expect(roles?.label).toBe("Roles and Sharing");
    expect(roles && isNavLinkActive(roles, "acme", "/crm/acme/settings/data-sharing")).toBe(true);
    const users = settingsNav.find((link) => link.id === "users");
    expect(users && isNavLinkActive(users, "acme", "/crm/acme/settings/groups")).toBe(true);
    expect(users && isNavLinkActive(users, "acme", "/crm/acme/settings/activate-users")).toBe(true);
    expect(users && isNavLinkActive(users, "acme", "/crm/acme/settings/profiles")).toBe(false);
    expect(accessSettingsNav.every((link) => link.requiresUserManagement)).toBe(true);
  });
});
