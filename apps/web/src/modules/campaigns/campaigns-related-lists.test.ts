import { describe, expect, it } from "vitest";
import {
  campaignsChildCampaignsTableColumns,
  campaignsContactsTableColumns,
  campaignsLeadsTableColumns,
  campaignsRelatedListRail,
  campaignsRelatedLists,
  createCampaignsRelatedLists,
} from "./campaigns-related-lists";

describe("campaignsRelatedLists definition", () => {
  it("rail keeps the metadata order and hides Locking Information and Checklists", () => {
    expect(campaignsRelatedLists.map((list) => list.title)).toEqual([
      "Connected Records",
      "Notes",
      "Child Campaigns",
      "Open Activities",
      "Attachments",
      "Closed Activities",
      "Leads",
      "Deals",
      "Contacts",
    ]);
    const orders = campaignsRelatedLists.map((list) => list.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);

    expect(campaignsRelatedLists.find((l) => l.id === "locking-information")).toBeUndefined();
    expect(campaignsRelatedLists.find((l) => l.id === "checklists")).toBeUndefined();
  });

  it("defines column definitions for Leads, Contacts, and Child Campaigns cards", () => {
    // GK-5 Leads columns: Lead Name, Member Status, Email, Phone
    expect(campaignsLeadsTableColumns.map((c) => c.label)).toEqual([
      "Lead Name",
      "Member Status",
      "Email",
      "Phone",
    ]);

    // GK-5 Contacts columns: Contact Name, Member Status, Email, Phone
    expect(campaignsContactsTableColumns.map((c) => c.label)).toEqual([
      "Contact Name",
      "Member Status",
      "Email",
      "Phone",
    ]);

    // GK-7 Child Campaigns columns: Campaign Name, Type, Status, Start Date, End Date, Campaign Owner
    expect(campaignsChildCampaignsTableColumns.map((c) => c.label)).toEqual([
      "Campaign Name",
      "Type",
      "Status",
      "Start Date",
      "End Date",
      "Campaign Owner",
    ]);

    const leadsCard = campaignsRelatedLists.find((c) => c.id === "leads");
    expect(leadsCard?.tableColumns?.map((c) => c.label)).toEqual([
      "Lead Name",
      "Member Status",
      "Email",
      "Phone",
    ]);

    const contactsCard = campaignsRelatedLists.find((c) => c.id === "contacts");
    expect(contactsCard?.tableColumns?.map((c) => c.label)).toEqual([
      "Contact Name",
      "Member Status",
      "Email",
      "Phone",
    ]);

    const childCard = campaignsRelatedLists.find((c) => c.id === "child-campaigns");
    expect(childCard?.tableColumns?.map((c) => c.label)).toEqual([
      "Campaign Name",
      "Type",
      "Status",
      "Start Date",
      "End Date",
      "Campaign Owner",
    ]);
  });

  it("configures Deals card according to GK-6 (Campaign Source matching and Accounts behaviour)", () => {
    const dealsCard = campaignsRelatedLists.find((c) => c.id === "deals");
    expect(dealsCard).toBeDefined();
    expect(dealsCard?.recordFilterField).toBe("Campaign_Source");
    expect(dealsCard?.railAction?.label).toBe("Add");
    expect(dealsCard?.railAction?.moduleKey).toBe("M4");
    expect(dealsCard?.upperControls?.map((ctrl) => ctrl.label)).toEqual(["Assign", "New Deal"]);
  });

  it("includes Member Status value in Leads and Contacts preview rows", () => {
    const previewLists = createCampaignsRelatedLists({ includePreview: true });

    const leads = previewLists.find((c) => c.id === "leads");
    expect(
      leads?.tableColumns?.some((c) => c.id === "memberStatus" && c.label === "Member Status"),
    ).toBe(true);
    expect(leads?.tablePreviewRows?.[0]?.cells?.memberStatus).toBe("Planned");

    const contacts = previewLists.find((c) => c.id === "contacts");
    expect(
      contacts?.tableColumns?.some((c) => c.id === "memberStatus" && c.label === "Member Status"),
    ).toBe(true);
    expect(contacts?.tablePreviewRows?.[0]?.cells?.memberStatus).toBe("Sent");
  });

  it("defines empty state text for all cards according to GK-8 and Accounts behaviour", () => {
    for (const card of campaignsRelatedLists) {
      if (card.id === "attachments") {
        expect(card.emptyStateText).toBe("No Attachment");
      } else if (card.id === "open-activities" || card.id === "closed-activities") {
        for (const col of card.activityColumns ?? []) {
          expect(col.emptyText).toBe("No records found");
        }
      } else {
        expect(card.emptyStateText).toBe("No records found");
      }
    }
  });

  it("supports rail badges when counts are supplied and hides zero count", () => {
    const populated = createCampaignsRelatedLists({
      badges: {
        notes: 2,
        leads: 3,
        contacts: 4,
        deals: 5,
        childCampaigns: 1,
        openActivities: 6,
        closedActivities: 7,
      },
    });

    expect(populated.find((c) => c.id === "notes")?.countBadge).toBe(2);
    expect(populated.find((c) => c.id === "leads")?.countBadge).toBe(3);
    expect(populated.find((c) => c.id === "contacts")?.countBadge).toBe(4);
    expect(populated.find((c) => c.id === "deals")?.countBadge).toBe(5);
    expect(populated.find((c) => c.id === "child-campaigns")?.countBadge).toBe(1);
    expect(populated.find((c) => c.id === "open-activities")?.countBadge).toBe(6);
    expect(populated.find((c) => c.id === "closed-activities")?.countBadge).toBe(7);

    const empty = createCampaignsRelatedLists({
      badges: { notes: 0, leads: 0, contacts: 0, deals: 0 },
    });
    expect(empty.find((c) => c.id === "notes")?.countBadge).toBeUndefined();
    expect(empty.find((c) => c.id === "leads")?.countBadge).toBeUndefined();
    expect(empty.find((c) => c.id === "contacts")?.countBadge).toBeUndefined();
    expect(empty.find((c) => c.id === "deals")?.countBadge).toBeUndefined();
  });

  it("rail chrome has organize aria label and Links group", () => {
    expect(campaignsRelatedListRail.organizeAriaLabel).toBe("Organize Campaigns Details");
    expect(campaignsRelatedListRail.linksGroup?.title).toBe("Links");
    expect(campaignsRelatedListRail.linksGroup?.addLink.label).toBe("Add Link");
  });
});
