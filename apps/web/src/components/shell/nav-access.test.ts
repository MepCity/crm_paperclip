import { describe, expect, it } from "vitest";
import {
  accessSettingsNav,
  type NavConfig,
  navWithoutLink,
  settingsNav,
  settingsNavFor,
  shellNav,
} from "./nav";

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

describe("navWithoutLink", () => {
  it("removes the feeds entry everywhere and keeps the rest", () => {
    const collect = (c: NavConfig) => [
      ...c.links,
      ...c.sections.flatMap((s) => [...s.groups.flatMap((g) => g.links), ...(s.links ?? [])]),
    ];
    expect(collect(shellNav).some((l) => l.id === "feeds")).toBe(true);
    const stripped = navWithoutLink(shellNav, "feeds");
    expect(collect(stripped).some((l) => l.id === "feeds")).toBe(false);
    expect(collect(stripped)).toHaveLength(collect(shellNav).length - 1);
  });
});
