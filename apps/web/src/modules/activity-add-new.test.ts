import { describe, expect, it } from "vitest";
import { activityPrefillFields } from "./activity-add-new";

const acct = { module: "Accounts", id: "a1", name: "Acme" };

describe("activityPrefillFields", () => {
  it("fills Who for Leads", () => {
    expect(activityPrefillFields("Leads", { id: "l1", fields: { Full_Name: "Ann Lee" } })).toEqual({
      Who_Id: { module: "Leads", id: "l1", name: "Ann Lee" },
    });
  });
  it("fills Who and the Account as What for Contacts", () => {
    expect(
      activityPrefillFields("Contacts", {
        id: "c1",
        fields: { Full_Name: "Bo", Account_Name: acct },
      }),
    ).toEqual({
      Who_Id: { module: "Contacts", id: "c1", name: "Bo" },
      What_Id: acct,
    });
  });
  it("fills What for Accounts and Deals", () => {
    expect(
      activityPrefillFields("Accounts", { id: "a1", fields: { Account_Name: "Acme" } }),
    ).toEqual({
      What_Id: acct,
    });
    expect(activityPrefillFields("Deals", { id: "d1", fields: { Deal_Name: "Big" } })).toEqual({
      What_Id: { module: "Deals", id: "d1", name: "Big" },
    });
  });
});

describe("campaign activity prefill", () => {
  it("fills What with the campaign", () => {
    expect(
      activityPrefillFields("Campaigns", { id: "c1", fields: { Campaign_Name: "Spring" } }),
    ).toEqual({ What_Id: { module: "Campaigns", id: "c1", name: "Spring" } });
  });
});
