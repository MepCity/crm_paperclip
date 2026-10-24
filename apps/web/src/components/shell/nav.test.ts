import { describe, expect, it } from "vitest";
import { Icons } from "@/components/ui/icon";
import { getModuleScreens } from "@/modules/registry";
import {
  createRecordsNav,
  flatNavOrder,
  isNavLinkActive,
  type NavLink,
  navLinkIconClassName,
  settingsNav,
  shellNav,
} from "./nav";

describe("navLinkIconClassName", () => {
  const baseLink: NavLink = {
    id: "leads",
    label: "Leads",
    icon: Icons.building,
    href: (slug) => `/crm/${slug}/leads`,
    match: "prefix",
  };

  it("returns base class for non-nested links regardless of active state", () => {
    expect(navLinkIconClassName(baseLink, { nested: false, active: false })).toBe(
      "size-(--size-rail-icon) shrink-0",
    );
    expect(navLinkIconClassName(baseLink, { nested: false, active: true })).toBe(
      "size-(--size-rail-icon) shrink-0",
    );
  });

  it("applies text-rail-icon for nested inactive links and keeps base for nested active links", () => {
    expect(navLinkIconClassName(baseLink, { nested: true, active: false })).toBe(
      "size-(--size-rail-icon) shrink-0 text-rail-icon",
    );
    expect(navLinkIconClassName(baseLink, { nested: true, active: true })).toBe(
      "size-(--size-rail-icon) shrink-0",
    );
  });

  it("edge case: applies icon accent token class over nested and active states", () => {
    const accentedLink: NavLink = {
      ...baseLink,
      iconAccentToken: "--color-accent-blue",
    };
    expect(navLinkIconClassName(accentedLink, { nested: false, active: false })).toBe(
      "size-(--size-rail-icon) shrink-0 text-accent-blue",
    );
    expect(navLinkIconClassName(accentedLink, { nested: true, active: false })).toBe(
      "size-(--size-rail-icon) shrink-0 text-accent-blue",
    );
    expect(navLinkIconClassName(accentedLink, { nested: true, active: true })).toBe(
      "size-(--size-rail-icon) shrink-0 text-accent-blue",
    );
  });
});

describe("shellNav", () => {
  it("defines top-level pinned links and teamspace section structure", () => {
    expect(shellNav.links.map((link) => link.id)).toEqual([
      "home",
      "workqueue",
      "reports",
      "analytics",
    ]);
    const workqueueLink = shellNav.links[1];
    if (!workqueueLink) throw new Error("Missing Workqueue link");
    expect(workqueueLink.href("acme")).toBe("/crm/acme/workqueue");
    expect(isNavLinkActive(workqueueLink, "acme", "/crm/acme/workqueue")).toBe(true);

    const reportsLink = shellNav.links.find((link) => link.id === "reports");
    expect(reportsLink?.href("acme")).toBe("/crm/acme/tab/Reports");
    if (reportsLink) {
      expect(isNavLinkActive(reportsLink, "acme", "/crm/acme/tab/Reports/sample-report-1")).toBe(
        true,
      );
    }
    const analyticsLink = shellNav.links.find((link) => link.id === "analytics");
    expect(analyticsLink?.href("acme")).toBe("/crm/acme/tab/Dashboards");
    if (analyticsLink) {
      expect(isNavLinkActive(analyticsLink, "acme", "/crm/acme/tab/Dashboards")).toBe(true);
    }
    const homeLink = shellNav.links[0];
    expect(homeLink).toBeDefined();
    if (!homeLink) return;

    expect(isNavLinkActive(homeLink, "acme", "/crm/acme/workqueue")).toBe(false);
    expect(homeLink.id).toBe("home");
    expect(homeLink.label).toBe("Home");
    expect(homeLink.icon).toBe(Icons.home);
    expect(homeLink.match).toBe("exact");
    expect(homeLink.iconAccentToken).toBe("--color-accent-blue");
    expect(homeLink.href("acme")).toBe("/crm/acme");

    expect(shellNav.sections).toHaveLength(1);
    const teamspace = shellNav.sections[0];
    expect(teamspace).toBeDefined();
    if (!teamspace) return;

    expect(teamspace.id).toBe("teamspace");
    expect(teamspace.label).toBe("Teamspace");
    expect(teamspace.groups.map((group) => group.id)).toEqual(["sales", "activities"]);
  });

  it("populates sales and activities groups from module screen registry", () => {
    const teamspace = shellNav.sections[0];
    const salesGroup = teamspace?.groups.find((group) => group.id === "sales");
    const activitiesGroup = teamspace?.groups.find((group) => group.id === "activities");

    expect(salesGroup).toBeDefined();
    expect(activitiesGroup).toBeDefined();

    const screens = getModuleScreens();
    const expectedSalesModules = screens.filter(
      (screen) => (screen.navigation.group ?? "sales") === "sales",
    );
    const expectedActivitiesModules = screens.filter(
      (screen) => screen.navigation.group === "activities",
    );
    const salesIds = expectedSalesModules.map((screen) => screen.navigation.id);
    salesIds.splice(salesIds.indexOf("deals") + 1, 0, "documents");
    expect(salesGroup?.links.map((link) => link.id)).toEqual(salesIds);
    expect(activitiesGroup?.links.map((link) => link.id)).toEqual(
      expectedActivitiesModules.map((screen) => screen.navigation.id),
    );

    for (const link of salesGroup?.links ?? []) {
      expect(link.match).toBe("prefix");
      expect(link.href("acme")).toContain("/crm/acme/");
      expect(link.activePrefix?.("acme")).toContain("/crm/acme/");
    }
  });

  it("keeps Campaigns in Sales and places Solutions and Cases as ungrouped rows in reference order", () => {
    const teamspace = shellNav.sections[0];
    const sales = teamspace?.groups.find((group) => group.id === "sales");
    expect(sales?.links.map((link) => link.id)).toEqual([
      "leads",
      "contacts",
      "accounts",
      "deals",
      "documents",
      "campaigns",
    ]);
    expect(teamspace?.links?.map((link) => link.id)).toEqual(["solutions", "cases"]);
  });

  it("lists the full reference order of ungrouped rows with Solutions before Cases", () => {
    expect(flatNavOrder.indexOf("solutions")).toBeLessThan(flatNavOrder.indexOf("cases"));
    expect(flatNavOrder).toEqual([
      "price-books",
      "products",
      "quotes",
      "invoices",
      "sales-orders",
      "solutions",
      "social",
      "forecasts",
      "purchase-orders",
      "vendors",
      "salesinbox",
      "cases",
      "my-jobs",
      "services",
    ]);
  });

  it("gives every module row its own glyph", () => {
    const teamspace = shellNav.sections[0];
    const rows = [
      ...(teamspace?.groups.flatMap((g) => g.links) ?? []),
      ...(teamspace?.links ?? []),
    ];
    const glyphs = rows.filter((l) => l.id !== "accounts").map((l) => l.icon);
    expect(new Set(glyphs).size).toBe(glyphs.length);
    expect(rows.find((l) => l.id === "accounts")?.icon).toBe(Icons.building);
  });

  it("edge case: generates valid paths for empty and complex organization slugs", () => {
    const homeLink = shellNav.links[0];
    expect(homeLink?.href("")).toBe("/crm/");
    expect(homeLink?.href("org-with-hyphens-123")).toBe("/crm/org-with-hyphens-123");

    const teamspace = shellNav.sections[0];
    const firstGroupLink = teamspace?.groups[0]?.links[0];
    expect(firstGroupLink).toBeDefined();
    if (!firstGroupLink) return;

    expect(firstGroupLink.href("org-with-hyphens-123")).toContain("/crm/org-with-hyphens-123/");
    expect(firstGroupLink.activePrefix?.("org-with-hyphens-123")).toContain(
      "/crm/org-with-hyphens-123/",
    );
  });
});

describe("settingsNav", () => {
  it("defines settings links in group order", () => {
    expect(settingsNav.map((link) => link.id)).toEqual([
      "general",
      "members",
      "personal-settings",
      "company-details",
      "currencies",
      "calendar-booking",
      "email",
      "import-history",
      "export-history",
      "modules-and-fields",
      "assignment-rules",
    ]);
    const [general, members] = settingsNav;
    const calendarBooking = settingsNav.find((link) => link.id === "calendar-booking");

    expect(general).toEqual({
      id: "general",
      label: "General",
      icon: Icons.settings,
      href: expect.any(Function),
      match: "exact",
      group: "General",
    });
    expect(members).toEqual({
      id: "members",
      label: "Members",
      icon: Icons.users,
      href: expect.any(Function),
      match: "exact",
      group: "General",
    });
    expect(calendarBooking).toEqual({
      id: "calendar-booking",
      label: "Calendar Booking",
      icon: Icons.calendar,
      href: expect.any(Function),
      match: "exact",
      group: "General",
    });

    expect(general?.href("acme")).toBe("/crm/acme/settings");
    expect(members?.href("acme")).toBe("/crm/acme/settings/members");
    expect(calendarBooking?.href("acme")).toBe("/crm/acme/settings/calendar-booking");
  });

  it("groups calendar booking under General and matches only its own settings page", () => {
    const generalLinks = settingsNav.filter((link) => link.group === "General");
    expect(generalLinks.map((link) => link.label)).toEqual([
      "General",
      "Members",
      "Personal Settings",
      "Company Details",
      "Currencies",
      "Calendar Booking",
    ]);

    const bookingLink = settingsNav.find((link) => link.id === "calendar-booking");
    expect(bookingLink).toBeDefined();
    if (!bookingLink) return;

    const path = "/crm/acme/settings/calendar-booking";
    expect(bookingLink.href("acme")).toBe(path);
    expect(bookingLink.match).toBe("exact");
    expect(isNavLinkActive(bookingLink, "acme", path)).toBe(true);
    expect(isNavLinkActive(bookingLink, "acme", "/crm/acme/settings")).toBe(false);
    expect(isNavLinkActive(bookingLink, "acme", `${path}/subpage`)).toBe(false);
  });

  it("resolves company, currency and personal settings without matching sibling routes", () => {
    for (const id of ["company-details", "currencies", "personal-settings"]) {
      const link = settingsNav.find((entry) => entry.id === id);
      expect(link).toBeDefined();
      if (!link) continue;
      const path = `/crm/example/settings/${id}`;
      expect(link.href("example")).toBe(path);
      expect(isNavLinkActive(link, "example", path)).toBe(true);
      expect(isNavLinkActive(link, "example", "/crm/example/settings")).toBe(false);
    }
  });

  it("exposes Email under Channels and keeps it active on configuration subtabs", () => {
    const email = settingsNav.find((link) => link.id === "email");
    expect(email?.group).toBe("Channels");
    expect(email?.href("demo")).toBe("/crm/demo/settings/email-configuration");
    if (!email) return;
    expect(
      isNavLinkActive(email, "demo", "/crm/demo/settings/email-configuration/email-sharing"),
    ).toBe(true);
    expect(isNavLinkActive(email, "demo", "/crm/demo/settings/members")).toBe(false);
  });

  it("groups transfer history links and matches only their own settings page", () => {
    const historyLinks = settingsNav.filter((link) => link.group === "Data Administration");
    expect(historyLinks.map((link) => link.label)).toEqual(["Import History", "Export History"]);

    for (const [index, link] of historyLinks.entries()) {
      const page = index === 0 ? "import-history" : "export-history";
      const path = `/crm/acme/settings/${page}`;
      expect(link.href("acme")).toBe(path);
      expect(link.match).toBe("exact");
      expect(isNavLinkActive(link, "acme", path)).toBe(true);
      expect(isNavLinkActive(link, "acme", "/crm/acme/settings")).toBe(false);
      expect(isNavLinkActive(link, "acme", `${path}/other`)).toBe(false);
    }
  });

  it("edge case: generates correct paths for empty and non-standard organization slugs without accent tokens", () => {
    const [general, members] = settingsNav;
    expect(general?.href("")).toBe("/crm//settings");
    expect(members?.href("acme-team_42")).toBe("/crm/acme-team_42/settings/members");
    expect(general?.iconAccentToken).toBeUndefined();
    expect(members?.iconAccentToken).toBeUndefined();
    expect(general?.activePrefix).toBeUndefined();
  });
});

describe("createRecordsNav", () => {
  it("maps registered module screens to create record entries with apiName and singularLabel", () => {
    const screens = getModuleScreens();
    expect(createRecordsNav).toHaveLength(screens.length);

    expect(createRecordsNav.map((entry) => entry.id)).toEqual(
      screens.map((screen) => screen.apiName),
    );
    expect(createRecordsNav.map((entry) => entry.label)).toEqual(
      screens.map((screen) => screen.singularLabel),
    );
  });

  it("edge case: verifies every module create path formats properly with arbitrary org slugs", () => {
    const screens = getModuleScreens();
    for (let i = 0; i < createRecordsNav.length; i++) {
      const entry = createRecordsNav[i];
      const screen = screens[i];
      expect(entry).toBeDefined();
      expect(screen).toBeDefined();
      if (!entry || !screen) continue;

      expect(entry.id).toBe(screen.apiName);
      expect(entry.path("test-org")).toBe(`/crm/test-org/tab/${screen.tab}/create`);
      expect(entry.path("another_slug-99")).toBe(`/crm/another_slug-99/tab/${screen.tab}/create`);
    }
  });
});

describe("isNavLinkActive", () => {
  const exactLink: NavLink = {
    id: "home",
    label: "Home",
    icon: Icons.home,
    href: (slug) => `/crm/${slug}`,
    match: "exact",
  };

  const prefixLink: NavLink = {
    id: "leads",
    label: "Leads",
    icon: Icons.building,
    href: (slug) => `/crm/${slug}/leads`,
    match: "prefix",
  };

  const prefixWithCustomActiveRoot: NavLink = {
    id: "leads-view",
    label: "Leads",
    icon: Icons.building,
    href: (slug) => `/crm/${slug}/leads/view/all`,
    activePrefix: (slug) => `/crm/${slug}/leads`,
    match: "prefix",
  };

  it("matches exact links only when pathname is an identical match", () => {
    expect(isNavLinkActive(exactLink, "acme", "/crm/acme")).toBe(true);
    expect(isNavLinkActive(exactLink, "acme", "/crm/acme/")).toBe(false);
    expect(isNavLinkActive(exactLink, "acme", "/crm/acme/settings")).toBe(false);
    expect(isNavLinkActive(exactLink, "acme", "/crm/other")).toBe(false);
  });

  it("matches prefix links for exact root and nested subpaths", () => {
    expect(isNavLinkActive(prefixLink, "acme", "/crm/acme/leads")).toBe(true);
    expect(isNavLinkActive(prefixLink, "acme", "/crm/acme/leads/")).toBe(true);
    expect(isNavLinkActive(prefixLink, "acme", "/crm/acme/leads/12345")).toBe(true);
    expect(isNavLinkActive(prefixLink, "acme", "/crm/acme/leads/view/custom")).toBe(true);
  });

  it("edge case: does not match partial string prefix without path separator boundary", () => {
    expect(isNavLinkActive(prefixLink, "acme", "/crm/acme/leads-archive")).toBe(false);
    expect(isNavLinkActive(prefixLink, "acme", "/crm/acme/lead")).toBe(false);
    expect(isNavLinkActive(prefixLink, "acme", "/crm/acme/leads_all")).toBe(false);
  });

  it("edge case: respects activePrefix when different from href", () => {
    expect(isNavLinkActive(prefixWithCustomActiveRoot, "acme", "/crm/acme/leads/view/all")).toBe(
      true,
    );
    expect(isNavLinkActive(prefixWithCustomActiveRoot, "acme", "/crm/acme/leads")).toBe(true);
    expect(isNavLinkActive(prefixWithCustomActiveRoot, "acme", "/crm/acme/leads/create")).toBe(
      true,
    );
    expect(
      isNavLinkActive(prefixWithCustomActiveRoot, "acme", "/crm/acme/leads-archived/create"),
    ).toBe(false);
  });

  it("edge case: returns false for unknown and completely unrelated paths", () => {
    expect(isNavLinkActive(exactLink, "acme", "")).toBe(false);
    expect(isNavLinkActive(exactLink, "acme", "/")).toBe(false);
    expect(isNavLinkActive(prefixLink, "acme", "/unknown/route")).toBe(false);
    expect(isNavLinkActive(prefixLink, "acme", "/crm/second/leads")).toBe(false);
  });
});
