import { describe, expect, it } from "vitest";
import { Icons } from "@/components/ui/icon";
import { createLeadsRelatedLists } from "./leads-related-lists";

describe("createLeadsRelatedLists", () => {
  it("defines notes, open-activities and closed-activities cards in reference order", () => {
    const lists = createLeadsRelatedLists();
    expect(lists).toHaveLength(3);

    const [notes, openActivities, closedActivities] = lists;
    expect(notes).toBeDefined();
    expect(openActivities).toBeDefined();
    expect(closedActivities).toBeDefined();
    if (!notes || !openActivities || !closedActivities) return;

    expect(notes.order).toBe(0);
    expect(notes.id).toBe("notes");
    expect(notes.title).toBe("Notes");
    expect(notes.moduleKey).toBe("M6");
    expect(notes.targetId).toBe("related-list-notes");
    expect(notes.emptyStateText).toBe("No records found");

    expect(openActivities.order).toBe(1);
    expect(openActivities.id).toBe("open-activities");
    expect(openActivities.title).toBe("Open Activities");
    expect(openActivities.moduleKey).toBe("M5");
    expect(openActivities.targetId).toBe("related-list-open-activities");

    expect(closedActivities.order).toBe(2);
    expect(closedActivities.id).toBe("closed-activities");
    expect(closedActivities.title).toBe("Closed Activities");
    expect(closedActivities.moduleKey).toBe("M5");
    expect(closedActivities.targetId).toBe("related-list-closed-activities");
  });

  it("configures upper controls for open-activities and closed-activities as defined", () => {
    const [, openActivities, closedActivities] = createLeadsRelatedLists();
    expect(openActivities).toBeDefined();
    expect(closedActivities).toBeDefined();
    if (!openActivities || !closedActivities) return;

    // Open activities has Add New split-button plus view controls
    expect(openActivities.upperControls).toHaveLength(4);
    expect(openActivities.upperControls).toEqual([
      { id: "add-new", label: "Add New", type: "split-button", moduleKey: "M5" },
      { id: "column-view-open", label: "Column View", type: "select", moduleKey: "M5" },
      {
        id: "table-plus-open",
        label: "Customize",
        type: "icon-button",
        moduleKey: "M11",
        icon: Icons.tablePlus,
      },
      {
        id: "expand-open",
        label: "Expand",
        type: "icon-button",
        moduleKey: "M5",
        icon: Icons.diagonalExpand,
      },
    ]);

    // Closed activities has view controls only (no Add New)
    expect(closedActivities.upperControls).toHaveLength(3);
    expect(closedActivities.upperControls).toEqual([
      { id: "column-view-closed", label: "Column View", type: "select", moduleKey: "M5" },
      {
        id: "table-plus-closed",
        label: "Customize",
        type: "icon-button",
        moduleKey: "M11",
        icon: Icons.tablePlus,
      },
      {
        id: "expand-closed",
        label: "Expand",
        type: "icon-button",
        moduleKey: "M5",
        icon: Icons.diagonalExpand,
      },
    ]);
  });

  it("applies positive activity badges to corresponding cards", () => {
    const lists = createLeadsRelatedLists({
      openActivities: 4,
      closedActivities: 2,
    });

    const openActivities = lists.find((card) => card.id === "open-activities");
    const closedActivities = lists.find((card) => card.id === "closed-activities");

    expect(openActivities?.countBadge).toBe(4);
    expect(closedActivities?.countBadge).toBe(2);
  });

  it("edge case: suppresses countBadge when counts are zero or negative", () => {
    const zeroBadges = createLeadsRelatedLists({
      openActivities: 0,
      closedActivities: 0,
    });
    expect(zeroBadges.find((card) => card.id === "open-activities")?.countBadge).toBeUndefined();
    expect(zeroBadges.find((card) => card.id === "closed-activities")?.countBadge).toBeUndefined();

    const negativeBadges = createLeadsRelatedLists({
      openActivities: -1,
      closedActivities: -5,
    });
    expect(
      negativeBadges.find((card) => card.id === "open-activities")?.countBadge,
    ).toBeUndefined();
    expect(
      negativeBadges.find((card) => card.id === "closed-activities")?.countBadge,
    ).toBeUndefined();
  });

  it("edge case: handles partial badge options and default empty badge argument", () => {
    const defaultLists = createLeadsRelatedLists();
    expect(defaultLists.find((card) => card.id === "open-activities")?.countBadge).toBeUndefined();
    expect(
      defaultLists.find((card) => card.id === "closed-activities")?.countBadge,
    ).toBeUndefined();

    const openOnly = createLeadsRelatedLists({ openActivities: 3 });
    expect(openOnly.find((card) => card.id === "open-activities")?.countBadge).toBe(3);
    expect(openOnly.find((card) => card.id === "closed-activities")?.countBadge).toBeUndefined();

    const closedOnly = createLeadsRelatedLists({ closedActivities: 5 });
    expect(closedOnly.find((card) => card.id === "open-activities")?.countBadge).toBeUndefined();
    expect(closedOnly.find((card) => card.id === "closed-activities")?.countBadge).toBe(5);
  });

  it("edge case: provides executable renderBody functions for each card", () => {
    const lists = createLeadsRelatedLists();
    for (const card of lists) {
      expect(typeof card.renderBody).toBe("function");
      if (!card.renderBody) continue;

      const renderedWithRecord = card.renderBody({
        record: { id: "lead-test-1", fields: {} },
        orgSlug: "acme",
        recordPath: () => "/crm/acme/leads/lead-test-1",
        definition: card,
      });
      expect(renderedWithRecord).toBeDefined();

      const renderedWithoutRecord = card.renderBody({
        record: undefined,
        orgSlug: "acme",
        recordPath: () => "/crm/acme/leads/lead-test-1",
        definition: card,
      });
      expect(renderedWithoutRecord).toBeUndefined();
    }
  });
});
