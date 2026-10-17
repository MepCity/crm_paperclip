import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type { RecordInput, RecordService } from "./contract";

type Factory = (ctx: OrgContext) => RecordService | Promise<RecordService>;
const context = (): OrgContext => ({
  orgId: randomUUID(),
  orgSlug: "campaign-contract",
  orgName: "Campaign Contract",
  userId: "campaign-user",
  role: "admin",
});
const ref = (module: string, id: string) => ({ module, id });
/** Related-record contract shared by direct fixture and generic HTTP operations. */
export function describeCampaignMembershipContract(name: string, make: Factory): void {
  describe(`${name}: campaign membership contract`, () => {
    async function setup() {
      const service = await make(context());
      const campaign = await service.create("Campaigns", { Campaign_Name: "Synthetic Campaign" });
      const lead = await service.create("Leads", {
        Last_Name: "Synthetic Lead",
        Company: "Synthetic Company",
      });
      const contact = await service.create("Contacts", { Last_Name: "Synthetic Contact" });
      const base = { Campaign: ref("Campaigns", campaign.id) };
      const member = (extra: RecordInput = {}) =>
        service.create("Campaign_Members", { ...base, Lead: ref("Leads", lead.id), ...extra });
      return { service, campaign, lead, contact, base, member };
    }
    it("requires campaign and exactly one valid member, validates status and enforces composite uniqueness on create/update", async () => {
      const { service, lead, contact, base, member } = await setup();
      for (const input of [
        {},
        base,
        { ...base, Lead: ref("Leads", lead.id), Contact: ref("Contacts", contact.id) },
        { ...base, Lead: ref("Leads", "missing") },
        { ...base, Contact: ref("Contacts", "missing") },
      ])
        await expect(service.create("Campaign_Members", input)).rejects.toBeInstanceOf(
          ValidationError,
        );
      const a = await member();
      expect(a.fields.Member_Status).toBeNull();
      await expect(member()).rejects.toBeInstanceOf(ValidationError);
      await expect(member({ Member_Status: "Unknown" })).rejects.toBeInstanceOf(ValidationError);
      await expect(service.update("Campaign_Members", a.id, { Lead: null })).rejects.toBeInstanceOf(
        ValidationError,
      );
      const b = await member({
        Lead: null,
        Contact: ref("Contacts", contact.id),
        Member_Status: "Opened",
      });
      await expect(
        service.update("Campaign_Members", b.id, { Contact: null, Lead: ref("Leads", lead.id) }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(
        (await service.update("Campaign_Members", a.id, { Member_Status: "Responded" })).fields
          .Member_Status,
      ).toBe("Responded");
      await expect((await make(context())).get("Campaign_Members", a.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await service.delete("Campaign_Members", [a.id]);
      await expect(service.get("Campaign_Members", a.id)).rejects.toBeInstanceOf(NotFoundError);
    });
    it("reads both member types and reverse campaigns with status using list/count", async () => {
      const { service, campaign, lead, contact, member } = await setup();
      const a = await member({ Member_Status: "Sent" });
      const b = await member({
        Lead: null,
        Contact: ref("Contacts", contact.id),
        Member_Status: "Opened",
      });
      for (const [field, id, expected] of [
        ["Campaign", campaign.id, [a, b]],
        ["Lead", lead.id, [a]],
        ["Contact", contact.id, [b]],
      ] as const) {
        const query = {
          viewId: "all-campaign-members",
          filters: { field, comparator: "equal", value: id } as const,
        };
        const rows = (await service.list("Campaign_Members", { ...query, page: 1, perPage: 100 }))
          .records;
        expect(rows.map((row) => row.id).sort()).toEqual(expected.map((row) => row.id).sort());
        expect(rows.map((row) => row.fields.Member_Status).sort()).toEqual(
          expected.map((row) => row.fields.Member_Status).sort(),
        );
        expect(rows.every((row) => row.fields.Campaign !== null)).toBe(true);
        expect(await service.count("Campaign_Members", query)).toBe(expected.length);
      }
    });
    it.each(["Campaigns", "Leads", "Contacts"])(
      "cascades membership deletion from %s atomically",
      async (module) => {
        const { service, campaign, lead, contact, member } = await setup();
        const a = await member();
        const b = await member({ Lead: null, Contact: ref("Contacts", contact.id) });
        const id = module === "Campaigns" ? campaign.id : module === "Leads" ? lead.id : contact.id;
        await expect(service.delete(module, [id, "missing"])).rejects.toBeInstanceOf(NotFoundError);
        expect((await service.get("Campaign_Members", a.id)).id).toBe(a.id);
        await service.delete(module, [id]);
        const removed = module === "Contacts" ? b : a;
        await expect(service.get("Campaign_Members", removed.id)).rejects.toBeInstanceOf(
          NotFoundError,
        );
        if (module === "Campaigns")
          await expect(service.get("Campaign_Members", b.id)).rejects.toBeInstanceOf(NotFoundError);
        else
          expect(
            (await service.get("Campaign_Members", module === "Leads" ? b.id : a.id)).id,
          ).toBeDefined();
      },
    );
    it("filters child campaigns and deals, resolves Campaign Source and follows the common delete-reference rule", async () => {
      const { service, campaign } = await setup();
      const child = await service.create("Campaigns", {
        Campaign_Name: "Synthetic Child",
        Parent_Campaign: ref("Campaigns", campaign.id),
      });
      const grandchild = await service.create("Campaigns", {
        Campaign_Name: "Synthetic Grandchild",
        Parent_Campaign: ref("Campaigns", child.id),
      });
      await expect(
        service.update("Campaigns", campaign.id, {
          Parent_Campaign: ref("Campaigns", campaign.id),
        }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        service.update("Campaigns", campaign.id, {
          Parent_Campaign: ref("Campaigns", grandchild.id),
        }),
      ).rejects.toBeInstanceOf(ValidationError);
      const account = await service.create("Accounts", { Account_Name: "Synthetic Account" });
      const deal = await service.create("Deals", {
        Deal_Name: "Synthetic Deal",
        Account_Name: ref("Accounts", account.id),
        Stage: "Qualification",
        Closing_Date: "2026-12-15",
        Campaign_Source: ref("Campaigns", campaign.id),
      });
      expect(deal.fields.Campaign_Source).toEqual({
        ...ref("Campaigns", campaign.id),
        name: "Synthetic Campaign",
      });
      for (const [module, viewId, field, expected] of [
        ["Campaigns", "all-campaigns", "Parent_Campaign", child],
        ["Deals", "all-deals", "Campaign_Source", deal],
      ] as const) {
        const query = {
          viewId,
          filters: { field, comparator: "equal", value: campaign.id } as const,
        };
        expect(
          (await service.list(module, { ...query, page: 1, perPage: 100 })).records.map(
            (row) => row.id,
          ),
        ).toEqual([expected.id]);
        expect(await service.count(module, query)).toBe(1);
      }
      await service.delete("Campaigns", [campaign.id]);
      expect((await service.get("Deals", deal.id)).fields.Campaign_Source).toBeNull();
      expect((await service.get("Campaigns", child.id)).fields.Parent_Campaign).toBeNull();
    });
  });
}
